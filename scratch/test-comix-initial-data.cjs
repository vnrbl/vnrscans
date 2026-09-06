async function test() {
  const res = await fetch('https://comix.to/title/190ml-the-legend-of-the-northern-blade/6979899-chapter-30', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Length:', text.length);
  if (text.includes('initial-data')) {
    console.log('HAS initial-data!');
    const match = text.match(/<script id="initial-data"[^>]*>([\s\S]*?)<\/script>/);
    if (match) {
      console.log('initial-data content snippet:', match[1].slice(0, 500));
      try {
        const parsed = JSON.parse(match[1]);
        console.log('Keys in parsed:', Object.keys(parsed));
        console.log('Query keys:', Object.keys(parsed.queries || {}));
      } catch (e) {
        console.log('JSON parse error:', e.message);
      }
    }
  } else {
    console.log('No initial-data. Snippet:', text.slice(0, 300));
  }
}
test().catch(console.error);
