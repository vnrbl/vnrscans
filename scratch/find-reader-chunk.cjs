async function run() {
  const baseUrl = 'https://comix.to/assets/build/35595e3de3c99889c1aa70/dist/';
  const res = await fetch(baseUrl + 'main-tkpq14-CYLCH7Og.js');
  const js = await res.text();
  const chunks = [...js.matchAll(/"([A-Za-z0-9_-]+\.js)"/g)].map(m => m[1]);
  const uniqueChunks = Array.from(new Set(chunks));
  console.log('All chunk names:', uniqueChunks);
}
run().catch(console.error);
