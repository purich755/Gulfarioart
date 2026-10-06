import fs from 'node:fs';
const s = JSON.parse(fs.readFileSync('raw/ya-reviews.json', 'utf8'));
const out = [];
const walk = (o) => { if (!o || typeof o !== 'object') return; if (typeof o.text === 'string' && o.author) out.push({ name: o.author.name, date: o.updatedTime, rating: o.rating, text: o.text }); for (const k in o) walk(o[k]); };
walk(s);
fs.writeFileSync('raw/reviews.json', JSON.stringify(out, null, 1));
for (const r of out) console.log(`— ${r.name} (${(r.date||'').slice(0,10)}): ${r.text.replace(/\s+/g,' ')}`);
console.log(out.length);
