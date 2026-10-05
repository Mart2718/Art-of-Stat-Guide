import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const content = JSON.parse(read('data/tools.json'));
const chooser = JSON.parse(read('data/chooser.json'));
const assert = (ok,msg) => { if (!ok) throw new Error(msg); };
const text = (value,name) => assert(typeof value === 'string' && value.trim(),`${name} must be nonempty text`);
const safeId = id => /^[a-z][a-z0-9-]*$/.test(id);
const url = (value,name) => { text(value,name); assert(new URL(value).protocol === 'https:',`${name} must use https`); };
const esc = value => String(value).replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
assert(Array.isArray(content.tools) && content.tools.length,'tools must be an array');
assert(Array.isArray(content.categories) && content.categories.length,'categories must be an array');
for (const k of ['title','course','subtitle','updated','introVideo']) text(content.site[k],`site.${k}`);
url(content.site.introVideo,'intro video');
const categories = new Set();
for (const c of content.categories) { assert(safeId(c.id) && !categories.has(c.id),`Invalid/duplicate category: ${c.id}`); categories.add(c.id); text(c.title,'category title'); text(c.description,'category description'); }
const ids = new Set();
for (const t of content.tools) {
  assert(safeId(t.id) && !ids.has(t.id),`Invalid/duplicate tool id: ${t.id}`); ids.add(t.id);
  assert(categories.has(t.category),`Unknown category for ${t.id}`);
  for (const key of ['title','useWhen','appName','location','inputs','interpret']) text(t[key],`${t.id}.${key}`);
  url(t.appUrl,`${t.id}.appUrl`);
  assert(Array.isArray(t.steps) && t.steps.length,`${t.id} needs steps`); t.steps.forEach(s => text(s,`${t.id} step`));
  for (const key of ['videos','screenshots','objectiveCodes']) assert(Array.isArray(t[key]),`${t.id}.${key} must be an array`);
  for (const link of [...t.videos,...(t.resources || [])]) { text(link.label,'link label'); url(link.url,'resource url'); }
  for (const image of t.screenshots) { text(image.alt,'image alt'); assert(/^assets\/[a-zA-Z0-9._-]+$/.test(image.src),'Image must be inside assets/'); assert(fs.existsSync(path.join(root,'site',image.src)),`Missing image ${image.src}`); }
}
assert(chooser.nodes && chooser.nodes[chooser.start],'Missing chooser starting node');
for (const [id,node] of Object.entries(chooser.nodes)) {
  assert(safeId(id),`Invalid chooser id ${id}`);
  if (node.options) {
    text(node.question,`${id}.question`); text(node.hint,`${id}.hint`);
    assert(Array.isArray(node.options) && node.options.length,`${id} needs options`);
    for (const option of node.options) { text(option.label,`${id} option`); assert(chooser.nodes[option.next],`Unknown next node ${option.next}`); }
  } else {
    text(node.explanation,`${id}.explanation`); assert(Array.isArray(node.tools),`${id}.tools must be an array`);
    for (const tool of [...node.tools,...(node.related || [])]) assert(ids.has(tool),`Unknown recommendation ${tool}`);
  }
}
const visited = new Set();
function walk(id,stack = new Set()) {
  assert(!stack.has(id),`Chooser has a cycle at ${id}`);
  if (visited.has(id)) return; visited.add(id); const nextStack = new Set(stack).add(id);
  for (const option of chooser.nodes[id].options || []) walk(option.next,nextStack);
}
walk(chooser.start); assert(visited.size === Object.keys(chooser.nodes).length,'Chooser contains unreachable nodes');
function link(l,cls='button secondary') { return `<a class="${cls}" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} <span aria-hidden="true">↗</span></a>`; }
function screenshot(i) {
 return `<figure class="screenshot"><a href="${esc(i.src)}" target="_blank" rel="noopener" aria-label="Open full-size screenshot"><img src="${esc(i.src)}" alt="${esc(i.alt)}" loading="lazy"></a><figcaption>${esc(i.caption || 'From the class guide; the current interface may look different.')} <a href="${esc(i.src)}" target="_blank" rel="noopener">Open full-size screenshot ↗</a></figcaption></figure>`;
}
function card(t) {
 const featured = t.screenshots.filter(i=>i.featured);
 const others = t.screenshots.filter(i=>!i.featured);
 return `<article class="card" id="${t.id}" aria-labelledby="${t.id}-title"><span class="tag">${esc(t.appName)}</span><h3 id="${t.id}-title">${esc(t.title)}</h3><p class="use">${esc(t.useWhen)}</p>${t.objectiveCodes.length ? `<p class="detail-text">Learning objectives: ${t.objectiveCodes.map(esc).join(', ')}</p>` : ''}<div class="actions">${link({url:t.appUrl,label:'Open Art of Stat'},'button primary')}${t.videos.map(v => link(v)).join('')}</div>${t.courseNote ? `<p class="course-note">${esc(t.courseNote)}</p>`:''}${featured.length ? `<div class="screens featured">${featured.map(screenshot).join('')}</div>`:''}<details><summary>Show steps &amp; reminders</summary><p class="detail-label">Find the app</p><p class="detail-text">${esc(t.location)} → <strong>${esc(t.appName)}</strong></p><p class="detail-label">Have ready</p><p class="detail-text">${esc(t.inputs)}</p><ol>${t.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><div class="interpret"><strong>Make sense of the result</strong>${esc(t.interpret)}</div>${(t.resources || []).map(l => `<p>${link(l,'resource-link')}</p>`).join('')}${others.length ? `<details class="screens"><summary>See the guide’s screenshot${others.length>1?'s':''}</summary>${others.map(screenshot).join('')}</details>`:''}</details></article>`;
}

const cards = content.categories.map((c,i) => `<section class="category" data-category="${c.id}" aria-labelledby="category-${c.id}"><div class="category-heading"><span aria-hidden="true">${String(i+1).padStart(2,'0')}</span><h3 id="category-${c.id}">${esc(c.title)}</h3></div><div class="card-grid">${content.tools.filter(t=>t.category===c.id).map(card).join('')}</div></section>`).join('\n');
let html = read('site/index.template.html').replace('/* STYLES */',read('site/styles.css')).replace('<!-- CARDS -->',cards).replace('/* DATA */','window.HUB_DATA = '+JSON.stringify({content,chooser}).replace(/</g,'\\u003c')+';').replace('/* APP */',read('site/app.js'));
html = html.replace('<title>Art of Stat Student Hub | STAT C1000</title>',`<title>${esc(content.site.title)} | ${esc(content.site.course)}</title>`).replace('https://youtu.be/qNy4MIkYrHE',esc(content.site.introVideo)).replace('Find the right Art of Stat tool, follow a class example, and make sense of what your results mean.',esc(content.site.subtitle));
html = html.replace('Art of Stat Student Hub · STAT C1000',`${esc(content.site.title)} · ${esc(content.site.course)} · Updated ${esc(content.site.updated)}`);
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
fs.writeFileSync(path.join(root,'dist/index.html'),html);
fs.cpSync(path.join(root,'site/assets'),path.join(root,'dist/assets'),{recursive:true});
console.log(`Built ${content.tools.length} tools; validated ${visited.size} chooser nodes. Output: dist/`);
// Self-contained preview: displays the same page without requiring its asset folder.
let preview = html;
for (const tool of content.tools) for (const image of tool.screenshots) {
  const bytes = fs.readFileSync(path.join(root, 'site', image.src));
  const mime = image.src.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const dataUrl = `data:${mime};base64,${bytes.toString('base64')}`;
  preview = preview.replaceAll(`src="${esc(image.src)}"`, `src="${dataUrl}"`).replaceAll(`href="${esc(image.src)}"`, `href="${dataUrl}"`);
}
preview = preview.replace('</body>', `<dialog id="preview-image"><button type="button" id="preview-close">Close screenshot</button><img alt=""></dialog><style>#preview-image{max-width:96vw;max-height:94vh;border:1px solid #d4ded6;border-radius:12px;padding:16px;background:white}#preview-image::backdrop{background:#172b39cc}#preview-image img{display:block;max-width:88vw;max-height:78vh;object-fit:contain;margin-top:12px}#preview-close{padding:9px 15px;background:white;border:1px solid #bbcbbf;border-radius:8px}</style><script>(()=>{const dialog=document.getElementById('preview-image');document.querySelectorAll('a[href^="data:image/"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();dialog.querySelector('img').src=a.href;dialog.querySelector('img').alt=a.closest('figure').querySelector('img').alt;dialog.showModal();}));document.getElementById('preview-close').addEventListener('click',()=>dialog.close());})();</script></body>`);
fs.writeFileSync(path.join(root,'dist/preview.html'),preview);
