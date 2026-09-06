const fs = require('fs');

async function test() {
  const baseUrl = 'https://comix.to/assets/build/35595e3de3c99889c1aa70/dist/';
  const res = await fetch(baseUrl + 'main-tkpq14-CYLCH7Og.js');
  const js = await res.text();
  
  // Find occurrences of t( or r( or n(
  const calls = [...js.matchAll(/(?:[^a-zA-Z0-9_$])([ntr]\([a-zA-Z0-9_$,\s\(\)]+\))/g)].map(m => m[1]);
  console.log('Calls:', calls.slice(0, 10));

  // Also search for axios creation or interceptors in main
  const axiosMatches = [...js.matchAll(/.{0,50}axios.{0,50}/gi)].map(m => m[0]);
  console.log('Axios matches:', axiosMatches.slice(0, 5));
}

test();
