const fs = require('fs');

async function run() {
  const baseUrl = 'https://comix.to/assets/build/35595e3de3c99889c1aa70/dist/';
  const res = await fetch(baseUrl + 'secure-tkpq14-BRBnVE1Y.js');
  const js = await res.text();
  console.log('Length of secure:', js.length);
  const exports = js.match(/export\s*\{[^}]+\}/g);
  console.log('Exports:', exports);
  console.log('Last 500 chars of secure:', js.slice(-500));
}
run();
