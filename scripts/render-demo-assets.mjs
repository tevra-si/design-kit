// Renders README/marketing images from a real Tevra run on examples/acceptance-app.
// Run the before/after capture first (see docs/contributing.md), then: node scripts/render-demo-assets.mjs
import { chromium } from 'playwright';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const evidence = resolve(root, 'examples/acceptance-app/.tevra');
const shotName = 'workspace--pricing--laptop.png';
const latest = kind => { const dir = resolve(evidence, 'artifacts', kind); const run = readdirSync(dir).find(name => !name.endsWith('.json')); if (!run) throw new Error(`No ${kind} capture in ${dir}`); return resolve(dir, run, shotName); };
const sources = { before: latest('baseline'), after: latest('current'), diff: resolve(evidence, 'artifacts/diff', shotName) };
const img = name => 'data:image/png;base64,' + readFileSync(sources[name]).toString('base64');
const font = `font-family: -apple-system, "Inter", "Segoe UI", Helvetica, Arial, sans-serif;`;
// Crop of the pricing section in the 1280px-wide captures.
const crop = (src, label, sub, tone) => `
  <figure><figcaption><b>${label}</b><span class="${tone}">${sub}</span></figcaption>
  <div class="crop"><img src="${src}"></div></figure>`;
const checks = [['Functional assertions','pass'],['axe (WCAG A/AA)','pass'],['Console errors','pass'],['Network errors','pass'],['Runtime errors','pass'],['Overflow','pass'],['Touch targets','pass'],['Visual diff 4.9% > 1%','fail']];
const strip = checks.map(([t,s]) => `<li class="${s}">${s==='pass'?'✓':'✕'} ${t}</li>`).join('');
const css = `*{box-sizing:border-box;margin:0}body{${font}background:#0f2a21;color:#f3f6f1}
.wrap{padding:56px 64px}h1{font-size:44px;letter-spacing:-.02em;font-weight:750}h1 em{font-style:normal;color:#8fe0b4}
p.lead{font-size:20px;color:#b9cbc0;margin-top:10px}
.row{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:36px}
figure{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgb(0 0 0/.35)}
figcaption{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#17382d;font-size:15px}
figcaption span{font-size:13px;padding:3px 10px;border-radius:99px}.ok{background:#1f5c44;color:#c9f2da}.new{background:#3a4f2a;color:#e3f5b8}.bad{background:#6b1d1d;color:#ffd1d1}
.crop{height:290px;overflow:hidden;position:relative}.crop img{position:absolute;width:820px;left:-26px;top:-625px}
ul{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}li{font-size:15px;padding:8px 14px;border-radius:10px;background:#17382d;color:#c9f2da}
li.fail{background:#6b1d1d;color:#ffd1d1;font-weight:700}
.verdict{margin-top:22px;display:flex;align-items:center;gap:16px;font-size:18px;color:#b9cbc0}.verdict b{font-size:20px;color:#fff;background:#b42318;padding:6px 14px;border-radius:8px}`;
const hero = `<style>${css}</style><div class="wrap">
<h1>Your agent says it looks good. <em>Tevra shows the evidence.</em></h1>
<p class="lead">Real capture of the bundled acceptance app after a pricing redesign: same route, same viewport (1280px), same browser.</p>
<div class="row">${crop(img('before'),'Approved baseline','human-approved','ok')}${crop(img('after'),'After the change','captured','new')}${crop(img('diff'),'Pixel diff','4.9% changed','bad')}</div>
<ul>${strip}</ul>
<div class="verdict"><b>FAIL · blocked</b> Intended or not, a visual change waits for human approval before the baseline moves.</div></div>`;
const social = `<style>${css}.wrap{padding:64px 72px}h1{font-size:64px}.tag{font-size:26px;color:#b9cbc0;margin-top:18px;max-width:900px;line-height:1.35}
.brand{display:flex;align-items:center;gap:18px;font-size:28px;font-weight:700;color:#8fe0b4;margin-bottom:34px}.logo{width:64px;height:64px;border-radius:16px;background:#175a44;display:grid;place-items:center;color:#fff;font-size:38px;font-weight:800;box-shadow:inset 0 0 0 3px #8fe0b4}
.chips{display:flex;gap:12px;margin-top:40px;flex-wrap:wrap}.chips span{font-size:20px;padding:10px 18px;border-radius:12px;background:#17382d;color:#c9f2da}</style>
<div class="wrap"><div class="brand"><div class="logo">T</div>Tevra Design Kit</div>
<h1>Design skills for coding agents.<br><em>With evidence.</em></h1>
<p class="tag">12 Agent Skills plus a CLI for screenshots, pixel diffs, axe and Lighthouse. Claude Code, Codex, Cursor, Kiro, Gemini CLI, Copilot, OpenCode, Windsurf.</p>
<div class="chips"><span>visual regression</span><span>accessibility</span><span>design systems</span><span>performance</span><span>MIT</span></div></div>`;
const icon = `<style>*{margin:0}body{background:transparent}.i{width:512px;height:512px;border-radius:112px;background:linear-gradient(145deg,#1d6b51,#0f2a21);display:grid;place-items:center;position:relative;overflow:hidden}
.t{${font}font-weight:850;font-size:330px;color:#f3f6f1;line-height:1;margin-top:-18px}.c{position:absolute;right:58px;bottom:58px;width:132px;height:132px;border-radius:50%;background:#8fe0b4;display:grid;place-items:center;font-size:92px;color:#0f2a21;font-weight:900;${font}}</style>
<div class="i"><div class="t">T</div><div class="c">✓</div></div>`;
const b = await chromium.launch();
async function shot(html, w, h, file, opts = {}) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: opts.scale ?? 1 });
  await p.setContent(html); await p.waitForTimeout(150);
  await p.screenshot({ path: file, fullPage: opts.full ?? false, omitBackground: opts.transparent ?? false }); await p.close();
}
await shot(hero, 1600, 680, resolve(root, 'docs/assets/hero.png'));
await shot(social, 1280, 640, resolve(root, 'docs/assets/social-preview.png'));
await shot(icon, 512, 512, resolve(root, '.claude-plugin/icon.png'), { transparent: true });
const r = await b.newPage({ viewport: { width: 1200, height: 1500 } });
await r.goto('file://' + resolve(evidence, 'reports/quality.html')); await r.waitForTimeout(300); await r.screenshot({ path: resolve(root, 'docs/assets/report.png') });
await b.close();
