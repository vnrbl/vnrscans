const fs = require('fs');

async function run() {
  const baseUrl = 'https://comix.to/assets/build/35595e3de3c99889c1aa70/dist/';
  const res = await fetch(baseUrl + 'env-tkpq14-BMG3QqEA.js');
  const js = await res.text();
  console.log('env length:', js.length);
  const secureImports = [...js.matchAll(/import[^;]*secure[^;]*;/g)].map(m => m[0]);
  console.log('secure imports in env:', secureImports);
  const apiMatches = [...js.matchAll(/api\/v1.{0,80}/g)].map(m => m[0]);
  console.log('api/v1 matches in env:', apiMatches.slice(0, 10));
  const chapterMatches = [...js.matchAll(/chapters.{0,80}/g)].map(m => m[0]);
  console.log('chapters matches in env:', chapterMatches.slice(0, 10));
}
run();
