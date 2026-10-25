'use strict';
// Editable analysis tasks. Dates refer to guest check-in filters in Hotel Analytics.
window.ANALYSIS_REQUEST_DATA = [
  {id:'AR-001',from:'2026-11-12',to:'2026-11-14',title:'Opening arrival patterns',task:'Review arrivals, departures, room types, and stay lengths at the start of the period. Describe the main patterns.'},
  {id:'AR-002',from:'2026-11-15',to:'2026-11-18',title:'Mid-November guest activity',task:'Filter November 15 to November 18. Compare check-ins and check-outs, identify the busiest dates, and describe the room demand.'},
  {id:'AR-003',from:'2026-11-19',to:'2026-11-23',title:'Room demand comparison',task:'Compare room-type booking counts and explain which room types had the strongest demand in this period.'},
  {id:'AR-004',from:'2026-11-24',to:'2026-11-30',title:'End-of-November operations',task:'Describe arrival and departure trends, booking statuses, and any operational concerns suggested by these records.'},
  {id:'AR-005',from:'2026-12-01',to:'2026-12-06',title:'Early-December arrivals',task:'Identify the busiest arrival dates and compare stay lengths and room preferences. Explain your observations.'},
  {id:'AR-006',from:'2026-12-07',to:'2026-12-12',title:'Guest volume and booking value',task:'Review guest counts, room nights, and listed booking value. Describe what the figures show without treating listed value as collected revenue.'},
  {id:'AR-007',from:'2026-12-13',to:'2026-12-18',title:'Stay duration and departures',task:'Compare arrivals and departures for the selected guests and describe how their stay durations affect departure dates.'},
  {id:'AR-008',from:'2026-12-19',to:'2026-12-24',title:'Pre-holiday booking review',task:'Examine room demand and booking statuses. Describe any cancelled or refund records and how they affect your interpretation.'},
  {id:'AR-009',from:'2026-12-25',to:'2026-12-31',title:'Year-end guest activity',task:'Review arrivals, room-type demand, and departures extending into January. Summarize the operational implications.'},
  {id:'AR-010',from:'2027-01-01',to:'2027-01-02',title:'New-year activity review',task:'Check for arrivals from January 1 to January 2. If there are no matching arrivals, report that finding; use the year-end range separately to investigate departures into January.'}
].map(request => ({...request,status:'pending'}));
