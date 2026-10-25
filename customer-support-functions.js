'use strict';
window.CustomerSupport = (() => {
  const INTERVAL=20000,MAX=20,RESPONSE_DELAY=900;
  const $=id=>document.getElementById(id);
  const questions=[
    ['Where exactly is Waterfront Cebu City Hotel & Casino located?','Is that in Lahug, Cebu City?','Thank you for helping me with the location!'],
    ['How much is the cheapest room per night?','Could you clarify whether that is a mock nightly rate?','Thanks! I will check the rate for my preferred dates.'],
    ['Do you have available rooms for two guests this weekend?','Would you need my arrival and departure dates to check?','Thank you. I understand availability needs to be checked.'],
    ['Are you currently hiring for housekeeping or front desk positions?','How should I inquire about current openings?','Thanks for explaining how I can inquire about a role.'],
    ['How can I book a room, and what payment methods do you accept?','What details should I prepare for a reservation?','Thank you for explaining the booking process.'],
    ['Can I stay in your hotel without paying? 😂','So I still need to follow the booking and payment rules?','Understood. Thanks for explaining politely!'],
    ['If I book one room, can my whole family of 15 stay there?','Would separate rooms be needed depending on the occupancy limits?','Thanks. I will ask about rooms suitable for our group.'],
    ['Can I check in now and decide when to check out later?','Should I choose my stay dates before confirming the booking?','Got it. I will prepare my planned departure date.'],
    ['Do you offer free food for guests who are always hungry?','Should I check which meals are included in the room package?','Thank you! I will check the meal inclusions first.'],
    ['Can I apply for a job while staying in your hotel room?','Should I contact the hiring team separately from my room booking?','Thanks for helping me understand the next step.'],
    ['What time can I check in at the hotel?','Should I confirm the check-in time with the front desk for my reservation?','Thank you. I will check the timing before arriving.'],
    ['Can I request an early check-in?','Does that depend on whether a room is ready?','Understood. I will inquire before arrival.'],
    ['How do I request extra towels?','Should I give my room number when contacting housekeeping?','Thank you for explaining how to request them.'],
    ['Can I ask for a late checkout?','Should I confirm availability and any additional charge first?','Thanks. I will check before extending my stay.'],
    ['Is breakfast included in my room booking?','Should I review the inclusions of my selected package?','Thanks. I will check the package details.'],
    ['Where can I ask about parking for my visit?','Can the front desk clarify parking availability and any fees?','Thank you. I will confirm the arrangements.'],
    ['Can I request a quiet room?','Would that request still depend on room availability?','Understood. Thank you for your help.'],
    ['I left an item in my room. Who should I contact?','Should I provide my stay dates and a description of the item?','Thanks. I will provide those details to the hotel.'],
    ['How do I ask about laundry service?','Should I check the service hours and charges before requesting it?','Thank you for explaining what to ask.'],
    ['Can I change the dates of my reservation?','Does that depend on my booking terms and room availability?','Thanks. I will review my reservation details first.']
  ];
  let state,key,activeId=null,toastTimer;
  const save=()=>localStorage.setItem(key,JSON.stringify(state));
  const active=()=>state.chats.find(chat=>chat.id===activeId);
  const pending=()=>state.chats.filter(chat=>!chat.done).length;
  function createState(){
    const names=['Sofia','Miguel','Andrea','Paolo','Bianca','Carlo','Jasmine','Rafael','Nina','Marco','Isabel','Gabriel','Clara','Luis','Maya','Diego','Elena','Adrian','Camila','Enzo'];
    for(let i=names.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[names[i],names[j]]=[names[j],names[i]];}
    return {startedAt:Date.now(),onDuty:false,nextArrivalAt:null,names,chats:[]};
  }
  function render(){
    $('support-time-in').hidden=state.onDuty;
    $('support-time-out').hidden=!state.onDuty;
    $('support-duty-status').textContent=state.onDuty?'Timed in · Accepting guest chats':'Timed out · Guest chats paused';
    const count=pending();$('support-badge').textContent=String(count);
    $('support-toggle').setAttribute('aria-label',`Customer support: ${count} pending chats`);
    $('support-queue-count').textContent=`${state.chats.length} / ${MAX} guests arrived · ${count} pending`;
    $('support-queue-count').hidden=true;
    const select=$('support-guest');select.replaceChildren();
    if(!state.chats.length){const option=document.createElement('option');option.textContent='Waiting for the first guest…';option.value='';select.append(option);}
    state.chats.forEach(chat=>{const option=document.createElement('option');option.value=chat.id;option.textContent=`${chat.name}${chat.done?' · Completed':' · Pending'}`;select.append(option);});
    if(!active())activeId=state.chats.find(chat=>!chat.done)?.id||state.chats[0]?.id||null;
    select.value=activeId||'';select.disabled=!state.chats.length;
    const chat=active(),messages=$('support-messages');messages.replaceChildren();
    if(!chat){const empty=document.createElement('p');empty.className='muted support-empty';empty.hidden=state.onDuty;empty.textContent=state.onDuty?'Your first guest will arrive after 20 seconds. A maximum of 20 guests will arrive.':'Click Time In for Customer Support to begin a fresh round at 0 / 20 guests.';messages.append(empty);}
    else{
      chat.messages.forEach(message=>{const bubble=document.createElement('div');bubble.className=`support-bubble ${message.role}`;const label=document.createElement('strong');label.textContent=message.role==='operator'?'You':chat.name;const text=document.createElement('p');text.textContent=message.text;bubble.append(label,text);messages.append(bubble);});
      if(chat.replyDue&&state.onDuty){const typing=document.createElement('p');typing.className='muted support-typing';typing.textContent=`${chat.name} is typing…`;messages.append(typing);}
      if(chat.done){const complete=document.createElement('p');complete.className='support-complete';complete.textContent='Conversation complete · 2 replies and 2 guest responses.';messages.append(complete);}
    }
    $('support-reply').disabled=!state.onDuty||!chat||chat.done||Boolean(chat.replyDue);
    $('support-send').disabled=!state.onDuty||!chat||chat.done||Boolean(chat.replyDue);
    $('support-progress').hidden=!chat;
    $('support-progress').textContent=chat?`${chat.replies} / 2 operator replies · ${chat.responses} / 2 guest responses`:'Mock chat simulation · No messages are sent to real guests.';
    messages.scrollTop=messages.scrollHeight;
  }
  function tick(){
    if(!state.onDuty)return;
    const now=Date.now();let changed=false,arrived=0;
    while(state.chats.length<MAX&&state.nextArrivalAt&&now>=state.nextArrivalAt){
      const index=state.chats.length;state.chats.push({id:`CS-${index+1}`,name:state.names[index],question:index,messages:[{role:'guest',text:questions[index][0]}],replies:0,responses:0,done:false,replyDue:null});changed=true;arrived++;
      state.nextArrivalAt+=INTERVAL;
    }
    state.chats.forEach(chat=>{if(chat.replyDue&&chat.replyDue<=now){chat.messages.push({role:'guest',text:questions[chat.question][chat.replies]});chat.responses++;chat.replyDue=null;if(chat.responses===2)chat.done=true;changed=true;}});
    if(changed){save();render();}
    if(arrived){const newest=state.chats[state.chats.length-1];$('support-toast').textContent=arrived===1?`${newest.name} has a hotel question.`:`${arrived} guest chats are waiting.`;$('support-toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('support-toast').hidden=true,4500);}
  }
  function init(){
    key=`hotel-customer-support-v1:${JSON.stringify(PerformanceReport.studentDetails())}`;
    try{const saved=JSON.parse(localStorage.getItem(key));state=saved&&Number.isFinite(saved.startedAt)&&Array.isArray(saved.names)&&saved.names.length===MAX&&Array.isArray(saved.chats)&&saved.chats.length<=MAX&&saved.chats.every(chat=>chat&&Number.isInteger(chat.question)&&chat.question>=0&&chat.question<MAX&&Array.isArray(chat.messages)&&Number.isInteger(chat.replies)&&chat.replies>=0&&chat.replies<=2&&Number.isInteger(chat.responses)&&chat.responses>=0&&chat.responses<=2)?saved:createState();}catch{state=createState();}
    // Page loads always begin timed out; a prior conversation is kept without offline arrivals.
    state.onDuty=false;state.nextArrivalAt=null;
    state.chats.forEach(chat=>{if(chat.replyDue){chat.replyRemaining=Math.min(RESPONSE_DELAY,Math.max(0,chat.replyDue-Date.now()));chat.replyDue=null;}});
    save();
    $('support-time-in').addEventListener('click',()=>{
      if(state.onDuty)return;
      state=createState();activeId=null;$('support-reply').value='';
      clearTimeout(toastTimer);$('support-toast').hidden=true;
      state.onDuty=true;state.nextArrivalAt=Date.now()+INTERVAL;
      save();render();
    });
    $('support-time-out').addEventListener('click',()=>{
      if(!state.onDuty)return;
      if(!window.confirm('Confirm to time out of Customer Support? Guest arrivals and messages will stop. Your next Time In starts a fresh round at 0 / 20.'))return;
      state.onDuty=false;state.nextArrivalAt=null;
      state.chats.forEach(chat=>{if(chat.replyDue){chat.replyRemaining=Math.max(0,chat.replyDue-Date.now());chat.replyDue=null;}});
      clearTimeout(toastTimer);$('support-toast').hidden=true;save();render();
    });
    $('support-toggle').addEventListener('click',()=>{const panel=$('support-panel');panel.hidden=!panel.hidden;$('support-toggle').setAttribute('aria-expanded',String(!panel.hidden));$('support-toast').hidden=true;if(!panel.hidden){tick();render();$('support-close').focus();}});
    $('support-close').addEventListener('click',()=>{$('support-panel').hidden=true;$('support-toggle').setAttribute('aria-expanded','false');$('support-toggle').focus();});
    $('support-guest').addEventListener('change',()=>{activeId=$('support-guest').value;$('support-reply').value='';render();});
    $('support-panel').addEventListener('keydown',event=>{if(event.key==='Escape')$('support-close').click();});
    $('support-form').addEventListener('submit',event=>{
      event.preventDefault();const chat=active(),text=$('support-reply').value.trim();
      if(!state.onDuty||!chat||chat.done||chat.replyDue||chat.replies>=2||!text)return;
      chat.messages.push({role:'operator',text:text.slice(0,1500)});chat.replies++;chat.replyDue=Date.now()+RESPONSE_DELAY;
      $('support-reply').value='';save();render();
    });
    render();tick();setInterval(tick,250);
  }
  return {init};
})();
