import { extractChaptersFromSeriesUrl } from '../src/lib/chapter-scraper.ts';

async function r() {
  const seriesUrl = "https://qimanga.com/series/the-dukedom's-greatest-prodigy";
  const urlObj = new URL(seriesUrl);
  const parts = urlObj.pathname.split('/').filter(Boolean);
  const slug = parts[parts.length - 1];
  console.log('slug is:', slug);
  const firstPageUrl = `https://api.qimanga.com/api/v1/series/${encodeURIComponent(slug)}/chapters?page=1&perPage=100`;
  console.log('firstPageUrl is:', firstPageUrl);
  const res = await fetch(firstPageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
    },
  });
  console.log('firstPageRes.ok:', res.ok, 'status:', res.status);
  const data = await res.json();
  console.log('data.data length:', data.data?.length);

  console.log('\nNow running extractChaptersFromSeriesUrl...');
  const result = await extractChaptersFromSeriesUrl(seriesUrl);
  console.log('result length:', result.length);
}

r();
