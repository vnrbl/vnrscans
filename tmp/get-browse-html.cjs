const fs = require('fs');

async function test() {
  const res = await fetch('https://comix.to/browse', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }
  });
  const t = await res.text();
  console.log('Scripts in browse:', [...t.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m => m[1]));
  const jsonMatch = t.match(/<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (jsonMatch) {
    console.log('JSON:', jsonMatch[1].slice(0, 500));
  }
}

test();
