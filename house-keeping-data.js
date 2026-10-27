'use strict';
// Editable housekeeping tasks and mock assigned personnel.
window.HOUSE_KEEPING_DATA = [
  {id:'HK-001',room:'101',task:'Departure room cleaning',officer:'Maria Abella',instructions:'Remove used linen and rubbish. Clean and disinfect the bathroom and room surfaces. Make the bed with fresh linen and replenish amenities.'},
  {id:'HK-002',room:'102',task:'Stayover room refresh',officer:'Jose Dizon',instructions:'Refresh the occupied room according to the guest request. Replace used towels, empty bins, tidy the bed, and replenish drinking water.'},
  {id:'HK-003',room:'103',task:'Bathroom deep cleaning',officer:'Ana Mercado',instructions:'Clean the shower, toilet, sink, and mirrors. Disinfect high-touch surfaces, dry the floor, and replace bathroom supplies.'},
  {id:'HK-004',room:'104',task:'Linen replacement',officer:'Carlo Reyes',instructions:'Remove used sheets and pillowcases. Inspect and fit fresh linen, make the bed, and place used linen in the correct laundry collection area.'},
  {id:'HK-005',room:'105',task:'Room readiness inspection',officer:'Liza Santos',instructions:'Inspect room cleanliness, linen presentation, amenities, and bathroom condition. Report defects and confirm that the room is ready for the next guest.'},
  {id:'HK-006',room:'201',task:'Amenities replenishment',officer:'Mark Villanueva',instructions:'Check the room inventory. Replenish toiletries, tissues, coffee, and water to the room standard, then check the presentation.'},
  {id:'HK-007',room:'202',task:'Floor and carpet care',officer:'Maria Abella',instructions:'Vacuum carpet and accessible corners. Mop hard flooring using the appropriate product and leave floors clean and dry.'},
  {id:'HK-008',room:'203',task:'High-touch surface disinfection',officer:'Jose Dizon',instructions:'Clean and disinfect handles, switches, remote controls, desk surfaces, and other high-touch points. Replace cleaning cloths as needed.'},
  {id:'HK-009',room:'204',task:'Family room turnover',officer:'Ana Mercado',instructions:'Replace all used bedding and towels. Clean the sleeping and sitting areas, check for left belongings, and replenish supplies for the room occupancy.'},
  {id:'HK-010',room:'205',task:'Glass and mirror cleaning',officer:'Carlo Reyes',instructions:'Clean accessible interior glass, mirrors, and ledges. Remove streaks and wipe surrounding surfaces without leaving residue.'},
  {id:'HK-011',room:'301',task:'Suite preparation',officer:'Liza Santos',instructions:'Prepare the bedroom, lounge, and bathroom. Check linen and amenities against the suite standard and inspect the final presentation.'},
  {id:'HK-012',room:'302',task:'Towel and bathmat refresh',officer:'Mark Villanueva',instructions:'Collect used towels and bathmats. Replace with clean sets, arrange neatly, and inspect the bathroom floor and towel storage.'},
  {id:'HK-013',room:'303',task:'Waste removal and sanitation',officer:'Maria Abella',instructions:'Collect and segregate room waste. Clean bins, replace liners, inspect for spills, and sanitize affected surfaces.'},
  {id:'HK-014',room:'304',task:'Dusting and furniture care',officer:'Jose Dizon',instructions:'Dust accessible furniture, shelves, lamps, and ledges. Clean the desk and bedside tables, then restore the room layout.'},
  {id:'HK-015',room:'305',task:'Final housekeeping inspection',officer:'Ana Mercado',instructions:'Walk through the completed room. Verify cleanliness, supplies, linen, and presentation. Record any issue before releasing the room.'}
].map((task,index)=>({...task,status:'pending',workStatus:index%2===0?'ongoing':'completed'}));
