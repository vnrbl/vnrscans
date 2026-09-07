import { extractImagesFromChapterUrl, extractImagesFromChapterUrls } from '../src/lib/chapter-scraper.ts';

async function testQiImages() {
  const chapterUrl = 'https://qiscans.org/series/i-became-the-bastard-genius-of-the-noble-dark-clan/chapter-64';
  console.log('Testing single chapter URL:', chapterUrl);
  try {
    const images = await extractImagesFromChapterUrl(chapterUrl);
    console.log('Images count:', images?.length);
    if (images?.length > 0) {
      console.log('First image:', images[0]);
    }
  } catch (e) {
    console.error('Error extracting images:', e.message);
  }

  // Also test with example URL
  console.log('\nTesting with example URL:');
  try {
    const images = await extractImagesFromChapterUrl(
      chapterUrl,
      'https://media.qimanhwa.com/file/qiscans/upload/upload/series/example/chapter/page_001.webp'
    );
    console.log('Images count with example:', images?.length);
    if (images?.length > 0) {
      console.log('First image with example:', images[0]);
    }
  } catch (e) {
    console.error('Error with example:', e.message);
  }
}

testQiImages();
