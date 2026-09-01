import puppeteer from 'puppeteer';

async function main() {
  const url = 'https://asurascans.com/comics/crimson-reset-fc4c7eba/chapter/49';
  console.log(`Loading page: ${url}`);
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800 });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise(r => setTimeout(r, 4000)); // Wait for page scripts

    console.log('Extracting images before scroll:');
    const imagesBefore = await page.evaluate(() => {
      return Array.from(document.images).map(img => ({
        src: img.src,
        dataSrc: img.getAttribute('data-src'),
        dataLazySrc: img.getAttribute('data-lazy-src'),
        class: img.className,
        alt: img.alt,
        width: img.width,
        height: img.height,
        nw: img.naturalWidth,
        nh: img.naturalHeight
      }));
    });
    console.log(`Found ${imagesBefore.length} images:`);
    imagesBefore.slice(0, 10).forEach((img, idx) => {
      console.log(`  Image ${idx + 1}:`, JSON.stringify(img, null, 2));
    });

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await browser.close();
  }
}

main();
