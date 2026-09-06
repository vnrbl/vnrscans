const fs = require('fs');
let js = fs.readFileSync('tmp/secure-curr.js', 'utf8');

const target = 'case B3H.В3В()[30][67][47]:return J6C[9];';
console.log('Target exists:', js.includes(target));

js = js.replace(target, 'case B3H.В3В()[30][67][47]: console.log("J6C[9] is:", J6C[9]); return J6C[9];');

const funcEnd = 'J6C[8]++,J6C[1]=B3H.В3В()[21][63][48]}}}(),g$={};';
console.log('funcEnd exists:', js.includes(funcEnd));
js = js.replace(funcEnd, 'J6C[8]++,J6C[1]=B3H.В3В()[21][63][48]}; console.log("P ended without return! J6C[1]=", typeof J6C !== "undefined" ? J6C[1] : "undef"); }(),g$={};');

js = js.replace(/export\s*\{[^}]+\};?/g, '');

const vm = require('vm');
const ctx = vm.createContext({
  window: {},
  document: {
    querySelector: () => ({ getAttribute: () => 'ZZYdbXagjEpeaRwTE56mTpBkKVnnIBmAB3gdwWXXjEM7ZqAcLgonw0ylNjY621zM0zefn1Qg_jIQEn0oAIFnaXeGk3K4XZgY6S1Ldadwahluywsju2Z_xXiMDsD2' }),
    querySelectorAll: () => [],
    createElement: () => ({ style: {}, setAttribute: () => {} }),
    head: {},
    body: {}
  },
  location: { href: 'https://comix.to/title/l7re/11312305-chapter-87' },
  navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' },
  console: console,
  setTimeout, clearTimeout, setInterval, clearInterval
});

try {
  vm.runInContext(js, ctx);
} catch (e) {
  console.log('Caught:', e.message);
}
