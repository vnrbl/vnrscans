async function inspectFistKing() {
  const slug = "the-fist-king's-rebirth";
  const url = `https://api.qimanga.com/api/v1/series/${encodeURIComponent(slug)}/chapters?page=1&perPage=100`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  const data = await res.json();
  console.log('Total in API:', data.data?.length);
  console.log('First 5:', data.data?.slice(0, 5));
}

inspectFistKing();
