const sharp = require('sharp');

async function getWafPass() {
  const genRes = await fetch('https://comix.to/@waf/generate', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Referer': 'https://comix.to/@waf/challenge'
    }
  });

  const data = await genRes.json();
  const mainBuf = Buffer.from(data.image_base64.split(',')[1], 'base64');
  const thumbBuf = Buffer.from(data.thumb_base64.split(',')[1], 'base64');

  const mainRaw = await sharp(mainBuf).raw().toBuffer({ resolveWithObject: true });
  const thumbRaw = await sharp(thumbBuf).raw().toBuffer({ resolveWithObject: true });

  const r = (data.thumb_size || 140) / 2;
  const rThumb = r - 2;
  const rMain = r + 2;

  const N = 360;
  const thumbRing = [];
  const mainRing = [];

  for (let i = 0; i < N; i++) {
    const rad = (i * Math.PI) / 180;
    const tx = Math.round(thumbRaw.info.width / 2 + rThumb * Math.cos(rad));
    const ty = Math.round(thumbRaw.info.height / 2 + rThumb * Math.sin(rad));
    const tIdx = (ty * thumbRaw.info.width + tx) * thumbRaw.info.channels;
    thumbRing.push([thumbRaw.data[tIdx], thumbRaw.data[tIdx + 1], thumbRaw.data[tIdx + 2]]);

    const mx = Math.round(mainRaw.info.width / 2 + rMain * Math.cos(rad));
    const my = Math.round(mainRaw.info.height / 2 + rMain * Math.sin(rad));
    const mIdx = (my * mainRaw.info.width + mx) * mainRaw.info.channels;
    mainRing.push([mainRaw.data[mIdx], mainRaw.data[mIdx + 1], mainRaw.data[mIdx + 2]]);
  }

  let bestAngle = 0;
  let minDiff = Infinity;

  for (let angle = 0; angle < 360; angle++) {
    let diff = 0;
    for (let phi = 0; phi < N; phi++) {
      const tPhi = (phi - angle + 360) % 360;
      const tPix = thumbRing[tPhi];
      const mPix = mainRing[phi];
      const dr = tPix[0] - mPix[0];
      const dg = tPix[1] - mPix[1];
      const db = tPix[2] - mPix[2];
      diff += dr * dr + dg * dg + db * db;
    }
    if (diff < minDiff) {
      minDiff = diff;
      bestAngle = angle;
    }
  }

  const verifyRes = await fetch('https://comix.to/@waf/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Referer': 'https://comix.to/@waf/challenge'
    },
    body: JSON.stringify({ captcha_id: data.captcha_id, angle: bestAngle })
  });

  const vData = await verifyRes.json();
  if (!vData.success) {
    throw new Error('Verification failed with angle ' + bestAngle);
  }

  const cookies = verifyRes.headers.getSetCookie ? verifyRes.headers.getSetCookie() : [];
  const wafPassCookie = cookies.find((c) => c.startsWith('waf_pass='));
  return wafPassCookie ? wafPassCookie.split(';')[0] : '';
}

async function test() {
  const waf = await getWafPass();
  console.log('Obtained WAF token:', waf);

  const res = await fetch('https://comix.to/api/v1/chapters/6979899', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Cookie': waf,
      'Accept': 'application/json, text/plain, */*',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': 'https://comix.to/title/190ml-the-legend-of-the-northern-blade/6979899-chapter-30'
    }
  });

  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Keys:', Object.keys(data));
  console.log('Data:', data);
  if (data.pages && data.pages.items) {
    console.log('Total page items:', data.pages.items.length);
    console.log('Base URL (data.pages.b):', data.pages.b);
    console.log('First 3 items:', data.pages.items.slice(0, 3));
  }
}

test().catch(console.error);
