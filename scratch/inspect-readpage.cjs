async function run() {
  const baseUrl = 'https://comix.to/assets/build/35595e3de3c99889c1aa70/dist/';
  const res = await fetch(baseUrl + 'ReadPage-tkpq14-BfGL4Cot.js');
  const js = await res.text();
  console.log('ReadPage length:', js.length);

  // Look for occurrences of "pages" or queries
  const pagesMatches = [...js.matchAll(/.{0,50}pages.{0,50}/gi)].map(m => m[0]);
  console.log('pages occurrences:', pagesMatches.slice(0, 10));

  // Look for .get( or fetch
  const getMatches = [...js.matchAll(/\.get\([^\)]+\)/g)].map(m => m[0]);
  console.log('.get calls:', getMatches.slice(0, 10));
}

run().catch(console.error);
