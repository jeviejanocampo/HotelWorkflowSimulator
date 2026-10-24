'use strict';
// Timing and score are based on wall-clock timestamps, including page reloads.
window.PerformanceReport = (() => {
  function studentDetails() {
    try { const s = JSON.parse(sessionStorage.getItem('hotel-student')) || {}; return {studentId:String(s.studentId || ''),fullName:String(s.fullName || ''),section:String(s.section || '')}; }
    catch { return {studentId:'',fullName:'',section:''}; }
  }
  const formatTime = ms => { const seconds = Math.floor(Math.max(0, ms) / 1000); return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; };
  function metrics(state, now = Date.now()) {
    const elapsed = state.startedAt ? Math.max(0, (state.finishedAt || now) - state.startedAt) : 0;
    const target = (state.targetMinutes || 2) * 60000;
    const penalty = Math.min(50, Math.floor(Math.max(0, elapsed - target) / 5000) * 2);
    return { elapsed, penalty, score: 50 - penalty };
  }
  function render(state) {
    const student = state.student || studentDetails();
    document.getElementById('report-student-id').textContent = student.studentId || '—';
    document.getElementById('report-student-name').textContent = student.fullName || '—';
    document.getElementById('report-student-section').textContent = student.section || '—';
    document.getElementById('signed-in-student').textContent = studentDetails().fullName || 'Student';
    const eligible = state.guests.filter(g => !['cancelled','refund'].includes(g.status));
    const minutes = state.targetMinutes || 2;
    const timeLabel = `${minutes} minute${minutes === 1 ? '' : 's'}`;
    document.getElementById('booking-target').textContent = state.configured ? `${state.guests.length} guests · ${timeLabel} target` : 'Set up a simulation in Performance Report';
    document.getElementById('report-target').textContent = `Target: ${timeLabel}`;
    document.getElementById('report-guest-rule').textContent = `Complete ${eligible.length} available guest bookings. Cancelled records require operator remarks in Activity log; refund remarks are optional.`;
    document.getElementById('report-time-rule').textContent = `Within ${timeLabel}:`;
    const { elapsed, penalty, score } = metrics(state);
    const completed = state.guests.filter(g => g.status === 'confirmed');
    const tasks = ActivityLog.progress(state);
    document.getElementById('report-task-progress').textContent = `Total tasks: ${tasks.done} / ${tasks.total} · Bookings: ${tasks.booked} / ${tasks.bookings} · Cancelled remarks: ${tasks.remarked} / ${tasks.cancelled}`;
    document.getElementById('time-score').textContent = score;
    document.getElementById('penalty').textContent = `${penalty} pts`;
    document.getElementById('report-completed').textContent = `${completed.length} / ${eligible.length}`;
    document.getElementById('elapsed').textContent = formatTime(elapsed);
    document.getElementById('session-status').textContent = state.finishedAt ? 'Session complete' : state.startedAt ? '● In progress' : 'Not started';
    document.getElementById('elapsed-label').textContent = state.startedAt ? `${Math.floor(elapsed / 60000)} minute${Math.floor(elapsed / 60000) === 1 ? '' : 's'} ${Math.floor(elapsed / 1000) % 60} seconds` : 'Ready when you are';
    document.getElementById('score-caption').textContent = state.finishedAt ? 'Final time score' : state.startedAt ? 'Live time score' : 'Available score · configure a session';
    document.getElementById('time-meter').style.width = `${Math.min(100, elapsed / (minutes * 600))}%`;
    document.getElementById('time-meter').style.background = elapsed > minutes * 60000 ? '#c29045' : '#83a85f';
    document.getElementById('timer-description').textContent = state.finishedAt ? 'Operation successful! All bookings and required cancellation remarks are complete. Your final score is saved.' : state.startedAt ? `Session is running. Complete the remaining bookings and ${tasks.pendingRemarks} cancellation remark(s) in Activity log to finish.` : 'Choose your settings and Start simulation to begin timing.';
    const rows = document.getElementById('activity-rows');
    rows.replaceChildren();
    if (!completed.length) { const row = rows.insertRow(); const cell = row.insertCell(); cell.colSpan = 4; cell.className = 'muted'; cell.textContent = 'No completed bookings yet.'; }
    completed.forEach(g => { const row = rows.insertRow(); [g.enteredDetails?.name || g.name, g.payment.method === 'cash' ? 'Cash' : 'Custom QR', formatTime(g.confirmedAt - g.openedAt), new Date(g.confirmedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'})].forEach(value => {row.insertCell().textContent = value;}); });
  }
  function openSetup(state) {
    const dialog = document.getElementById('simulation-dialog');
    document.getElementById('simulation-guests').value = String(state.guests.length);
    document.getElementById('simulation-minutes').value = String(state.targetMinutes || 2);
    document.getElementById('simulation-error').textContent = '';
    if (!dialog.open) dialog.showModal();
  }
  function initSetup(getState, start) {
    const $ = id => document.getElementById(id);
    $('download-report').addEventListener('click', async () => {
      $('download-report').disabled = true; $('pdf-status').textContent = 'Generating your PDF…';
      try {
        const snapshot = JSON.parse(JSON.stringify(getState()));
        const blob = await createPdf(snapshot);
        const url = URL.createObjectURL(blob), link = document.createElement('a');
        const student = snapshot.student || studentDetails();
        const fullName = (student.fullName || 'Student').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').trim().replace(/[. ]+$/,'').slice(0,120) || 'Student';
        const date = new Date();
        const reportDate = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
        link.href = url; link.download = `${fullName} - PerformanceReport-${reportDate}.pdf`;
        document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url),30000);
        $('pdf-status').textContent = 'PDF generated. Check your browser downloads.';
      } catch (error) { $('pdf-status').textContent = 'Could not generate the PDF. Please try again.'; console.error(error); }
      finally { $('download-report').disabled = false; }
    });
    const addOptions = (id, max, unit) => {
      for (let n = 1; n <= max; n++) { const option = document.createElement('option'); option.value = String(n); option.textContent = `${n} ${unit}${n === 1 ? '' : 's'}`; $(id).append(option); }
    };
    addOptions('simulation-guests', window.GUESTS_DATA.length, 'guest');
    addOptions('simulation-minutes', 30, 'minute');
    $('simulation-close').addEventListener('click', () => $('simulation-dialog').close());
    $('simulation-cancel').addEventListener('click', () => $('simulation-dialog').close());
    $('simulation-form').addEventListener('submit', event => {
      event.preventDefault();
      const count = Number($('simulation-guests').value), minutes = Number($('simulation-minutes').value);
      if (!Number.isInteger(count) || count < 1 || count > window.GUESTS_DATA.length || !Number.isInteger(minutes) || minutes < 1 || minutes > 30) {
        $('simulation-error').textContent = 'Choose a valid guest count and a time limit from 1 to 30 minutes.'; return;
      }
      const warning = getState().startedAt ? '\nThis replaces the current session and its booking progress.' : '';
      if (!window.confirm(`Are you sure you want to simulate a hotel operation with ${count} guest${count === 1 ? '' : 's'} in ${minutes} minute${minutes === 1 ? '' : 's'}?${warning}`)) return;
      $('simulation-dialog').close(); start(count, minutes);
    });
  }
  // Draw Unicode text with browser fonts; embed high-resolution A4 page images in a PDF.
  // No network connection, external library, or print dialog is required for downloading.
  async function createPdf(state) {
    const capturedAt = Date.now(), summary = metrics(state,capturedAt), student = state.student || studentDetails();
    const pages = []; let canvas, ctx, y;
    function page() {
      canvas = document.createElement('canvas'); canvas.width = 1240; canvas.height = 1754;
      ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,1240,1754);
      ctx.fillStyle = '#183d33'; ctx.fillRect(0,0,1240,145);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 34px Arial'; ctx.textAlign = 'center';
      ctx.fillText('CHECKIN 1 PERFORMANCE REPORT',620,88);
      // Prominent score occupies its own column, separate from the student details.
      ctx.fillStyle = '#edf4e8'; ctx.fillRect(860,205,310,225);
      ctx.fillStyle = '#527546'; ctx.font = 'bold 25px Arial'; ctx.fillText('TIME SCORE',1015,264);
      ctx.fillStyle = '#203b32'; ctx.font = 'bold 76px Arial'; ctx.fillText(summary.score + '/50',1015,365);
      ctx.textAlign = 'center'; ctx.fillStyle = '#203b32'; ctx.font = '24px Arial';
      ctx.fillText('This document serves as your score for the simulation.',620,1420);
      ctx.fillStyle = '#527546'; ctx.font = 'italic 25px Arial';
      ctx.fillText('Keep moving forward, future tourism professional.',620,1480);
      ctx.font = '22px Arial'; ctx.fillText('- by Ocampo',620,1520);
      ctx.fillStyle = '#7a887f'; ctx.font = '21px Arial'; ctx.fillText('System is made with love.',620,1605);
      ctx.fillStyle = '#e0e6dc'; ctx.fillRect(70,1640,1100,2);
      ctx.fillStyle = '#7a887f'; ctx.font = '19px Arial'; ctx.textAlign = 'left';
      ctx.fillText('Asian College - Dumaguete Campus',70,1690);
      ctx.textAlign = 'right'; ctx.fillText('Hotel Front Desk Workflow Simulator',1170,1690);
      ctx.textAlign = 'left'; pages.push(canvas); y = 235;
    }
    function line(text, bold = false, size = 24) {
      ctx.font = (bold ? 'bold ' : '') + size + 'px Arial';
      let row = '';
      function draw(value) {
        if (y > 1300) { page(); ctx.font = (bold ? 'bold ' : '') + size + 'px Arial'; }
        ctx.textAlign = 'left'; ctx.fillStyle = '#203b32'; ctx.fillText(value,70,y); y += size + 16;
      }
      // Keep all details in the left column, including long names and sections.
      for (const word of String(text).split(/\s+/)) {
        if (ctx.measureText(row+word).width > 720 && row) { draw(row); row = ''; }
        for (const char of word) { if (ctx.measureText(row+char).width > 720) { draw(row); row = ''; } row += char; }
        row += ' ';
      }
      draw(row);
    }
    page(); line('Student details',true,30); y += 12;
    line('Student ID: ' + (student.studentId || 'Not provided'));
    line('Full name: ' + (student.fullName || 'Not provided'));
    line('Section: ' + (student.section || 'Not provided')); y += 42;
    line('Session results',true,30); y += 12;
    line('Status: ' + (state.finishedAt ? 'Complete - final score' : state.startedAt ? 'In progress - current snapshot' : 'Not started'));
    line('Guests catered: ' + state.guests.filter(g=>g.status==='confirmed').length + ' / ' + state.guests.filter(g=>!['cancelled','refund'].includes(g.status)).length);
    const tasks = ActivityLog.progress(state);
    line(`Cancelled remarks: ${tasks.remarked} / ${tasks.cancelled} | Tasks done: ${tasks.done} / ${tasks.total}`);
    line('Time target: ' + (state.targetMinutes || 2) + ' minute(s) | Elapsed: ' + formatTime(summary.elapsed));
    line('Scoring: 50 points within target; minus 2 per full extra 5 seconds.',false,21);
    line('Generated: ' + new Date(capturedAt).toLocaleString(),false,21);
    const encoder = new TextEncoder(), chunks = [], offsets = [0]; let length = 0;
    const add = data => { const bytes = typeof data === 'string' ? encoder.encode(data) : data; chunks.push(bytes); length += bytes.length; };
    function object(id,content) { offsets[id] = length; add(`${id} 0 obj\n${content}\nendobj\n`); }
    add('%PDF-1.4\n'); object(1,'<< /Type /Catalog /Pages 2 0 R >>');
    object(2,`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] >>`);
    pages.forEach((image,i) => {
      const id = 3+i*3, bytes = Uint8Array.from(atob(image.toDataURL('image/jpeg',0.92).split(',')[1]),c=>c.charCodeAt(0));
      object(id,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`);
      offsets[id+1] = length; add(`${id+1} 0 obj\n<< /Type /XObject /Subtype /Image /Width 1240 /Height 1754 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`); add(bytes); add('\nendstream\nendobj\n');
      const content = 'q 595.28 0 0 841.89 0 0 cm /Im0 Do Q'; object(id+2,`<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`);
    });
    const xref = length; add(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
    for (let id=1;id<offsets.length;id++) add(`${String(offsets[id]).padStart(10,'0')} 00000 n \n`);
    add(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
    return new Blob(chunks,{type:'application/pdf'});
  }
  return { render, metrics, formatTime, initSetup, openSetup, studentDetails, createPdf };
})();

