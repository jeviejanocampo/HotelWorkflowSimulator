'use strict';
// Display-only dashboard. Hotel descriptions supplied by the user; all operational
// figures, room offerings, prices, and hiring details below are educational mock data.
window.HOTEL_BIODATA = {
  name:'Waterfront Cebu City Hotel & Casino',
  subtitle:'CheckIn Hotel Workflow Training Simulator',
  image:'images/hotel-wallpaper.jpeg',
  location:'Lahug, Cebu City, Philippines',
  mapUrl:'https://www.google.com/maps/place/Waterfront+Cebu+City+Hotel+%26+Casino/@10.3247129,123.9021386,17z/data=!4m9!3m8!1s0x33a9993ccf8d81f1:0xc975b10a18d14aa8!5m2!4m1!1i2!8m2!3d10.3247129!4d123.9047135!16s%2Fm%2F0nb2c8y',
  mapEmbed:'https://www.google.com/maps?q=Waterfront+Cebu+City+Hotel+%26+Casino,+Lahug,+Cebu+City&ll=10.3247129,123.9047135&z=16&output=embed',
  summaries:[
    {label:'ROOM INVENTORY',value:'120',detail:'Mock rooms across the property'},
    {label:'AVAILABLE ROOMS',value:'32',detail:'Mock availability for this display'},
    {label:'OCCUPANCY',value:'73%',detail:'Mock occupancy overview'},
    {label:'GUEST RATING',value:'4.8 / 5',detail:'Mock guest satisfaction score'}
  ],
  rooms:[
    {name:'Superior Room',category:'A comfortable city stay',rate:3500,beds:'Queen or twin beds',occupancy:'Up to 2 guests',features:'Wi-Fi · Work desk · Private bathroom',tone:'sage'},
    {name:'Deluxe Room',category:'A little more room to unwind',rate:4800,beds:'King bed',occupancy:'Up to 2 guests',features:'Wi-Fi · Lounge seating · City outlook',tone:'sand'},
    {name:'Executive Suite',category:'Space for a memorable visit',rate:6000,beds:'King bed & sitting area',occupancy:'Up to 3 guests',features:'Wi-Fi · Separate lounge · Spacious layout',tone:'forest'}
  ],
  descriptions:[
    {heading:'Where They Are Located',text:'Waterfront Cebu City Hotel & Casino is located in Lahug, Cebu City, Philippines, offering convenient access to business establishments, shopping centers, restaurants, and local attractions.'},
    {heading:'Average Hotel Prices',note:'Mock rates for educational purposes',text:'Room accommodations range from ₱3,500 to ₱6,000 per night, depending on room type, occupancy, and booking dates.'},
    {heading:'Are You Hiring?',note:'Mock response',text:'Yes! We welcome qualified applicants interested in hospitality careers, including front desk operations, housekeeping, maintenance, food and beverage services, and guest relations.'},
    {heading:'Hotel Description',text:'Waterfront Cebu City Hotel & Casino offers a comfortable and welcoming environment for business travelers, tourists, families, and event guests. It features accommodation, dining, leisure facilities, and event spaces designed to provide a convenient and enjoyable hospitality experience.'},
    {heading:'How to Avail',text:'Guests may inquire about available rooms, select their preferred accommodation, provide the required booking information, confirm their reservation, and complete payment according to the selected package. For educational simulation purposes, bookings can be demonstrated through a mock reservation process.'}
  ]
};
window.HotelDashboard = (() => {
  const node=(tag,className,text)=>{const element=document.createElement(tag);if(className)element.className=className;if(text!==undefined)element.textContent=text;return element;};
  function init(){
    const data=window.HOTEL_BIODATA,$=id=>document.getElementById(id);
    $('dashboard-hotel-image').src=data.image;$('dashboard-hotel-image').alt=data.name;
    $('dashboard-title').textContent=data.name;$('dashboard-subtitle').textContent=data.subtitle;$('dashboard-location').textContent=data.location;
    $('dashboard-summaries').replaceChildren();
    data.summaries.forEach(item=>{const card=node('article','card dashboard-hover');card.append(node('div','stat-label',item.label),node('div','stat-value',item.value),node('div','stat-foot',item.detail));$('dashboard-summaries').append(card);});
    $('dashboard-rooms').replaceChildren();
    data.rooms.forEach((room,i)=>{
      const card=node('article','dashboard-room dashboard-hover');
      const illustration=node('div',`dashboard-room-art ${room.tone}`);illustration.setAttribute('aria-hidden','true');illustration.append(node('span','room-art-number',`0${i+1}`),node('div','room-art-bed'),node('span','room-art-label','MOCK ROOM CATEGORY'));
      const body=node('div','dashboard-room-body');body.append(node('p','eyebrow',room.category),node('h3',null,room.name),node('p','muted',`${room.beds} · ${room.occupancy}`),node('p','dashboard-features',room.features));
      const price=node('div','dashboard-price');price.append(node('strong',null,new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:0}).format(room.rate)),node('span','muted',' / night · mock rate'));body.append(price);card.append(illustration,body);$('dashboard-rooms').append(card);
    });
    $('dashboard-descriptions').replaceChildren();
    data.descriptions.forEach(item=>{const section=node('article','dashboard-description');section.append(node('h3',null,item.heading));if(item.note)section.append(node('p','dashboard-mock-note',item.note));section.append(node('p','muted',item.text));$('dashboard-descriptions').append(section);});
    $('dashboard-map').src=data.mapEmbed;$('dashboard-map-link').href=data.mapUrl;
  }
  return {init};
})();
