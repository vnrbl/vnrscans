const fs = require('fs');

async function test() {
  const baseUrl = 'https://comix.to/assets/build/35595e3de3c99889c1aa70/dist/';
  const res = await fetch(baseUrl + 'main-tkpq14-CYLCH7Og.js');
  const js = await res.text();
  const idx = js.lastIndexOf('secure-tkpq14-BRBnVE1Y.js');
  console.log('Context around import:', js.slice(idx - 50, idx + 500));
}

test();
