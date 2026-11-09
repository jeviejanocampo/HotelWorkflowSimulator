'use strict';
// Editable analysis tasks. Dates refer to guest check-in filters in Hotel Analytics.
window.ANALYSIS_REQUEST_DATA = [
  {id:'AR-001',from:'2026-11-12',to:'2026-11-14',title:'Opening arrival patterns',task:'Review arrivals, departures, room types, and stay lengths at the start of the period. Describe the main patterns.'},
  {id:'AR-002',from:'2026-11-15',to:'2026-11-18',title:'Mid-November guest activity',task:'Filter November 15 to November 18. Compare check-ins and check-outs, identify the busiest dates, and describe the room demand.'},
  {id:'AR-003',from:'2026-11-19',to:'2026-11-23',title:'Room demand comparison',task:'Compare room-type booking counts and explain which room types had the strongest demand in this period.'},
  {id:'AR-004',from:'2026-11-24',to:'2026-11-30',title:'End-of-November operations',task:'Describe arrival and departure trends, booking statuses, and any operational concerns suggested by these records.'},
  {id:'AR-005',from:'2026-12-01',to:'2026-12-06',title:'Early-December arrivals',task:'Identify the busiest arrival dates and compare stay lengths and room preferences. Explain your observations.'},
].map(request => ({...request,status:'pending'}));
