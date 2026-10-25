'use strict';
window.Housekeeping = (() => {
  const $=id=>document.getElementById(id);
  let tasks=[],storageKey,selectedId=null,step=0,onConfirmed;
  function progress(){const total=tasks.length || window.HOUSE_KEEPING_DATA.length;const confirmed=tasks.filter(t=>t.status==='confirmed').length;return {total,confirmed,pending:total-confirmed};}
  function persist(){localStorage.setItem(storageKey,JSON.stringify(tasks.map(({id,status,confirmedAt})=>({id,status,confirmedAt}))));}
  function render(){
    const pending=tasks.filter(task=>task.status==='pending').length;
    $('housekeeping-notification').textContent=String(pending);$('housekeeping-notification').hidden=pending===0;
    $('housekeeping-notification').setAttribute('aria-label',`${pending} housekeeping tasks pending`);
    const query=$('housekeeping-search').value.trim().toLowerCase(),sort=$('housekeeping-sort').value;
    const matching=tasks.filter(task=>`${task.id} ${task.room} ${task.task} ${task.officer} ${task.status}`.toLowerCase().includes(query));
    matching.sort((a,b)=>sort==='officer'?a.officer.localeCompare(b.officer)||a.id.localeCompare(b.id):sort==='room'?a.room.localeCompare(b.room,undefined,{numeric:true}):sort==='pending'?(a.status===b.status?a.id.localeCompare(b.id):a.status==='pending'?-1:1):a.id.localeCompare(b.id));
    const body=$('housekeeping-rows');body.replaceChildren();
    matching.forEach(task=>{
      const row=body.insertRow();row.insertCell().textContent=task.id;
      const details=row.insertCell();details.className='housekeeping-task';const title=document.createElement('strong');title.textContent=`Room ${task.room} · ${task.task}`;const description=document.createElement('small');description.textContent=task.instructions;details.append(title,description);
      row.insertCell().textContent=task.officer;
      const badge=document.createElement('span');badge.className=`badge ${task.status}`;badge.textContent=task.status==='confirmed'?'CONFIRMED':'PENDING';row.insertCell().append(badge);
      const button=document.createElement('button');button.type='button';button.className=task.status==='confirmed'?'secondary':'primary';button.textContent=task.status==='confirmed'?'Confirmed ✓':'Validate';button.disabled=task.status==='confirmed';button.addEventListener('click',()=>open(task.id));row.insertCell().append(button);
    });
    if(!matching.length){const cell=body.insertRow().insertCell();cell.colSpan=5;cell.className='muted';cell.textContent='No housekeeping tasks match your search.';}
    $('housekeeping-count').textContent=`${matching.length} of ${tasks.length} tasks · ${pending} pending · ${tasks.length-pending} confirmed`;
  }
  function updateSteps(){
    const buttons=['housekeeping-check-work','housekeeping-check-room','housekeeping-final'];
    buttons.forEach((id,i)=>{$(id).disabled=i!==step;});
    $('housekeeping-step-status').textContent=step===0?'Step 1 of 3: confirm the housekeeping work.':step===1?'Step 2 of 3: confirm the room inspection.':'Step 3 of 3: final confirmation is ready.';
  }
  function open(id){
    const task=tasks.find(t=>t.id===id&&t.status==='pending');if(!task)return;
    selectedId=id;step=0;
    $('housekeeping-dialog-title').textContent=`${task.id} · Room ${task.room}`;
    $('housekeeping-assigned').textContent=`Assigned officer: ${task.officer}`;
    $('housekeeping-instructions').textContent=`${task.task}: ${task.instructions}`;
    updateSteps();$('housekeeping-dialog').showModal();
  }
  function init(afterConfirmed){
    onConfirmed=afterConfirmed;
    storageKey=`hotel-housekeeping-v1:${JSON.stringify(PerformanceReport.studentDetails())}`;
    let saved=[];try{const value=JSON.parse(localStorage.getItem(storageKey));if(Array.isArray(value))saved=value;}catch{}
    tasks=window.HOUSE_KEEPING_DATA.map(base=>{const prior=saved.find(t=>t&&t.id===base.id);return {...base,status:prior?.status==='confirmed'?'confirmed':'pending',confirmedAt:prior?.confirmedAt || null};});
    $('housekeeping-search').addEventListener('input',render);$('housekeeping-sort').addEventListener('change',render);
    $('housekeeping-close').addEventListener('click',()=>$('housekeeping-dialog').close());
    $('housekeeping-dialog').addEventListener('close',()=>{selectedId=null;step=0;});
    $('housekeeping-check-work').addEventListener('click',()=>{if(selectedId&&step===0){step=1;updateSteps();}});
    $('housekeeping-check-room').addEventListener('click',()=>{if(selectedId&&step===1){step=2;updateSteps();}});
    $('housekeeping-final').addEventListener('click',()=>{
      if(step!==2||!$('housekeeping-dialog').open)return;
      const task=tasks.find(t=>t.id===selectedId&&t.status==='pending');if(!task)return;
      task.status='confirmed';task.confirmedAt=Date.now();persist();$('housekeeping-dialog').close();render();
      $('housekeeping-message').textContent=`${task.id} · Room ${task.room}: CONFIRMED.`;
      if(onConfirmed)onConfirmed();
    });
    render();
  }
  function reset(){
    tasks=window.HOUSE_KEEPING_DATA.map(task=>({...task,status:'pending',confirmedAt:null}));
    selectedId=null;step=0;$('housekeeping-dialog').close();
    $('housekeeping-search').value='';$('housekeeping-sort').value='id';$('housekeeping-message').textContent='';
    persist();render();
  }
  return {init,render,progress,reset};
})();
