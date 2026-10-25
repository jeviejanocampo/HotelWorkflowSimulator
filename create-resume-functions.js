'use strict';
// Standalone document module: no simulation badges, timers, or task dependencies.
window.CreateResume = (() => {
  const $=id=>document.getElementById(id);
  const groups={
    education:{title:'Education',fields:[['school','School / Institution Name'],['location','Location'],['degree','Degree / Program'],['graduation','Graduation Date'],['coursework','Relevant Coursework']]},
    work:{title:'Work Experience',fields:[['company','Company Name'],['title','Job Title'],['role','Employment Type / Role Description'],['location','Work Location'],['start','Start Date'],['end','End Date']]},
    leadership:{title:'Leadership Experience and Activities',fields:[['organization','Organization Name'],['title','Position / Leadership Role'],['location','Location'],['start','Start Date'],['end','End Date']]}
  };
  const blank=()=>({name:'',city:'',email:'',phone:'',education:[{}],work:[{bullets:['']}],leadership:[{bullets:['']}],technical:'',professional:'',languages:[{language:'',proficiency:'Proficient'}],interests:''});
  let model=blank(),key;
  const node=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
  function save(){localStorage.setItem(key,JSON.stringify(model));}
  function field(label,value,onChange,type='text'){
    const wrap=node('label','resume-field',label),input=node('input');input.type=type;input.value=value||'';input.maxLength=1000;
    input.addEventListener('input',()=>{onChange(input.value);save();});wrap.append(input);return wrap;
  }
  function button(text,callback,className='secondary') {const el=node('button',className,text);el.type='button';el.addEventListener('click',callback);return el;}
  function render(){
    const form=$('resume-fields');form.replaceChildren();
    const personal=node('section','card');personal.append(node('h2',null,'1. Personal Information'));
    const personalGrid=node('div','resume-grid');[['name','Full Name'],['city','City / Province'],['email','Email Address'],['phone','Phone Number']].forEach(([id,label])=>personalGrid.append(field(label,model[id],v=>model[id]=v,id==='email'?'email':id==='phone'?'tel':'text')));personal.append(personalGrid);form.append(personal);
    Object.entries(groups).forEach(([group,definition],index)=>{
      const section=node('section','card');const heading=node('div','heading');heading.append(node('h2',null,`${index+2}. ${definition.title}`),button('Add another entry',()=>{model[group].push(group==='education'?{}:{bullets:['']});save();render();}));section.append(heading);
      model[group].forEach((record,recordIndex)=>{
        const entry=node('div','resume-entry'),bar=node('div','resume-entry-bar');bar.append(node('strong',null,`Entry ${recordIndex+1}`),button('Remove entry',()=>{model[group].splice(recordIndex,1);save();render();}));entry.append(bar);
        const grid=node('div','resume-grid');definition.fields.forEach(([id,label])=>grid.append(field(label,record[id],v=>record[id]=v)));entry.append(grid);
        if(group!=='education'){
          entry.append(node('p','field-label','Responsibilities and Achievements'));
          (record.bullets||=[]).forEach((text,i)=>{const row=node('div','resume-bullet');row.append(field(`Bullet ${i+1}`,text,v=>record.bullets[i]=v),button('Remove',()=>{record.bullets.splice(i,1);save();render();}));entry.append(row);});
          entry.append(button('+ Add achievement bullet',()=>{record.bullets.push('');save();render();}));
        }
        section.append(entry);
      });form.append(section);
    });
    const skills=node('section','card');skills.append(node('h2',null,'5. Skills and Interests'));const grid=node('div','resume-grid');[['technical','Technical Skills'],['professional','Professional Skills'],['interests','Interests']].forEach(([id,label])=>grid.append(field(label,model[id],v=>model[id]=v)));skills.append(grid,node('p','field-label','Languages (with proficiency level)'));
    model.languages.forEach((language,i)=>{
      const row=node('div','resume-language');row.append(field('Language',language.language,v=>language.language=v));
      const label=node('label','resume-field','Proficiency level'),select=node('select');['Native','Fluent','Proficient','Intermediate','Basic','Learning'].forEach(level=>{const option=node('option',null,level);option.value=level;select.append(option);});select.value=language.proficiency;select.addEventListener('change',()=>{language.proficiency=select.value;save();});label.append(select);row.append(label,button('Remove',()=>{model.languages.splice(i,1);save();render();}));skills.append(row);
    });skills.append(button('+ Add language',()=>{model.languages.push({language:'',proficiency:'Proficient'});save();render();}));form.append(skills);
  }
  function example(){
    // One fixed fictional example, replaceable by the user's own details.
    return {name:'Alexandra M. Reyes',city:'Dumaguete City, Negros Oriental',email:'alexandra.reyes@example.com',phone:'+63 917 555 0123',
      education:[{school:'Asian College - Dumaguete Campus',location:'Dumaguete City',degree:'Bachelor of Science in Tourism Management',graduation:'May 2027 (Expected)',coursework:'Front Office Operations, Tourism Planning, Hospitality Management, Customer Service'}],
      work:[{company:'Seaside Hotel',title:'Front Desk Intern',role:'Internship',location:'Dumaguete City',start:'June 2026',end:'August 2026',bullets:['Assisted with guest check-ins, booking inquiries, and room information.','Prepared guest records and coordinated room readiness with housekeeping.']},{company:'Island Travel Services',title:'Guest Services Assistant',role:'Part-time',location:'Dumaguete City',start:'January 2026',end:'May 2026',bullets:['Responded to travel inquiries and helped prepare local itinerary information.']}],
      leadership:[{organization:'Tourism Student Society',title:'Events Committee Officer',location:'Dumaguete City',start:'August 2025',end:'Present',bullets:['Coordinated student volunteers and registration for campus tourism events.','Prepared event announcements and assisted with participant communications.']}],
      technical:'Microsoft Office, Google Workspace, Canva',professional:'Guest communication, Teamwork, Problem-solving, Attention to detail',languages:[{language:'Cebuano',proficiency:'Native'},{language:'Filipino',proficiency:'Fluent'},{language:'English',proficiency:'Proficient'}],interests:'Local heritage, Travel planning, Photography, Community tourism'};
  }
  function init(){
    key=`hotel-resume-v1:${JSON.stringify(PerformanceReport.studentDetails())}`;
    try{const saved=JSON.parse(localStorage.getItem(key));if(saved&&Array.isArray(saved.education)&&Array.isArray(saved.work)&&Array.isArray(saved.leadership)&&Array.isArray(saved.languages))model={...blank(),...saved};}catch{}
    render();
    $('resume-example').addEventListener('click',()=>{if(model.name&&!window.confirm('Replace your resume draft with the example data?'))return;model=example();save();render();$('resume-message').textContent='One fictional example loaded. Edit the fields to make it your own.';});
    $('resume-generate').addEventListener('click',async()=>{
      if(!model.name.trim()){$('resume-message').textContent='Enter your full name before generating your resume.';return;}
      $('resume-generate').disabled=true;$('resume-message').textContent='Generating your US Letter resume…';
      try{const blob=await createPdf(JSON.parse(JSON.stringify(model)));const url=URL.createObjectURL(blob),link=node('a');link.href=url;link.download=`${model.name.replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').trim().slice(0,100)} - Resume.pdf`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);$('resume-message').textContent='Resume generated. Check your browser downloads.';}catch(error){console.error(error);$('resume-message').textContent='Could not generate the resume. Please try again.';}finally{$('resume-generate').disabled=false;}
    });
  }
  async function createPdf(data){
    // US Letter, rendered at 144 dpi for Unicode names and consistent offline output.
    const pages=[];let canvas,ctx,y;const left=36,right=576,width=540,bottom=750;
    function page(){canvas=document.createElement('canvas');canvas.width=1224;canvas.height=1584;ctx=canvas.getContext('2d');ctx.scale(2,2);ctx.fillStyle='#fff';ctx.fillRect(0,0,612,792);ctx.fillStyle='#171717';pages.push(canvas);y=38;}
    const font=(size=10.5,style='')=>{ctx.font=`${style} ${size}px Arial`.trim();};
    function wrap(text,maxWidth,size=10.5,style=''){
      font(size,style);const lines=[];let line='';for(const word of String(text||'').trim().split(/\s+/)){if(!word)continue;if(line&&ctx.measureText(line+' '+word).width>maxWidth){lines.push(line);line='';}for(const char of word){if(ctx.measureText(line+char).width>maxWidth&&line){lines.push(line);line='';}line+=char;}line+=' ';}if(line.trim())lines.push(line.trim());return lines;
    }
    function ensure(height){if(y+height>bottom)page();}
    function text(value,x=left,maxWidth=width,size=10.5,style='',align='left'){
      const lines=wrap(value,maxWidth,size,style);for(const line of lines){ensure(size*1.35);font(size,style);ctx.textAlign=align;ctx.fillText(line,x,y);y+=size*1.35;}ctx.textAlign='left';return lines.length;
    }
    function section(title){ensure(64);y+=12;font(14,'bold');ctx.fillText(title,left,y);y+=8;ctx.fillRect(left,y,width,1);y+=19;}
    function pair(a,b,style='bold'){
      const l=wrap(a,355,10.5,style),r=wrap(b,170,10.5,style);ensure(Math.max(l.length,r.length)*14+18);const start=y;font(10.5,style);
      l.forEach((line,i)=>{ctx.textAlign='left';ctx.fillText(line,left,start+i*14);});r.forEach((line,i)=>{ctx.textAlign='right';ctx.fillText(line,right,start+i*14);});ctx.textAlign='left';y+=Math.max(l.length,r.length)*14;
    }
    function bullet(value){if(!String(value||'').trim())return;const lines=wrap(value,504);ensure(Math.min(lines.length,3)*14);font();ctx.fillText('•',48,y);text(value,63,504);y+=3;}
    function labeled(label,value){if(!String(value||'').trim())return;const words=[...[{text:label+' ',bold:true}],...String(value).split(/\s+/).map(word=>({text:word+' ',bold:false}))];let x=left;ensure(15);
      words.forEach(part=>{font(10.5,part.bold?'bold':'');for(const char of part.text){const w=ctx.measureText(char).width;if(x+w>right){y+=14;ensure(14);x=left;font(10.5,part.bold?'bold':'');}ctx.fillText(char,x,y);x+=w;}});y+=15;
    }
    const hasEntry=record=>Object.values(record).some(v=>Array.isArray(v)?v.some(t=>String(t).trim()):String(v||'').trim());
    page();const nameLines=wrap((data.name||'').toUpperCase(),width,28,'bold');nameLines.forEach(line=>{font(28,'bold');ctx.textAlign='center';ctx.fillText(line,306,y+16);y+=34;});ctx.textAlign='left';y+=3;text([data.city,data.email,data.phone].filter(Boolean).join(' | '),306,width,10.5,'','center');y+=10;
    const education=data.education.filter(hasEntry);if(education.length){section('EDUCATION');education.forEach(record=>{pair((record.school||'').toUpperCase(),record.location||'');pair(record.degree||'',record.graduation||'','italic');if(record.coursework)bullet('Relevant Coursework: '+record.coursework);y+=6;});}
    [['work','WORK EXPERIENCE'],['leadership','LEADERSHIP EXPERIENCE AND ACTIVITIES']].forEach(([group,title])=>{const records=data[group].filter(hasEntry);if(!records.length)return;section(title);records.forEach(record=>{pair((record.company||record.organization||'').toUpperCase(),record.location||'');pair([record.title,record.role].filter(Boolean).join(' - '),[record.start,record.end].filter(Boolean).join(' - '),'italic');(record.bullets||[]).forEach(bullet);y+=7;});});
    if([data.technical,data.professional,data.interests].some(v=>String(v||'').trim())||data.languages.some(l=>l.language.trim())){section('SKILLS AND INTERESTS');labeled('TECHNICAL:',data.technical);labeled('SKILLS:',data.professional);labeled('LANGUAGES:',data.languages.filter(l=>l.language.trim()).map(l=>`${l.language} (${l.proficiency})`).join(', '));labeled('INTERESTS:',data.interests);}
    return pdfFromPages(pages);
  }
  function pdfFromPages(pages){
    const encoder=new TextEncoder(),chunks=[],offsets=[0];let length=0;const add=value=>{const bytes=typeof value==='string'?encoder.encode(value):value;chunks.push(bytes);length+=bytes.length;};const object=(id,value)=>{offsets[id]=length;add(`${id} 0 obj\n${value}\nendobj\n`);};add('%PDF-1.4\n');object(1,'<< /Type /Catalog /Pages 2 0 R >>');object(2,`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] >>`);
    pages.forEach((canvas,i)=>{const id=3+i*3,bytes=Uint8Array.from(atob(canvas.toDataURL('image/jpeg',0.95).split(',')[1]),c=>c.charCodeAt(0));object(id,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im0 ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`);offsets[id+1]=length;add(`${id+1} 0 obj\n<< /Type /XObject /Subtype /Image /Width 1224 /Height 1584 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);add(bytes);add('\nendstream\nendobj\n');const content='q 612 0 0 792 0 0 cm /Im0 Do Q';object(id+2,`<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`);});const xref=length;add(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);for(let id=1;id<offsets.length;id++)add(`${String(offsets[id]).padStart(10,'0')} 00000 n \n`);add(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);return new Blob(chunks,{type:'application/pdf'});
  }
  return {init,createPdf,example};
})();
