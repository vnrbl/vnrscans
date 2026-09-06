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
  const wafCookie = await getWafPass();
  console.log('Got WAF Cookie:', wafCookie);

  const pageRes = await fetch('https://comix.to/title/190ml-the-legend-of-the-northern-blade/6979899-chapter-30', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Cookie': wafCookie,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });

  console.log('Page status:', pageRes.status);
  const text = await pageRes.text();
  console.log('Page title:', text.match(/<title>([^<]*)<\/title>/)?.[1]);
  console.log('Contains initial-data:', text.includes('initial-data'));

  if (text.includes('initial-data')) {
    const match = text.match(/<script id="initial-data"[^>]*>([\s\S]*?)<\/script>/);
    if (match) {
      console.log('initial-data JSON length:', match[1].length);
      const json = JSON.parse(match[1]);
      console.log('Top level keys:', Object.keys(json)); if (json.queries) console.log('Query keys:', Object.keys(json.queries)); fs.writeFileSync('scratch/ch30-initial-data.json', JSON.stringify(json, null, 2));
      for (const [k, v] of Object.entries(json.queries || {})) {
        console.log(`Key ${k.slice(0, 50)} => value type:`, typeof v, Array.isArray(v) ? `Array(${v.length})` : Object.keys(v || {}));
      }
    }
  }
}

test().catch(console.error);
