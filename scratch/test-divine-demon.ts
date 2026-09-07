import { extractImagesFromChapterUrl, extractChaptersFromSeriesUrl } from '../src/lib/chapter-scraper.ts';

async function testDivineDemon() {
  const seriesUrl = "https://qimanhwa.com/series/the-divine-demon's-grand-ascension";
  const chs = await extractChaptersFromSeriesUrl(seriesUrl);
  console.log('Chapters found:', chs.length);
  const ch13 = chs.find(c => c.chapterNumber === 13);
  const ch51 = chs.find(c => c.chapterNumber === 51);
  const ch63 = chs.find(c => c.chapterNumber === 63);

  console.log('Ch 13:', ch13);
  console.log('Ch 51:', ch51);
  console.log('Ch 63:', ch63);

  for (const ch of [ch13, ch51, ch63].filter(Boolean)) {
    console.log(`\nExtracting images for Ch ${ch!.chapterNumber}: ${ch!.url}`);
    try {
      const imgs = await extractImagesFromChapterUrl(ch!.url);
      console.log(`Images found (${imgs.length}):`, imgs.slice(0, 3));
    } catch (e: any) {
      console.error(`Failed: ${e.message}`);
    }
  }
}

testDivineDemon();
