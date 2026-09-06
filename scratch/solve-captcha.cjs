const fs = require('fs');
const sharp = require('sharp');

async function getAngle(mainBuf, thumbBuf, thumbSize) {
  const mainRaw = await sharp(mainBuf).raw().toBuffer({ resolveWithObject: true });
  const thumbRaw = await sharp(thumbBuf).raw().toBuffer({ resolveWithObject: true });

  const mainW = mainRaw.info.width;
  const mainH = mainRaw.info.height;
  const mainChannels = mainRaw.info.channels;
  const mainData = mainRaw.data;

  const thumbW = thumbRaw.info.width;
  const thumbH = thumbRaw.info.height;
  const thumbChannels = thumbRaw.info.channels;
  const thumbData = thumbRaw.data;

  const mainCx = mainW / 2;
  const mainCy = mainH / 2;
  const thumbCx = thumbW / 2;
  const thumbCy = thumbH / 2;

  const r = thumbSize / 2;
  const rThumb = r - 2;
  const rMain = r + 2;

  const N = 360;
  const thumbRing = [];
  const mainRing = [];

  for (let i = 0; i < N; i++) {
    const rad = (i * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Thumb sample
    const tx = Math.round(thumbCx + rThumb * cos);
    const ty = Math.round(thumbCy + rThumb * sin);
    const tIdx = (ty * thumbW + tx) * thumbChannels;
    thumbRing.push([thumbData[tIdx], thumbData[tIdx + 1], thumbData[tIdx + 2]]);

    // Main sample
    const mx = Math.round(mainCx + rMain * cos);
    const my = Math.round(mainCy + rMain * sin);
    const mIdx = (my * mainW + mx) * mainChannels;
    mainRing.push([mainData[mIdx], mainData[mIdx + 1], mainData[mIdx + 2]]);
  }

  let bestAngle = 0;
  let minDiff = Infinity;

  // Thumb rotation in CSS is: thumbBlock.style.transform = 'rotate(' + angle + 'deg)';
  // When thumb rotates clockwise by angle deg, the pixel originally at phi moves to phi + angle.
  // So the pixel at phi + angle aligns with main at phi.
  // Or in polar coordinates: thumbRing[(phi - angle + 360) % 360] aligns with mainRing[phi]
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

  return bestAngle;
}

async function test() {
  const genRes = await fetch('https://comix.to/@waf/generate', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Referer': 'https://comix.to/@waf/challenge'
    }
  });

  const cookies = genRes.headers.getSetCookie ? genRes.headers.getSetCookie() : [];
  const data = await genRes.json();
  const mainB64 = data.image_base64.split(',')[1];
  const thumbB64 = data.thumb_base64.split(',')[1];

  const mainBuf = Buffer.from(mainB64, 'base64');
  const thumbBuf = Buffer.from(thumbB64, 'base64');

  const calculatedAngle = await getAngle(mainBuf, thumbBuf, data.thumb_size || 140);
  console.log('Calculated Angle:', calculatedAngle, 'Captcha ID:', data.captcha_id);

  // Now submit to /@waf/verify
  const verifyRes = await fetch('https://comix.to/@waf/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Referer': 'https://comix.to/@waf/challenge',
      ...(cookies.length > 0 ? { 'Cookie': cookies.join('; ') } : {})
    },
    body: JSON.stringify({
      captcha_id: data.captcha_id,
      angle: calculatedAngle
    })
  });

  console.log('Verify Status:', verifyRes.status);
  const verifyResult = await verifyRes.json();
  console.log('Verify Result:', verifyResult);
  console.log('Verify Set-Cookie:', verifyRes.headers.getSetCookie ? verifyRes.headers.getSetCookie() : verifyRes.headers.get('set-cookie'));
}

test().catch(console.error);
