import { extractChaptersFromSeriesUrl } from '../src/lib/chapter-scraper.ts';

async function testQiDetail() {
  const url = "https://qimanhwa.com/series/4190634673-frozen-frontiers";
  const chs = await extractChaptersFromSeriesUrl(url);
  console.log('Total count:', chs.length);
  console.log('First 5:', chs.slice(0, 5));
  console.log('Last 5:', chs.slice(-5));
}

testQiDetail();
