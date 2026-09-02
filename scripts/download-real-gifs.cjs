const https = require('https');
const fs = require('fs');
const path = require('path');

const MEMES = [
  { id: 'peak-fiction', url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif' },
  { id: 'absolute-cinema', url: 'https://media.giphy.com/media/l4pTfx2qLszoacZRS/giphy.gif' },
  { id: 'nah-id-win', url: 'https://media.giphy.com/media/DGsDLr9nyz2LkVgKFs/giphy.gif' },
  { id: 'pure-aura', url: 'https://media.giphy.com/media/ul1omlrGG6kpO/giphy.gif' },
  { id: 'gigachad', url: 'https://media.giphy.com/media/3o7TKnO6Wve6502iJ2/giphy.gif' },
  { id: 'let-him-cook', url: 'https://media.giphy.com/media/demgpwJ6rs2DS/giphy.gif' },
  { id: 'domain-expansion', url: 'https://media.giphy.com/media/bDWdJRY2IZCX6/giphy.gif' },
  { id: 'my-goat', url: 'https://media.giphy.com/media/mqiq8aY84dnqAtVlnd/giphy.gif' },
  { id: 'anya-heh', url: 'https://media.giphy.com/media/ylyUQkEEfIGKPLFKXS/giphy.gif' },
  { id: 'fraud-watch', url: 'https://media.giphy.com/media/x0npYExCGOZeo/giphy.gif' },
  { id: 'saitama-ok', url: 'https://media.giphy.com/media/n5j50VGDzkUqA/giphy.gif' },
  { id: 'skull-dead', url: 'https://media.giphy.com/media/3o7btUg31OCi0NXdkY/giphy.gif' },
  { id: 'popcorn-drama', url: 'https://media.giphy.com/media/gl0mkIZOW6Nwc/giphy.gif' },
  { id: 'stonks-up', url: 'https://media.giphy.com/media/YnkMcHgNIMW4Yfmjxr/giphy.gif' },
  { id: 'cat-dance', url: 'https://media.giphy.com/media/GeimqsH0TLDt4tScGw/giphy.gif' },
  { id: 'shocked-enel', url: 'https://media.giphy.com/media/uaJLuMokII24w/giphy.gif' },
  { id: 'plot-twist-mindblown', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
  { id: 'he-just-like-me', url: 'https://media.giphy.com/media/n4oKYFlAcv2AU/giphy.gif' },
  { id: 'sipping-tea', url: 'https://media.giphy.com/media/3o85xGocUH8RYoDKKs/giphy.gif' },
  { id: 'sus-glance', url: 'https://media.giphy.com/media/26ghbWoXv3G6ypo8o/giphy.gif' },
  { id: 'bro-ran-away', url: 'https://media.giphy.com/media/731iFlLiqaRk4/giphy.gif' },
  { id: 'cliffhanger-pain', url: 'https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif' },
  { id: 'emotional-damage', url: 'https://media.giphy.com/media/ro08ZmQ1MeqZypzgDN/giphy.gif' },
  { id: 'aqua-crying', url: 'https://media.giphy.com/media/adOhvwrFJ32psmc5Pb/giphy.gif' },
  { id: 'guts-pain', url: 'https://media.giphy.com/media/pUp9Nb1czvHMY/giphy.gif' },
  { id: 'salute-respect', url: 'https://media.giphy.com/media/l4pMattUYTTM7qpIk/giphy.gif' },
  { id: 'anya-waku-waku', url: 'https://media.giphy.com/media/bDWdJRY2IZCX6/giphy.gif' },
  { id: 'heart-eyes', url: 'https://media.giphy.com/media/26FLdmIp6wJr91JAI/giphy.gif' },
  { id: 'thumbs-up-cat', url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif' },
];

const destDir = path.join(__dirname, '..', 'public', 'memes');

async function download(item) {
  return new Promise((resolve) => {
    const filePath = path.join(destDir, `${item.id}.gif`);
    const file = fs.createWriteStream(filePath);
    
    https.get(item.url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          const size = fs.statSync(filePath).size;
          if (size > 5000 && size !== 239321) {
            console.log(`[SUCCESS] Downloaded: ${item.id}.gif (${(size/1024).toFixed(1)} KB)`);
            resolve(true);
          } else {
            console.log(`[SKIPPED] ${item.id}.gif size was placeholder (${size}b)`);
            resolve(false);
          }
        });
      } else {
        file.close();
        fs.unlink(filePath, () => {});
        console.log(`[FAIL] ${item.id}: status ${res.statusCode}`);
        resolve(false);
      }
    }).on('error', (err) => {
      file.close();
      fs.unlink(filePath, () => {});
      console.log(`[ERR] ${item.id}: ${err.message}`);
      resolve(false);
    });
  });
}

async function main() {
  console.log('Downloading all verified GIF meme assets to /public/memes/ ...');
  for (const item of MEMES) {
    await download(item);
  }
  console.log('All downloads completed.');
}

main();
