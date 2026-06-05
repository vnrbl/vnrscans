import { extractChaptersFromSeriesUrl, extractImagesFromChapterUrl } from '../src/lib/chapter-scraper';

async function main() {
  console.log('🧪 --- Verification Test for Scraper Upgrades --- 🧪\n');

  const seriesUrl = 'https://qimanhwa.com/series/got-dropped-into-a-ghost-story-still-gotta-work';
  const chapterUrl = 'https://qimanhwa.com/series/got-dropped-into-a-ghost-story-still-gotta-work/chapter-1';

  console.log('1. Testing Series Chapter Discovery (triggers Puppeteer fallback)...');
  try {
    const chapters = await extractChaptersFromSeriesUrl(seriesUrl);
    console.log(`✅ Chapter discovery successful! Found ${chapters.length} chapters.`);
    if (chapters.length > 0) {
      console.log('Sample discovered chapters:');
      chapters.slice(0, 5).forEach(ch => {
        console.log(`  - Ch ${ch.chapterNumber}: "${ch.title || '(No Title)'}" -> ${ch.url}`);
      });
    } else {
      console.error('❌ Failed: Discovered 0 chapters.');
    }
  } catch (err) {
    console.error('❌ Chapter discovery failed:', err);
  }

  console.log('\n2. Testing Chapter Images Extraction (triggers Puppeteer fallback)...');
  try {
    const images = await extractImagesFromChapterUrl(chapterUrl);
    console.log(`✅ Image extraction successful! Found ${images.length} images.`);
    if (images.length > 0) {
      console.log('Sample image URLs:');
      images.slice(0, 5).forEach((img, idx) => {
        console.log(`  [${idx + 1}] ${img}`);
      });
    } else {
      console.error('❌ Failed: Extracted 0 images.');
    }
  } catch (err) {
    console.error('❌ Image extraction failed:', err);
  }
}

main().catch(console.error);
