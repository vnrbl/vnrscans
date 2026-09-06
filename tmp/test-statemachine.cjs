const fs = require('fs');
let js = fs.readFileSync('tmp/secure-curr.js', 'utf8');

// 1. Initialize O_ to 34
js = js.replace('Ο_=void 0,O0={},T2=α$', 'Ο_=34,O0={},T2=α$');

// 2. Make case 8 always go to 28
js = js.replace('case 8:Z_=!Ο_||T2&&F7?20:28;break;', 'case 8:Z_=28;break;');

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
  location: { href: 'https://comix.to/title/l7re/11312305-chapter-87', hostname: 'comix.to' },
  navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' },
  console: console,
  setTimeout, clearTimeout, setInterval, clearInterval
});

try {
  vm.runInContext(js, ctx);
  console.log('SUCCESS! VM ran without error! g$ keys:', Object.keys(ctx.g$ || {}));
} catch (e) {
  console.log('Caught:', e.message);
  console.log(e.stack);
}
