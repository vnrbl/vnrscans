const fs = require('fs');

async function test() {
  const baseUrl = 'https://comix.to/assets/build/35595e3de3c99889c1aa70/dist/';
  const res = await fetch(baseUrl + 'main-tkpq14-CYLCH7Og.js');
  const js = await res.text();
  
  // Find where r or n or t are used near the top or bottom of main
  // Look for: import{a as n,o as t,r}from"./secure-tkpq14-BRBnVE1Y.js";
  const start = js.lastIndexOf('secure-tkpq14-BRBnVE1Y.js');
  const codeAfter = js.slice(start, start + 3000);
  console.log('Code after import:\n', codeAfter);
}

test();
