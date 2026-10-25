'use strict';
window.AnalysisReport = (() => {
  const $ = id => document.getElementById(id);
  let requests = [], storageKey, openAnalytics, afterSubmit, editingId = null;
  function progress() {
    const total = requests.length || window.ANALYSIS_REQUEST_DATA.length;
    const submitted = requests.filter(r=>r.status==='submitted').length;
    return {total,submitted,pending:total-submitted};
  }
  const date = value => new Date(`${value}T00:00:00Z`).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
  const range = request => `${date(request.from)} – ${date(request.to)}`;
  function persist() { localStorage.setItem(storageKey,JSON.stringify(requests.map(({id,status,remark,submittedAt})=>({id,status,remark,submittedAt})))); }
  function badge() {
    const pending = requests.filter(r=>r.status==='pending').length;
    $('analysis-notification').textContent=String(pending); $('analysis-notification').hidden=pending===0;
    $('analysis-notification').setAttribute('aria-label',`${pending} analysis reports pending`);
  }
  function visit(request) { $('analysis-dialog').close(); openAnalytics(request); }
  function edit(request) {
    editingId=request.id;
    $('analysis-dialog-title').textContent=`${request.id} · ${request.title}`;
    $('analysis-task').textContent=`Navigate to Hotel Analytics and filter check-in dates from ${range(request)}. ${request.task}`;
    $('analysis-remark').value=request.remark || ''; $('analysis-submit-error').textContent='';
    $('analysis-submit').textContent=request.status==='submitted'?'Update submitted report':'Submit analysis report';
    $('analysis-dialog').showModal();
  }
  function render() {
    badge(); const query=$('analysis-search').value.trim().toLowerCase(),status=$('analysis-status').value;
    const matching=requests.filter(r=>`${r.id} ${r.title} ${r.task} ${r.from} ${r.to} ${range(r)} ${r.remark || ''}`.toLowerCase().includes(query)&&(status==='all'||r.status===status));
    const sort=$('analysis-sort').value;
    matching.sort((a,b)=>sort==='latest'?b.from.localeCompare(a.from):sort==='title'?a.title.localeCompare(b.title):sort==='pending'?(a.status===b.status?a.from.localeCompare(b.from):a.status==='pending'?-1:1):a.from.localeCompare(b.from));
    const body=$('analysis-request-rows');body.replaceChildren();
    matching.forEach(request=>{
      const row=body.insertRow();row.insertCell().textContent=request.id;
      const task=row.insertCell();task.className='analysis-task-cell';const title=document.createElement('strong');title.textContent=request.title;const instructions=document.createElement('p');instructions.textContent=`Navigate to Hotel Analytics, filter ${range(request)}, and describe what happened. ${request.task}`;task.append(title,instructions);
      row.insertCell().textContent=range(request);
      const statusBadge=document.createElement('span');statusBadge.className=`badge ${request.status==='submitted'?'confirmed':'pending'}`;statusBadge.textContent=request.status==='submitted'?'ANALYSIS REPORT SUBMITTED':'PENDING';row.insertCell().append(statusBadge);
      const remark=row.insertCell();remark.className='analysis-task-cell';remark.textContent=request.remark || 'No analysis submitted yet.';
      const actions=row.insertCell();const analytics=document.createElement('button');analytics.className='secondary';analytics.type='button';analytics.textContent='Open Hotel Analytics';analytics.addEventListener('click',()=>visit(request));
      const report=document.createElement('button');report.className='primary';report.type='button';report.textContent=request.status==='submitted'?'View / edit report':'Add analysis remark';report.addEventListener('click',()=>edit(request));actions.append(analytics,report);actions.className='analysis-actions';
    });
    if(!matching.length){const cell=body.insertRow().insertCell();cell.colSpan=6;cell.textContent='No analysis requests match your search or filter.';cell.className='muted';}
    $('analysis-result-count').textContent=`${matching.length} of ${requests.length} requests · ${requests.filter(r=>r.status==='submitted').length} submitted`;
  }
  function init(navigate, onSubmitted) {
    openAnalytics=navigate; afterSubmit=onSubmitted;
    storageKey=`hotel-analysis-reports-v1:${JSON.stringify(PerformanceReport.studentDetails())}`;
    let saved=[];try{const value=JSON.parse(localStorage.getItem(storageKey));if(Array.isArray(value))saved=value;}catch{}
    requests=window.ANALYSIS_REQUEST_DATA.map(base=>{const previous=saved.find(r=>r&&r.id===base.id);const remark=typeof previous?.remark==='string'?previous.remark.slice(0,5000):'';return {...base,remark,status:previous?.status==='submitted'&&remark.trim()?'submitted':'pending',submittedAt:previous?.submittedAt || null};});
    ['analysis-search','analysis-status','analysis-sort'].forEach(id=>$(id).addEventListener(id==='analysis-search'?'input':'change',render));
    $('analysis-dialog-close').addEventListener('click',()=>$('analysis-dialog').close());
    $('analysis-dialog-analytics').addEventListener('click',()=>{const request=requests.find(r=>r.id===editingId);if(request)visit(request);});
    $('analysis-remark').addEventListener('input',()=>{const request=requests.find(r=>r.id===editingId);if(request?.status==='pending'){request.remark=$('analysis-remark').value.slice(0,5000);persist();}});
    $('analysis-submit-form').addEventListener('submit',event=>{
      event.preventDefault();const request=requests.find(r=>r.id===editingId);if(!request)return;
      const remark=$('analysis-remark').value.trim();if(!remark){$('analysis-submit-error').textContent='Describe your analysis before submitting the report.';return;}
      request.remark=remark.slice(0,5000);request.status='submitted';request.submittedAt=Date.now();persist();$('analysis-dialog').close();render();
      $('analysis-message').textContent=`${request.id}: ANALYSIS REPORT SUBMITTED.`;
      if (afterSubmit) afterSubmit();
    });
    badge();
  }
  function reset() {
    requests = window.ANALYSIS_REQUEST_DATA.map(request => ({...request,status:'pending',remark:'',submittedAt:null}));
    editingId = null;
    $('analysis-dialog').close();
    $('analysis-search').value = ''; $('analysis-status').value = 'all'; $('analysis-sort').value = 'earliest';
    $('analysis-remark').value = ''; $('analysis-message').textContent = ''; $('analysis-submit-error').textContent = '';
    persist(); render();
  }
  return {init,render,progress,reset};
})();
