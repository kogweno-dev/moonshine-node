const path = require('path');

const production = process.env.NODE_ENV === 'production';
const secret = process.env.SESSION_SECRET || 'dev-only-change-me';
if (production && secret === 'dev-only-change-me') {
  throw new Error('Set the SESSION_SECRET environment variable before running in production.');
}

module.exports = {
  production,
  secret,
  port: process.env.PORT || 3000,
  dbPath: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'moonshine.db'),
  // Edit these once; they appear across the whole site.
  biz: {
    name: 'Moonshine Events',
    phone_1: '0700 000 000',
    phone_2: '0711 111 111',
    whatsapp: '254700000000',
    email: 'info@moonshineevents.co.ke',
    address: 'Nakuru Town, Nakuru County, Kenya',
    hours: 'Mon – Sat, 8:00am – 6:00pm',
    founder: 'Madam Doreen',
  },
};
