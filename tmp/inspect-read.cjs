const fs = require('fs');
const html = fs.readFileSync('tmp/chapter-0.html', 'utf8');
const m = html.match(/<script\s+type="application\/json"\s+id="initial-data">([\s\S]*?)<\/script>/);
if (m) {
  const data = JSON.parse(m[1]);
  console.log('read keys:', Object.keys(data.read || {}));
  console.log('read data:\n', JSON.stringify(data.read, null, 2).slice(0, 3000));
} else {
  console.log('no initial-data found');
}
