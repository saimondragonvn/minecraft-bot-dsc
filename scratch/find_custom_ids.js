const fs = require('fs');
const path = require('path');

function walk(dir) {
  let res = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) res = res.concat(walk(p));
    else if (p.endsWith('.js')) res.push(p);
  }
  return res;
}

const files = walk('./src');
const customIds = new Set();
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const regex = /setCustomId\(['"`]([^'"`]+)['"`]\)/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    customIds.add(m[1]);
  }
});

console.log(Array.from(customIds).sort());
