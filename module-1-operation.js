'use strict';
(() => {
  if (sessionStorage.getItem('hotel-auth') !== 'student') { window.location.replace('index.html'); return; }
  const KEY = 'checkin-module1-v1';
  const initial = (count = window.GUESTS_DATA.length, minutes = 2) => ({ configured:false, targetMinutes:minutes, startedAt: null, finishedAt: null, guests: window.GUESTS_DATA.slice(0,count).map(g => ({ ...g, status:g.status || (g.bookingType === 'new' ? 'new' : 'pending') })) });
  const isActionable = guest => guest && ['pending','new'].includes(guest.status);
  const hasCredentials = details => details && ['name','email','phone','address','nationality'].every(key => typeof details[key] === 'string' && details[key].trim());
  let state;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    state = initial();
    if (saved && Array.isArray(saved.guests)) {
      if (saved.configured === true && Number.isInteger(saved.targetMinutes) && saved.targetMinutes >= 1 && saved.targetMinutes <= 60) {
        const ids = new Set(saved.guests.map(g => g.id));
        state.guests = state.guests.filter(g => ids.has(g.id));
        state.configured = state.guests.length > 0;
        state.targetMinutes = saved.targetMinutes;
      }
      // Match by ID so new records appear without losing existing booking progress.
      state.guests = state.guests.map(guest => {
        const previous = saved.guests.find(g => g.id === guest.id);
        if (!previous || !['new','pending','confirmed','cancelled','refund'].includes(previous.status)) return guest;
        if (previous.status === 'confirmed' && (!previous.payment || !Number.isFinite(previous.confirmedAt))) return guest;
        return { ...guest, status:['cancelled','refund'].includes(guest.status) ? guest.status : previous.status === 'confirmed' ? 'confirmed' : guest.status, openedAt:previous.openedAt, confirmedAt:previous.confirmedAt, payment:previous.payment, enteredDetails:hasCredentials(previous.enteredDetails) ? previous.enteredDetails : undefined };
      });
      state.startedAt = Number.isFinite(saved.startedAt) ? saved.startedAt : null;
      state.student = saved.student || PerformanceReport.studentDetails();
      state.activityLog = Array.isArray(saved.activityLog) ? saved.activityLog.filter(row => row && typeof row.bookingId === 'string' && (state.guests.some(g => g.id === row.bookingId) || window.GUESTS_DATA.some(g => g.id === row.bookingId && g.status === 'cancelled'))).map(row => ({bookingId:row.bookingId,remarks:typeof row.remarks === 'string' ? row.remarks.slice(0,1000) : ''})) : [];
      state.finishedAt = Number.isFinite(saved.finishedAt) ? saved.finishedAt : null;
      if (state.finishedAt && ActivityLog.progress(state).done !== ActivityLog.progress(state).total) {
        state.startedAt = Date.now() - Math.max(0, state.finishedAt - (state.startedAt || state.finishedAt));
        state.finishedAt = null;
      }
    }
  } catch { state = initial(); }
  let selected = null, method = 'qr', imageUrl = null, announcedFinish = null;
  const $ = id => document.getElementById(id);
  const money = amount => new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(amount);
  const date = value => new Date(`${value}T00:00:00`).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'});
  const save = () => {
    ActivityLog.sync(state);
    const tasks = ActivityLog.progress(state);
    const complete = state.configured && state.startedAt && tasks.done === tasks.total && AnalysisReport.progress().pending === 0 && Housekeeping.progress().pending === 0;
    if (complete && !state.finishedAt) state.finishedAt = Date.now();
    if (!complete && state.finishedAt) { state.startedAt += Date.now() - state.finishedAt; state.finishedAt = null; }
    localStorage.setItem(KEY, JSON.stringify(state));
  };
  function announceCompletion() {
    PerformanceReport.render(state);
    if (state.finishedAt && state.finishedAt !== announcedFinish && AnalysisReport.progress().pending === 0 && Housekeeping.progress().pending === 0 && !$('completion-dialog').open) {
      announcedFinish = state.finishedAt; $('completion-dialog').showModal();
    }
    if (!state.finishedAt) announcedFinish = null;
  }
  ActivityLog.init(() => state, save, announceCompletion);
  HotelAnalytics.init(() => state);
  Housekeeping.init(() => { save(); announceCompletion(); });
  CreateResume.init();
  HotelDashboard.init();
  CustomerSupport.init();
  AnalysisReport.init(request => {
    HotelAnalytics.applyDateRange(request.from,request.to);
    window.location.hash = 'hotel-analytics'; show('hotel-analytics');
  }, () => { save(); announceCompletion(); });
  // Reopen older completed sessions if their analysis or housekeeping tasks are still pending.
  if (state.finishedAt && (AnalysisReport.progress().pending > 0 || Housekeeping.progress().pending > 0)) {
    state.startedAt += Date.now() - state.finishedAt; state.finishedAt = null; save();
  }
  PerformanceReport.initSetup(() => state, (count, minutes) => {
    state = initial(count, minutes); state.configured = true; state.startedAt = Date.now(); state.student = PerformanceReport.studentDetails();
    selected = null; save();
    $('search').value = ''; $('status-filter').value = 'all'; $('sort').value = 'id';
    $('booking-notice').textContent = `Simulation started: ${count} guests in ${minutes} minute${minutes === 1 ? '' : 's'}. The timer is running.`;
    $('booking-notice').hidden = false;
    window.location.hash = 'bookings'; show('bookings');
  });
  function show(view) {
    ActivityLog.sync(state);
    ['dashboard','bookings','guest-entry','payment','performance','activity-log','hotel-analytics','analysis-report','housekeeping','create-resume'].forEach(name => { $(`${name}-view`).hidden = name !== view; });
    $('nav-dashboard').classList.toggle('active',view === 'dashboard');
    $('nav-bookings').classList.toggle('active',['bookings','guest-entry','payment'].includes(view)); $('nav-performance').classList.toggle('active',view === 'performance'); $('nav-activity-log').classList.toggle('active',view === 'activity-log'); $('nav-hotel-analytics').classList.toggle('active',view === 'hotel-analytics'); $('nav-analysis-report').classList.toggle('active',view === 'analysis-report'); $('nav-housekeeping').classList.toggle('active',view === 'housekeeping'); $('nav-create-resume').classList.toggle('active',view === 'create-resume');
    $('breadcrumb').textContent = view === 'dashboard' ? 'Dashboard' : view === 'create-resume' ? 'Create your own Resume' : view === 'housekeeping' ? 'Housekeeping' : view === 'analysis-report' ? 'Analysis Report' : view === 'hotel-analytics' ? 'Hotel Analytics' : view === 'activity-log' ? 'Activity log' : view === 'performance' ? 'Performance Report' : view === 'payment' ? 'Booking Request / Payment' : view === 'guest-entry' ? 'Booking Request / New Guest' : 'Booking Request';
    if (view === 'bookings') renderBookings();
    if (view === 'activity-log') ActivityLog.render();
    if (view === 'hotel-analytics') HotelAnalytics.render();
    if (view === 'analysis-report') AnalysisReport.render();
    if (view === 'housekeeping') Housekeeping.render();
    PerformanceReport.render(state);
  }
  function renderBookings() {
    const confirmed = state.guests.filter(g => g.status === 'confirmed').length;
    $('total-count').textContent = state.guests.length; $('pending-count').textContent = state.guests.filter(isActionable).length; $('confirmed-count').textContent = confirmed;
    $('request-count').textContent = `(${state.guests.length})`;
    const query = $('search').value.trim().toLowerCase(), filter = $('status-filter').value;
    const guests = state.guests.filter(g => `${g.id} ${g.name} ${g.email} ${g.phone} ${g.enteredDetails?.name || ''} ${g.enteredDetails?.email || ''}`.toLowerCase().includes(query) && (filter === 'all' || g.status === filter));
    const sort = $('sort').value; guests.sort((a,b) => sort === 'amount' ? a.amount-b.amount : String(a[sort === 'name' ? 'name' : sort === 'date' ? 'checkIn' : 'id']).localeCompare(String(b[sort === 'name' ? 'name' : sort === 'date' ? 'checkIn' : 'id'])));
    const body = $('booking-rows'); body.replaceChildren();
    guests.forEach(g => {
      const display = g.enteredDetails || g;
      const row = body.insertRow(); row.insertCell().textContent = g.id;
      const guestCell = row.insertCell(); const guest = document.createElement('div'); guest.className='guest'; const avatar=document.createElement('span'); avatar.className='avatar'; avatar.textContent=display.name.split(' ').map(n=>n[0]).join(''); const details=document.createElement('div'); details.append(document.createTextNode(display.name)); const email=document.createElement('small'); email.textContent=display.email; details.append(email); guest.append(avatar,details); guestCell.append(guest);
      const stay=row.insertCell(); stay.textContent=g.room; const dates=document.createElement('small'); dates.textContent=`${date(g.checkIn)} · ${g.nights} nights`; stay.append(dates);
      row.insertCell().textContent=money(g.amount); const badge=document.createElement('span'); badge.className=`badge ${g.status}`; badge.textContent=g.status==='confirmed'?'CONFIRMED BOOKED':g.status==='new'?'New Guest':g.status==='cancelled'?'CANCELLED':g.status==='refund'?'REFUND':'PENDING'; row.insertCell().append(badge);
      const button=document.createElement('button'); button.className=isActionable(g)?'primary':'secondary'; button.textContent=g.status==='new'?'Book this guest →':g.status==='pending'?'Confirm booking →':g.status==='confirmed'?'Completed ✓':'Unavailable'; button.disabled=!isActionable(g); button.addEventListener('click',()=>g.bookingType==='new'?openGuestEntry(g.id):openPayment(g.id)); row.insertCell().append(button);
      const undoCell = row.insertCell();
      if (g.status === 'confirmed') {
        const undo = document.createElement('button'); undo.className = 'secondary'; undo.textContent = 'Undo ↶';
        undo.setAttribute('aria-label', `Undo booking for ${g.name}`);
        undo.addEventListener('click', () => undoBooking(g.id)); undoCell.append(undo);
      } else { undoCell.textContent = '—'; undoCell.className = 'muted'; }
      const remarks = row.insertCell(); remarks.className = 'guest-remarks'; remarks.textContent = ['cancelled','refund'].includes(g.status) ? (g.guestRemarks || 'Guest requested ' + g.status + ' due to a problem.') : 'N/A';
    });
    if(!guests.length){const cell=body.insertRow().insertCell();cell.colSpan=8;cell.textContent='No bookings match your search or filter.';cell.className='muted';}
    $('results-count').textContent=`Showing ${guests.length} of ${state.guests.length} requests`;
  }
  function undoBooking(id) {
    const guest = state.guests.find(g => g.id === id);
    if (!guest || guest.status !== 'confirmed') return;
    // Resume a completed session without charging time spent on the completed screen.
    if (state.finishedAt && state.startedAt) state.startedAt += Date.now() - state.finishedAt;
    state.finishedAt = null;
    guest.status = guest.bookingType === 'new' ? 'new' : 'pending';
    delete guest.payment; delete guest.confirmedAt; delete guest.openedAt; delete guest.enteredDetails;
    // If no completed or previously opened bookings remain, the next booking starts fresh.
    if (state.guests.every(g => g.status !== 'confirmed' && !g.openedAt)) state.startedAt = state.configured ? Date.now() : null;
    save();
    $('booking-notice').textContent = `${guest.id} · ${guest.name}: booking undone. Status is ${guest.status === 'new' ? 'New Guest' : 'PENDING'} and payment is cleared. You can book this guest again.`;
    $('booking-notice').hidden = false;
    renderBookings(); PerformanceReport.render(state);
  }
  const credentialFields = [['name','Full name'],['email','Email address'],['phone','Phone number'],['address','Address'],['nationality','Nationality']];
  function openGuestEntry(id) {
    if (!state.configured) { show('performance'); PerformanceReport.openSetup(state); return; }
    selected = state.guests.find(g => g.id === id && g.bookingType === 'new' && isActionable(g));
    if (!selected) return;
    if (!selected.openedAt) selected.openedAt = Date.now();
    save();
    const reference = window.GUESTS_DATA.find(g => g.id === id);
    $('guest-reference').replaceChildren();
    credentialFields.forEach(([key,label]) => {
      const line = document.createElement('div'); line.className = 'detail';
      const title = document.createElement('span'); title.textContent = label;
      const value = document.createElement('strong'); value.textContent = reference[key]; line.append(title,value); $('guest-reference').append(line);
      $(`entry-${key}`).value = selected.enteredDetails?.[key] || '';
    });
    $('guest-entry-error').textContent = '';
    window.location.hash = `guest-entry/${id}`; show('guest-entry');
  }
  $('guest-entry-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!selected || selected.bookingType !== 'new' || !isActionable(selected)) return;
    const details = Object.fromEntries(credentialFields.map(([key]) => [key,$(`entry-${key}`).value.trim()]));
    if (!hasCredentials(details) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email) || !/^[+\d\s().-]{7,30}$/.test(details.phone)) {
      $('guest-entry-error').textContent = 'Fill in all five credentials with a valid email and phone number.'; return;
    }
    selected.enteredDetails = details; save(); openPayment(selected.id);
  });
  $('back-entry-bookings').addEventListener('click', () => { window.location.hash = 'bookings'; });
  function openPayment(id) {
    if (!state.configured) { show('performance'); PerformanceReport.openSetup(state); return; }
    selected=state.guests.find(g=>g.id===id); if(!isActionable(selected))return;
    if (selected.bookingType === 'new' && !hasCredentials(selected.enteredDetails)) { openGuestEntry(id); return; }
    const now=Date.now(); if(!state.startedAt)state.startedAt=now; if(!selected.openedAt)selected.openedAt=now; save();
    $('guest-summary').replaceChildren();
    const details = selected.enteredDetails || selected;
    [['Booking ID',selected.id],['Guest',details.name],['Email',details.email],['Phone',details.phone],['Address',details.address],['Nationality',details.nationality],['Room',selected.room],['Check-in',date(selected.checkIn)],['Check-out',date(selected.checkOut)],['Stay',`${selected.nights} nights · ${selected.occupants} guests`],['Total amount',money(selected.amount)]].forEach(([label,value])=>{const div=document.createElement('div');div.className='detail';const key=document.createElement('span');key.textContent=label;const val=document.createElement('strong');val.textContent=value;div.append(key,val);$('guest-summary').append(div);});
    $('cash-due').textContent=money(selected.amount);$('cash-received').value='';$('qr-confirmed').checked=false;$('payment-error').textContent='';setMethod('qr');
    window.location.hash=`payment/${id}`;show('payment');
  }
  function setMethod(value){method=value;$('qr-fields').hidden=value!=='qr';$('cash-fields').hidden=value!=='cash';['qr','cash'].forEach(m=>{$(`method-${m}`).classList.toggle('selected',m===value);$(`method-${m}`).setAttribute('aria-pressed',String(m===value));});updatePayment();}
  function updatePayment(){
    if(!selected)return;
    const raw=$('cash-received').value, cash=Number(raw), valid=raw!==''&&Number.isFinite(cash)&&cash>=selected.amount&&Math.abs(cash*100-Math.round(cash*100))<0.00001;
    $('cash-change').textContent=money(valid?cash-selected.amount:0);
    $('cash-hint').textContent=raw===''?'Enter the cash received to calculate change.':valid?'Payment covers the total. Return the change shown above.':`Enter a valid amount of at least ${money(selected.amount)} (up to 2 decimal places).`;
    $('proceed-payment').disabled=method==='qr'?!$('qr-confirmed').checked:!valid;
  }
  $('proceed-payment').addEventListener('click',()=>{
    if(!selected||selected.status==='confirmed')return;
    if(selected.bookingType==='new'&&!hasCredentials(selected.enteredDetails))return;
    updatePayment(); if($('proceed-payment').disabled)return;
    const cash=Number($('cash-received').value);selected.status='confirmed';selected.confirmedAt=Date.now();selected.payment={method,amount:selected.amount,received:method==='cash'?cash:selected.amount,change:method==='cash'?Math.round((cash-selected.amount)*100)/100:0};
    save();$('booking-notice').textContent=`${selected.id} · ${selected.enteredDetails?.name || selected.name}: payment completed. CONFIRMED BOOKED.${method==='cash'?` Return ${money(selected.payment.change)} change.`:''}${state.finishedAt?' All guests are complete. View your final performance report.':''}`;$('booking-notice').hidden=false;selected=null;window.location.hash='bookings';show('bookings');
    announceCompletion();
  });
  $('method-qr').addEventListener('click',()=>setMethod('qr'));$('method-cash').addEventListener('click',()=>setMethod('cash'));$('cash-received').addEventListener('input',updatePayment);$('qr-confirmed').addEventListener('change',updatePayment);
  $('qr-upload').addEventListener('change',()=>{const file=$('qr-upload').files[0];if(!file)return;if(!file.type.startsWith('image/')){$('payment-error').textContent='Choose an image file for your QR code.';return;}if(imageUrl)URL.revokeObjectURL(imageUrl);imageUrl=URL.createObjectURL(file);$('custom-qr').src=imageUrl;$('custom-qr').hidden=false;$('demo-qr').hidden=true;$('payment-error').textContent='';});
  // Deliberately illustrative pattern: this demo never initiates a transaction.
  const svg=$('demo-qr');const ns='http://www.w3.org/2000/svg';
  function rect(x,y,w,h,color){const r=document.createElementNS(ns,'rect');Object.entries({x,y,width:w,height:h,fill:color}).forEach(([k,v])=>r.setAttribute(k,v));svg.append(r);}
  rect(0,0,210,210,'white');for(let y=0;y<21;y++)for(let x=0;x<21;x++)if((x*17+y*13+x*y)%7<3)rect(x*8+21,y*8+21,8,8,'#214d3d');[[21,21],[133,21],[21,133]].forEach(([x,y])=>{rect(x,y,56,56,'#214d3d');rect(x+8,y+8,40,40,'white');rect(x+16,y+16,24,24,'#214d3d');});
  ['search','status-filter','sort'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',renderBookings));
  $('back-bookings').addEventListener('click',()=>{window.location.hash='bookings';});
  $('logout').addEventListener('click',()=>{sessionStorage.removeItem('hotel-auth');window.location.href='index.html';});
  $('reset-session').addEventListener('click',()=>{if(!window.confirm('Reset all guest bookings, payments, activity remarks, analysis reports, housekeeping tasks, and the session score?'))return;state=initial();selected=null;announcedFinish=null;AnalysisReport.reset();Housekeeping.reset();save();$('booking-notice').hidden=true;window.location.hash='bookings';show('bookings');});
  $('nav-performance').addEventListener('click', event => { event.preventDefault(); if (window.location.hash === '#performance') { show('performance'); PerformanceReport.openSetup(state); } else window.location.hash = 'performance'; });
  window.addEventListener('message', event => {
    if (event.source !== $('completion-frame').contentWindow || event.data?.type !== 'hotel-operation-complete' || !$('completion-dialog').open) return;
    if (!['close','report'].includes(event.data.action)) return;
    $('completion-dialog').close();
    if (event.data.action === 'report') {
      // Bypass the new-session setup modal when viewing this completed report.
      window.location.hash = 'performance/current'; show('performance');
    }
  });
  function route(){const hash=window.location.hash.slice(1);if(!hash||hash==='dashboard'){show('dashboard');}else if(hash==='create-resume'){show('create-resume');}else if(hash==='housekeeping'){show('housekeeping');}else if(hash==='analysis-report'){show('analysis-report');}else if(hash==='hotel-analytics'){show('hotel-analytics');}else if(hash==='activity-log'){show('activity-log');}else if(hash==='performance/current'){show('performance');}else if(hash==='performance'){show('performance');PerformanceReport.openSetup(state);}else if(hash.startsWith('guest-entry/')){const id=hash.slice(12);const guest=state.guests.find(g=>g.id===id&&g.bookingType==='new'&&isActionable(g));if(guest)openGuestEntry(id);else{window.location.hash='bookings';show('bookings');}}else if(hash.startsWith('payment/')){const id=hash.slice(8);const guest=state.guests.find(g=>g.id===id&&isActionable(g));if(guest)openPayment(id);else{window.location.hash='bookings';show('bookings');}}else show('bookings');}
  window.addEventListener('hashchange',route);route();setInterval(()=>PerformanceReport.render(state),250);
})();
