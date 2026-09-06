async function test() {
  const url = 'https://vortexscans.org/series/the-legend-of-the-northern-blade';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
  });

  const html = await res.text();
  console.log('Fetched HTML length:', html.length);

  const links = [...html.matchAll(/<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  console.log('Total links:', links.length);

  const chapterLinks = links.filter(l => l[1].includes('chapter') || /chapter\s*\d+/i.test(l[2]));
  console.log('Chapter links count:', chapterLinks.length);

  if (chapterLinks.length > 0) {
    console.log('First 3 chapter links:');
    for (const l of chapterLinks.slice(0, 3)) {
      console.log('  Href:', l[1], 'Text:', l[2].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80));
    }
  }

  // Also test reading a chapter page:
  const firstChUrl = new URL(chapterLinks[0][1], url).href;
  console.log('\nFetching sample chapter page:', firstChUrl);
  const chRes = await fetch(firstChUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
  });
  const chHtml = await chRes.text();
  console.log('Chapter HTML length:', chHtml.length);
  const imgMatches = [...chHtml.matchAll(/<img[^>]*src=["']([^"']*)["'][^>]*>/gi)].map(m => m[1]);
  console.log('Image URLs on chapter page:', imgMatches.length);
  console.log('Sample images:', imgMatches.slice(0, 5));
}

test().catch(console.error);
