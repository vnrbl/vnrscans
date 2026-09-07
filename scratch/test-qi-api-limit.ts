async function r() {
  for (let i = 0; i < 5; i++) {
    const res = await fetch('https://api.qimanga.com/api/v1/series/i-became-the-bastard-genius-of-the-noble-dark-clan/chapters?page=1&perPage=100', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      }
    });
    console.log(i, 'status:', res.status, 'ok:', res.ok);
  }
}
r();
