async function test() {
  const res = await fetch('https://vortexscans.org/_vcomics/DovQox3M.js');
  const js = await res.text();
  console.log('Bundle length:', js.length);

  const endpoints = [...js.matchAll(/["'`](\/api\/[a-zA-Z0-9_\/-]+)["'`]/g)].map(m => m[1]);
  console.log('Endpoints in bundle:', Array.from(new Set(endpoints)));

  // Look for chapter pagination or series chapter endpoints
  const chapterPatterns = [...js.matchAll(/(\/api\/[a-zA-Z0-9_\/-]*chapter[a-zA-Z0-9_\/-]*)/gi)].map(m => m[1]);
  console.log('Chapter endpoints:', Array.from(new Set(chapterPatterns)));
}

test().catch(console.error);
