const fs = require('fs');

async function run() {
  const baseUrl = 'https://comix.to/assets/build/35595e3de3c99889c1aa70/dist/';
  const res = await fetch(baseUrl + 'secure-tkpq14-BRBnVE1Y.js');
  const js = await res.text();
  
  // Find where P6 is defined
  const p6Matches = [...js.matchAll(/.{0,50}\bP6\b.{0,50}/g)].map(m => m[0]);
  console.log('P6 matches:\n', p6Matches);
}
run();
