'use strict';
window.ActivityLog = (() => {
  let getState, saveState, afterRemarks, editingId = null;
  const $ = id => document.getElementById(id);
  const statusLabel = status => status === 'confirmed' ? 'CONFIRMED BOOKED' : status === 'new' ? 'New Guest' : status === 'cancelled' ? 'CANCELLED' : status === 'refund' ? 'REFUND' : 'PENDING';
  const hasRemarks = entry => typeof entry.remarks === 'string' && entry.remarks.trim().length > 0;
  function progress(state) {
    const bookings = state.guests.filter(g => ['pending','new','confirmed'].includes(g.status));
    const cancelled = state.guests.filter(g => g.status === 'cancelled');
    const remarked = cancelled.filter(g => (state.activityLog || []).some(row => row.bookingId === g.id && hasRemarks(row))).length;
    const booked = bookings.filter(g => g.status === 'confirmed').length;
    return { booked, bookings:bookings.length, remarked, cancelled:cancelled.length, done:booked+remarked, total:bookings.length+cancelled.length, pendingRemarks:cancelled.length-remarked };
  }
  function updateBadges(state) {
    const bookings = state.guests.filter(g => g.status === 'pending' || g.status === 'new').length;
    const remarks = progress(state).pendingRemarks;
    [['booking-notification',bookings,'bookings awaiting confirmation'],['activity-notification',remarks,'cancelled records awaiting remarks']].forEach(([id,count,label]) => {
      $(id).textContent = String(count); $(id).hidden = count === 0;
      $(id).setAttribute('aria-label',`${count} ${label}`);
    });
  }
  // One row per guest handled in this simulation. Reopening never duplicates a row.
  function sync(state) {
    if (!Array.isArray(state.activityLog)) state.activityLog = [];
    state.guests.forEach(guest => {
      let row = state.activityLog.find(entry => entry.bookingId === guest.id);
      if (!row && !guest.openedAt && !['confirmed','cancelled','refund'].includes(guest.status)) return;
      if (!row) { row = { bookingId:guest.id, remarks:'' }; state.activityLog.push(row); }
      row.name = guest.enteredDetails?.name || guest.name;
      row.status = guest.status;
      row.guestRemarks = ['cancelled','refund'].includes(guest.status) ? (guest.guestRemarks || `Guest requested ${guest.status} due to a problem.`) : 'N/A';
    });
    updateBadges(state);
  }
  function render() {
    const state = getState(); sync(state);
    const query = $('log-search').value.trim().toLowerCase(), status = $('log-status-filter').value;
    const entries = state.activityLog.filter(row => `${row.bookingId} ${row.name} ${row.guestRemarks} ${row.remarks || ''}`.toLowerCase().includes(query) && (status === 'all' || row.status === status));
    const body = $('log-rows'); body.replaceChildren();
    entries.forEach(entry => {
      const row = body.insertRow(); row.insertCell().textContent = entry.bookingId; row.insertCell().textContent = entry.name;
      const badge = document.createElement('span'); badge.className = `badge ${entry.status}`; badge.textContent = statusLabel(entry.status); row.insertCell().append(badge);
      const statement = row.insertCell(); statement.className = 'guest-remarks'; statement.textContent = entry.guestRemarks;
      const note = row.insertCell(); const text = document.createElement('p'); text.className = 'log-remark-text'; text.textContent = entry.remarks || 'No remarks yet.';
      const button = document.createElement('button'); button.type = 'button'; button.className = 'secondary'; button.textContent = 'Remarks'; button.setAttribute('aria-label',`Remarks for ${entry.bookingId}, ${entry.name}`);
      button.addEventListener('click', () => {
        editingId = entry.bookingId; $('remarks-guest').textContent = `${entry.bookingId} · ${entry.name}`; $('remarks-guest-statement').textContent = entry.guestRemarks; $('remarks-input').value = entry.remarks || ''; $('remarks-dialog').showModal();
        $('remarks-prompt').textContent = entry.status === 'cancelled' ? 'Describe a remark here based on the CANCELLED status and the guest’s cancellation reason. Explain how you handled this cancellation.' : `Describe your remarks based on the ${statusLabel(entry.status)} status and the guest’s statement.`;
      });
      note.append(text,button);
      const remarkBadge = document.createElement('span');
      remarkBadge.className = `badge ${hasRemarks(entry) ? 'remark-done' : 'remark-pending'}`;
      remarkBadge.textContent = hasRemarks(entry) ? 'REMARK DONE' : 'PENDING';
      row.insertCell().append(remarkBadge);
    });
    if (!entries.length) { const cell = body.insertRow().insertCell(); cell.colSpan = 6; cell.className = 'muted'; cell.textContent = state.activityLog.length ? 'No activity matches your search or filter.' : 'No booking activity yet. Open Confirm booking or Book this guest to begin.'; }
    $('log-count').textContent = `Showing ${entries.length} of ${state.activityLog.length} activity records`;
  }
  function init(read, save, onRemarksSaved) {
    getState = read; saveState = save; afterRemarks = onRemarksSaved;
    $('log-search').addEventListener('input',render); $('log-status-filter').addEventListener('change',render);
    $('remarks-cancel').addEventListener('click', () => $('remarks-dialog').close());
    $('remarks-dialog').addEventListener('close', () => { editingId = null; });
    $('remarks-form').addEventListener('submit', event => {
      event.preventDefault(); const entry = getState().activityLog?.find(row => row.bookingId === editingId);
      if (!entry) return;
      entry.remarks = $('remarks-input').value.trim().slice(0,1000); saveState(); $('remarks-dialog').close(); render();
      $('log-message').textContent = `Remarks saved for ${entry.bookingId}.`;
      if (afterRemarks) afterRemarks();
    });
  }
  return { init, sync, render, progress };
})();
