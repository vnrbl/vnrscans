import { extractChaptersFromSeriesUrl } from '../src/lib/chapter-scraper.ts';

async function testQi() {
  const urls = [
    "https://qimanhwa.com/series/4190634673-frozen-frontiers",
    "https://qiscans.org/series/rise-of-the-limitless-necromancer",
    "https://qimanga.com/series/paying-respects-to-the-sect-leader",
    "https://qiscans.org/series/sword-gods-livestream"
  ];

  for (const url of urls) {
    console.log('Testing', url);
    try {
      const chs = await extractChaptersFromSeriesUrl(url);
      console.log('Returned count:', chs.length, 'max chapter:', chs[chs.length - 1]?.chapterNumber);
    } catch (e) {
      console.error('Error for', url, e.message);
    }
  }
}

testQi();
