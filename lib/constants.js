exports.EVENT_TYPES = [
  ['wedding', 'Wedding'],
  ['corporate', 'Corporate / public function'],
  ['tents', 'Tents & decor hire only'],
  ['catering', 'Catering only'],
  ['baby_shower', 'Baby shower / gender reveal'],
  ['birthday', 'Birthday / anniversary'],
  ['dowry', 'Dowry / ruracio'],
  ['graduation', 'Graduation'],
  ['celebration_of_life', 'Celebration of life'],
  ['other', 'Other'],
];
exports.BUDGETS = [
  ['', 'Prefer not to say'],
  ['<100k', 'Under 100,000'],
  ['100-300k', '100,000 – 300,000'],
  ['300-600k', '300,000 – 600,000'],
  ['600k-1m', '600,000 – 1,000,000'],
  ['>1m', 'Above 1,000,000'],
];
exports.STATUSES = [
  ['new', 'New'],
  ['contacted', 'Contacted'],
  ['quoted', 'Quote sent'],
  ['booked', 'Booked'],
  ['closed', 'Closed'],
];
exports.GALLERY_CATEGORIES = [
  ['wedding', 'Weddings'],
  ['corporate', 'Corporate'],
  ['tents', 'Tents & Decor'],
  ['catering', 'Catering'],
  ['celebration', 'Celebrations'],
];
exports.MENU_CATEGORIES = [
  ['starters', 'Starters'],
  ['mains', 'Mains'],
  ['sides', 'Sides & Salads'],
  ['desserts', 'Desserts'],
  ['drinks', 'Drinks'],
];
exports.label = (list, key) => (list.find((x) => x[0] === key) || [key, key])[1];
