'use strict';
window.Housekeeping = (() => {
  const $=id=>document.getElementById(id);
  let tasks=[],storageKey,selectedId=null,step=0,onConfirmed;
  function progress(){const total=tasks.length || window.HOUSE_KEEPING_DATA.length;const confirmed=tasks.filter(t=>t.status==='confirmed').length;const ongoing=tasks.filter(t=>t.status==='ongoing').length;return {total,confirmed,ongoing,awaitingValidation:tasks.filter(t=>t.status==='pending').length,pending:total-confirmed};}
  function persist(){localStorage.setItem(storageKey,JSON.stringify(tasks.map(({id,status,workStatus,confirmedAt})=>({id,status,workStatus,confirmedAt}))));}
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
      const badge=document.createElement('span');badge.className=`badge ${task.status}`;badge.textContent=task.status==='confirmed'?'CONFIRMED':task.status==='ongoing'?'ONGOING':'PENDING';row.insertCell().append(badge);
      const button=document.createElement('button');button.type='button';button.className=task.status==='confirmed'?'secondary':'primary';button.textContent=task.status==='confirmed'?'View details':task.status==='ongoing'?'Review ongoing work':'Validate';button.addEventListener('click',()=>open(task.id));row.insertCell().append(button);
    });
    if(!matching.length){const cell=body.insertRow().insertCell();cell.colSpan=5;cell.className='muted';cell.textContent='No housekeeping tasks match your search.';}
    $('housekeeping-count').textContent=`${matching.length} of ${tasks.length} tasks · ${pending} pending · ${progress().ongoing} ongoing · ${progress().confirmed} confirmed`;
  }
  function updateSteps(){
    const task=tasks.find(t=>t.id===selectedId),finished=task?.status==='confirmed';
    const completed=finished||task?.workStatus==='completed';
    $('housekeeping-work-status').textContent=`Status: ${completed?'Completed':'Ongoing'}`;
    $('housekeeping-work-update').value=completed?'completed':'ongoing';
    $('housekeeping-work-update').disabled=finished;
    const buttons=['housekeeping-check-work','housekeeping-check-room','housekeeping-final'];
    buttons.forEach((id,i)=>{$(id).disabled=finished||i!==step;});
    $('housekeeping-final').disabled=finished||step!==2||!completed;
    $('housekeeping-ongoing').disabled=finished||completed||step!==2||task?.status==='ongoing';
    $('housekeeping-step-status').textContent=finished?'This task is completed and confirmed.':step===0?'Step 1 of 3: review the housekeeping task.':step===1?'Step 2 of 3: review the assigned officer’s update.':completed?'Step 3 of 3: work is Completed. Click Final confirm.':task?.status==='ongoing'?'Work is still Ongoing. Update the mock status to Completed when ready for Final confirm.':'Step 3 of 3: work is Ongoing. Click On going.';
  }
  function open(id){
    const task=tasks.find(t=>t.id===id);if(!task)return;
    selectedId=id;step=task.status==='ongoing'?2:0;
    $('housekeeping-dialog-title').textContent=`${task.id} · Room ${task.room}`;
    $('housekeeping-assigned').textContent=`Assigned officer: ${task.officer}`;
    $('housekeeping-instructions').textContent=`${task.task}: ${task.instructions}`;
    updateSteps();$('housekeeping-dialog').showModal();
  }
  function init(afterConfirmed){
    onConfirmed=afterConfirmed;
    storageKey=`hotel-housekeeping-v1:${JSON.stringify(PerformanceReport.studentDetails())}`;
    let saved=[];try{const value=JSON.parse(localStorage.getItem(storageKey));if(Array.isArray(value))saved=value;}catch{}
    tasks=window.HOUSE_KEEPING_DATA.map(base=>{const prior=saved.find(t=>t&&t.id===base.id);return {...base,status:['confirmed','ongoing'].includes(prior?.status)?prior.status:'pending',workStatus:prior?.status==='confirmed'?'completed':['ongoing','completed'].includes(prior?.workStatus)?prior.workStatus:prior?.status==='ongoing'?'ongoing':base.workStatus,confirmedAt:prior?.confirmedAt || null};});
    $('housekeeping-work-update').addEventListener('change',()=>{
      const task=tasks.find(t=>t.id===selectedId&&t.status!=='confirmed');
      if(!task||!['ongoing','completed'].includes($('housekeeping-work-update').value))return;
      task.workStatus=$('housekeeping-work-update').value;persist();updateSteps();
    });
    $('housekeeping-search').addEventListener('input',render);$('housekeeping-sort').addEventListener('change',render);
    $('housekeeping-close').addEventListener('click',()=>$('housekeeping-dialog').close());
    $('housekeeping-dialog').addEventListener('close',()=>{selectedId=null;step=0;});
    $('housekeeping-check-work').addEventListener('click',()=>{if(selectedId&&step===0){step=1;updateSteps();}});
    $('housekeeping-check-room').addEventListener('click',()=>{if(selectedId&&step===1){step=2;updateSteps();}});
    $('housekeeping-ongoing').addEventListener('click',()=>{
      if(step!==2||!$('housekeeping-dialog').open)return;
      const task=tasks.find(t=>t.id===selectedId&&t.status==='pending'&&t.workStatus==='ongoing');if(!task)return;
      task.status='ongoing';task.confirmedAt=null;persist();$('housekeeping-dialog').close();render();
      $('housekeeping-message').textContent=`${task.id} · Room ${task.room}: ONGOING. Removed from the pending badge; final confirmation is still required.`;
      if(onConfirmed)onConfirmed();
    });
    $('housekeeping-final').addEventListener('click',()=>{
      if(step!==2||!$('housekeeping-dialog').open)return;
      const task=tasks.find(t=>t.id===selectedId&&['pending','ongoing'].includes(t.status)&&t.workStatus==='completed');if(!task)return;
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
