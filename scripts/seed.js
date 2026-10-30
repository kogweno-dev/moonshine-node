const seed = require('../lib/seed');
const reset = process.argv.includes('--reset');
console.log(seed({ reset }) ? 'Starter content loaded.' : 'Content already present. Use "npm run reseed" to reload it.');
