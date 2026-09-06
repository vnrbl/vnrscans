async function run() {
  const baseUrl = 'https://comix.to/assets/build/35595e3de3c99889c1aa70/dist/';
  const res = await fetch(baseUrl + 'env-tkpq14-BMG3QqEA.js');
  const js = await res.text();

  const lines = js.split(';');
  const relevant = lines.filter(l => l.includes('pages'));
  console.log('Relevant lines with pages count:', relevant.length);
  for (const line of relevant) {
    console.log('--- LINE ---');
    console.log(line.slice(0, 300));
  }
}
run().catch(console.error);
