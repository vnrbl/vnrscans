const fs = require('fs');

async function run() {
  const baseUrl = 'https://comix.to/assets/build/35595e3de3c99889c1aa70/dist/';
  const res = await fetch(baseUrl + 'env-tkpq14-BMG3QqEA.js');
  const js = await res.text();
  
  // Find where mc and Bc are used
  const mcUsage = [...js.matchAll(/.{0,100}mc.{0,100}/g)].map(m => m[0]);
  console.log('mc usage:\n', mcUsage);
  const bcUsage = [...js.matchAll(/.{0,100}Bc.{0,100}/g)].map(m => m[0]);
  console.log('Bc usage:\n', bcUsage);
  
  // Also print axios instance 'y' creation
  const yIndex = js.indexOf('api/v1",withCredentials:!0');
  console.log('Context around axios:\n', js.slice(yIndex - 100, yIndex + 500));
}
run();
