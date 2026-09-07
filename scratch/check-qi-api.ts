async function checkQiApi() {
  const slug = '4190634673-frozen-frontiers';
  const url = `https://api.qimanga.com/api/v1/series/${slug}/chapters?page=1&perPage=100`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  const data = await res.json();
  console.log('Total chapters in API:', data.data?.length);
  console.log('First 5 in API:', data.data?.slice(0, 5).map(c => ({
    number: c.number,
    slug: c.slug,
    title: c.title,
    is_locked: c.is_locked,
    locked: c.locked,
    is_premium: c.is_premium,
    price: c.price,
    coins: c.coins
  })));
}

checkQiApi();
