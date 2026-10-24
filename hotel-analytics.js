'use strict';
window.HotelAnalytics = (() => {
  let getState;
  const pageSize = 10;
  let currentPage = 1;
  const $ = id => document.getElementById(id);
  const labels = {pending:'PENDING',new:'New Guest',confirmed:'CONFIRMED BOOKED',cancelled:'CANCELLED',refund:'REFUND'};
  const money = n => new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(n);
  const day = date => new Date(`${date}T00:00:00Z`);
  const shortDate = date => day(date).toLocaleDateString('en-PH',{month:'short',day:'numeric',timeZone:'UTC'});
  function records() {
    const live = new Map(getState().guests.map(g => [g.id,g]));
    return window.GUESTS_DATA.map(base => {
      const guest = live.get(base.id) || base;
      return {...guest,...guest.enteredDetails};
    });
  }
  function aggregate(guests) {
    const events = new Map(), rooms = new Map();
    guests.forEach(g => {
      if (!events.has(g.checkIn)) events.set(g.checkIn,{date:g.checkIn,checkIn:0,checkOut:0});
      if (!events.has(g.checkOut)) events.set(g.checkOut,{date:g.checkOut,checkIn:0,checkOut:0});
      events.get(g.checkIn).checkIn++; events.get(g.checkOut).checkOut++;
      rooms.set(g.room,(rooms.get(g.room)||0)+1);
    });
    const dates = [...events.keys()].sort(), daily = [];
    if (dates.length) {
      for (let time=+day(dates[0]);time<=+day(dates[dates.length-1]);time+=86400000) {
        const date = new Date(time).toISOString().slice(0,10);
        daily.push(events.get(date) || {date,checkIn:0,checkOut:0});
      }
    }
    return {daily,rooms:[...rooms].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])),nights:guests.reduce((sum,g)=>sum+g.nights,0),amount:guests.reduce((sum,g)=>sum+g.amount,0)};
  }
  function element(tag,attrs={},text) {
    const node = document.createElementNS('http://www.w3.org/2000/svg',tag);
    Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,String(value)));
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function plot(id,title) {
    const svg = $(id); svg.replaceChildren(); svg.setAttribute('viewBox','0 0 720 320');
    svg.append(element('title',{},title)); return svg;
  }
  function lineChart(daily) {
    const svg = plot('analytics-line-chart','Daily check-ins and check-outs for matching guest records');
    if (!daily.length) { svg.append(element('text',{x:360,y:160,'text-anchor':'middle',fill:'#7a887f'},'No matching stays')); return; }
    const max = Math.max(1,...daily.map(d=>Math.max(d.checkIn,d.checkOut)));
    const x = i => daily.length===1?390:60+i*630/(daily.length-1), y = n => 260-n*210/max;
    for(let n=0;n<=max;n++) {
      svg.append(element('line',{x1:60,y1:y(n),x2:690,y2:y(n),stroke:'#e6ecdf'}));
      svg.append(element('text',{x:45,y:y(n)+4,'text-anchor':'end',fill:'#7a887f','font-size':12},n));
    }
    [['checkIn','#315d42'],['checkOut','#bd8d43']].forEach(([key,color])=>{
      svg.append(element('path',{d:daily.map((d,i)=>`${i?'L':'M'}${x(i)},${y(d[key])}`).join(' '),fill:'none',stroke:color,'stroke-width':3}));
      daily.forEach((d,i)=>{const dot=element('circle',{cx:x(i),cy:y(d[key]),r:3,fill:color});dot.append(element('title',{},`${d.date}: ${d[key]} ${key==='checkIn'?'check-ins':'check-outs'}`));svg.append(dot);});
    });
    [...new Set([0,Math.floor((daily.length-1)/4),Math.floor((daily.length-1)/2),Math.floor((daily.length-1)*3/4),daily.length-1])].forEach(i=>svg.append(element('text',{x:x(i),y:290,'text-anchor':'middle',fill:'#7a887f','font-size':12},shortDate(daily[i].date))));
  }
  function barChart(rooms) {
    const svg = plot('analytics-bar-chart','Number of matching guest bookings by room type');
    if (!rooms.length) { svg.append(element('text',{x:360,y:160,'text-anchor':'middle',fill:'#7a887f'},'No matching rooms'));return; }
    const max = Math.max(...rooms.map(r=>r[1])), step = Math.min(52,240/rooms.length);
    rooms.forEach(([room,count],i)=>{
      const y = 40+i*step;
      svg.append(element('text',{x:175,y:y+19,'text-anchor':'end',fill:'#526b4c','font-size':13},room));
      const bar=element('rect',{x:190,y,width:count/max*440,height:Math.min(28,step-8),rx:4,fill:'#83a85f'});bar.append(element('title',{},`${room}: ${count} bookings`));svg.append(bar);
      svg.append(element('text',{x:200+count/max*440,y:y+19,fill:'#315d42','font-size':13},count));
    });
    svg.append(element('text',{x:410,y:298,'text-anchor':'middle',fill:'#7a887f','font-size':12},'Guest bookings · highest count first'));
  }
  function render() {
    const query=$('analytics-search').value.trim().toLowerCase(),status=$('analytics-status').value,room=$('analytics-room').value,from=$('analytics-from').value,to=$('analytics-to').value;
    const invalid=from&&to&&from>to;
    $('analytics-error').textContent=invalid?'Check-in from date must be on or before the to date.':'';
    const guests=invalid?[]:records().filter(g=>`${g.id} ${g.name} ${g.email}`.toLowerCase().includes(query)&&(status==='all'||g.status===status)&&(room==='all'||g.room===room)&&(!from||g.checkIn>=from)&&(!to||g.checkIn<=to));
    const sort=$('analytics-sort').value;
    guests.sort((a,b)=>sort==='amount'?b.amount-a.amount:sort==='name'?a.name.localeCompare(b.name):String(a[sort==='checkout'?'checkOut':'checkIn']).localeCompare(String(b[sort==='checkout'?'checkOut':'checkIn']))||a.id.localeCompare(b.id));
    const data=aggregate(guests);
    $('analytics-guests').textContent=guests.length; $('analytics-nights').textContent=data.nights; $('analytics-value').textContent=money(data.amount);
    const totalPages = Math.max(1,Math.ceil(guests.length/pageSize));
    currentPage = Math.min(currentPage,totalPages);
    const offset = (currentPage-1)*pageSize;
    $('analytics-count').textContent=`Showing ${guests.length ? offset+1 : 0}–${Math.min(offset+pageSize,guests.length)} of ${guests.length} matching records`;
    $('analytics-page').textContent=`Page ${currentPage} of ${totalPages}`;
    $('analytics-prev').disabled=currentPage===1;
    $('analytics-next').disabled=currentPage===totalPages;
    lineChart(data.daily);barChart(data.rooms);
    const rows=$('analytics-rows');rows.replaceChildren();
    guests.slice(offset,offset+pageSize).forEach(g=>{const row=rows.insertRow();[g.id,g.name,labels[g.status]||g.status,g.room,g.checkIn,g.checkOut,g.nights,money(g.amount)].forEach(value=>row.insertCell().textContent=value);});
    if(!guests.length){const cell=rows.insertRow().insertCell();cell.colSpan=8;cell.className='muted';cell.textContent='No guest records match these filters.';}
    const dailyRows=$('analytics-daily-rows');dailyRows.replaceChildren();data.daily.forEach(d=>{const row=dailyRows.insertRow();[d.date,d.checkIn,d.checkOut].forEach(v=>row.insertCell().textContent=v);});
    if(!data.daily.length){const cell=dailyRows.insertRow().insertCell();cell.colSpan=3;cell.textContent='No chart data.';}
  }
  function init(read) {
    getState=read;
    [...new Set(window.GUESTS_DATA.map(g=>g.room))].sort().forEach(room=>{const option=document.createElement('option');option.value=room;option.textContent=room;$('analytics-room').append(option);});
    ['analytics-search','analytics-status','analytics-room','analytics-from','analytics-to','analytics-sort'].forEach(id=>$(id).addEventListener(id==='analytics-search'?'input':'change',()=>{currentPage=1;render();}));
    $('analytics-prev').addEventListener('click',()=>{if(currentPage>1){currentPage--;render();}});
    $('analytics-next').addEventListener('click',()=>{if(!$('analytics-next').disabled){currentPage++;render();}});
    $('analytics-reset').addEventListener('click',()=>{currentPage=1;['analytics-search','analytics-from','analytics-to'].forEach(id=>$(id).value='');['analytics-status','analytics-room'].forEach(id=>$(id).value='all');$('analytics-sort').value='checkin';render();});
  }
  return {init,render,aggregate};
})();
