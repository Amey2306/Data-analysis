export const kpiData = {
  totalLeads: 463,
  siteVisits: 162,
  closedDeals: 214,
  conversionRate: 46.2, // (214 / 463) * 100
  leadsGrowth: 15.4, // %
  visitsGrowth: 8.2, // %
};

export const funnelData = [
  { stage: 'Assigned', count: 463 },
  { stage: 'Open / Attempted', count: 71 },
  { stage: 'Appointment Proposed', count: 8 },
  { stage: 'Site Visit / Virtual', count: 162 },
  { stage: 'Initiate Offer', count: 3 },
  { stage: 'Closed', count: 214 },
];

export const projectData = [
  { region: 'Godrej Ascend', leads: 275, siteVisits: 100, closed: 129 },
  { region: 'Godrej Exquisite', leads: 188, siteVisits: 62, closed: 85 },
];

export const sourceData = [
  { name: 'Direct / Other', value: 413 },
  { name: 'Facebook Ads', value: 23 },
  { name: 'Google Ads', value: 21 },
  { name: 'Haptik', value: 6 },
];

export const adSetPerformance = [
  { id: '1', date: '2024-04-01', project: 'Godrej Ascend', platform: 'Facebook', vendor: 'Madison', adSet: 'CXOHVG', leads: 45, qualified: 18, appointments: 8, walkins: 3, bookings: 1, spends: 12500, cpl: 277 },
  { id: '2', date: '2024-04-05', project: 'Godrej Exquisite', platform: 'Facebook', vendor: 'Madison', adSet: 'InvestmHVG', leads: 82, qualified: 35, appointments: 15, walkins: 6, bookings: 0, spends: 20000, cpl: 243 },
  { id: '3', date: '2024-04-08', project: 'Godrej Ascend', platform: 'Facebook', vendor: 'Madison', adSet: 'Website Visitor', leads: 110, qualified: 40, appointments: 20, walkins: 8, bookings: 2, spends: 15000, cpl: 136 },
  { id: '4', date: '2024-04-12', project: 'Godrej Ascend', platform: 'Google', vendor: 'Madison', adSet: 'Brand Exact', leads: 65, qualified: 28, appointments: 18, walkins: 10, bookings: 4, spends: 8000, cpl: 123 },
  { id: '5', date: '2024-04-15', project: 'Godrej Exquisite', platform: 'Google', vendor: 'Madison', adSet: 'Generic Phrase', leads: 145, qualified: 50, appointments: 25, walkins: 12, bookings: 1, spends: 35000, cpl: 241 },
  { id: '6', date: '2024-04-18', project: 'Godrej Exquisite', platform: '99 Acres', vendor: '99 Acres', adSet: 'Premium Listing', leads: 210, qualified: 85, appointments: 40, walkins: 15, bookings: 3, spends: 25000, cpl: 119 },
  { id: '7', date: '2024-04-20', project: 'Godrej Ascend', platform: 'Haptik', vendor: 'Haptik', adSet: 'WhatsApp Bot', leads: 55, qualified: 20, appointments: 10, walkins: 4, bookings: 0, spends: 4000, cpl: 72 },
  { id: '8', date: '2024-04-22', project: 'Godrej Exquisite', platform: 'GPL Organics', vendor: 'Internal', adSet: 'Referral/Direct', leads: 243, qualified: 95, appointments: 55, walkins: 22, bookings: 6, spends: 0, cpl: 0 },
];

export const lostReasonsData = [
  { reason: 'Not Contactable', count: 145 },
  { reason: 'Not Interested', count: 120 },
  { reason: 'Budget', count: 85 },
  { reason: 'Location', count: 42 },
  { reason: 'No Plans', count: 35 },
  { reason: 'Time Constraint', count: 18 },
];

export const spendTrendData = [
  { date: 'Apr 01', project: 'Godrej Ascend', vendor: 'Madison', spend: 4200 },
  { date: 'Apr 01', project: 'Godrej Exquisite', vendor: 'Madison', spend: 6000 },
  { date: 'Apr 01', project: 'Godrej Exquisite', vendor: '99 Acres', spend: 4500 },
  { date: 'Apr 01', project: 'Godrej Ascend', vendor: 'Haptik', spend: 800 },
  { date: 'Apr 08', project: 'Godrej Ascend', vendor: 'Madison', spend: 5100 },
  { date: 'Apr 08', project: 'Godrej Exquisite', vendor: 'Madison', spend: 7500 },
  { date: 'Apr 08', project: 'Godrej Exquisite', vendor: '99 Acres', spend: 5200 },
  { date: 'Apr 08', project: 'Godrej Ascend', vendor: 'Haptik', spend: 1100 },
  { date: 'Apr 15', project: 'Godrej Ascend', vendor: 'Madison', spend: 4800 },
  { date: 'Apr 15', project: 'Godrej Exquisite', vendor: 'Madison', spend: 8200 },
  { date: 'Apr 15', project: 'Godrej Exquisite', vendor: '99 Acres', spend: 6100 },
  { date: 'Apr 15', project: 'Godrej Ascend', vendor: 'Haptik', spend: 950 },
  { date: 'Apr 22', project: 'Godrej Ascend', vendor: 'Madison', spend: 6500 },
  { date: 'Apr 22', project: 'Godrej Exquisite', vendor: 'Madison', spend: 9000 },
  { date: 'Apr 22', project: 'Godrej Exquisite', vendor: '99 Acres', spend: 7800 },
  { date: 'Apr 22', project: 'Godrej Ascend', vendor: 'Haptik', spend: 1250 },
];
