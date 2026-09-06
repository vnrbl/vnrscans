const fs = require('fs');

function parse() {
  const html = fs.readFileSync('scratch/ch30-page.html', 'utf8');
  const match = html.match(/<script[^>]*id="initial-data"[^>]*>([\s\S]*?)<\/script>/i);
  if (match) {
    const json = JSON.parse(match[1]);
    fs.writeFileSync('scratch/ch30-data.json', JSON.stringify(json, null, 2));
    console.log('Saved ch30-data.json! Top keys:', Object.keys(json));
    console.log('Query keys:', Object.keys(json.queries || {}));
    for (const [k, v] of Object.entries(json.queries || {})) {
      console.log('Query Key:', k);
      console.log('Value type:', typeof v, Array.isArray(v) ? `Array(${v.length})` : Object.keys(v || {}));
    }
  } else {
    console.log('No match!');
  }
}

parse();
