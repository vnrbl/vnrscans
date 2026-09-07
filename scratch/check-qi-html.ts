async function checkQiHtml() {
  const url = 'https://qimanhwa.com/series/4190634673-frozen-frontiers';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html'
    }
  });
  console.log('Status:', res.status, 'url:', res.url);
  const html = await res.text();
  console.log('HTML length:', html.length);
  // Look for chapter 64 or 65 or links
  const m64 = html.match(/chapter[-_ ]?64/gi);
  console.log('chapter 64 matches in HTML:', m64);
  const anchors = [...html.matchAll(/<a\b[^>]*?href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const chAnchors = anchors.filter(a => a[1].includes('chapter') || a[2].toLowerCase().includes('chapter'));
  console.log('Chapter anchors in HTML:', chAnchors.length);
  if (chAnchors.length > 0) {
    console.log('First 3 anchors:', chAnchors.slice(0, 3).map(a => a[1]));
  }
}

checkQiHtml();
