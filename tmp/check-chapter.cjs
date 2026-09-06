const fs = require('fs');

if (fs.existsSync('tmp/comix-chapter.html')) {
  const html = fs.readFileSync('tmp/comix-chapter.html', 'utf8');
  console.log('File size:', html.length);
  const m = html.match(/<script\s+type="application\/json"\s+id="initial-data">([\s\S]*?)<\/script>/);
  if (m) {
    console.log('Found initial-data script! Length:', m[1].length);
    const data = JSON.parse(m[1]);
    console.log('Keys:', Object.keys(data));
    if (data.queries) {
      console.log('Queries keys:');
      for (const k of Object.keys(data.queries)) {
        console.log('  ', k);
      }
    }
  } else {
    console.log('No initial-data found in comix-chapter.html');
    console.log('All script tags:');
    const scripts = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
    for (const s of scripts) {
      console.log('Tag preview:', s.slice(0, 100).replace(/\n/g, ' '));
    }
  }
} else {
  console.log('tmp/comix-chapter.html not found');
}
