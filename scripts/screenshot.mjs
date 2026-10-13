// Visual smoke test: serves build/ and screenshots the page at desktop and phone
// widths, scrolled to several chapters, using a headless Chromium over the
// DevTools protocol (no Playwright dependency; Node 22+ has WebSocket built in).
// SwiftShader flags give the headless shell WebGL2 so the MapLibre map and markers render.
//   npm run build && CHROME_BIN=/path/to/chrome node scripts/screenshot.mjs out/
// CHROME_BIN defaults to Playwright's cached headless shell on macOS.
import fs from 'node:fs';
import { execSync, spawn } from 'node:child_process';

const OUT = process.argv[2] ?? 'screenshots';
const PORT = 4173;
const CH =
	process.env.CHROME_BIN ??
	`${process.env.HOME}/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
const shots = [
	['desktop-hero', 1440, 900, '.hero', 0],
	['desktop-vienna', 1440, 900, '#vienna', 0.5],
	['desktop-leesburg', 1440, 900, '#ashburn-leesburg', 0.6],
	['phone-hero', 390, 844, '.hero', 0],
	['phone-herndon', 390, 844, '#herndon', 0.6],
	['phone-purcellville', 390, 844, '#leesburg-purcellville', 0.9]
];

fs.mkdirSync(OUT, { recursive: true });
// A leftover preview server would serve a stale build whose JS no longer exists, so clear the port first.
const killPort = () => {
	try {
		for (const pid of execSync(`lsof -ti tcp:${PORT}`, { encoding: 'utf8' }).split('\n').filter(Boolean)) process.kill(Number(pid), 'SIGTERM');
	} catch {
		/* nothing listening */
	}
};
killPort();
const server = spawn('node_modules/.bin/vite', ['preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const chrome = spawn(
	CH,
	['--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', '--hide-scrollbars', '--remote-debugging-port=9333', '--window-size=1440,900', 'about:blank'],
	{ stdio: 'ignore' }
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(2500);

const targets = await (await fetch('http://127.0.0.1:9333/json')).json();
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
	const m = JSON.parse(e.data);
	if (m.id && pending.has(m.id)) pending.get(m.id)(m), pending.delete(m.id);
};
const send = (method, params = {}) =>
	new Promise((res) => {
		const i = ++id;
		pending.set(i, res);
		ws.send(JSON.stringify({ id: i, method, params }));
	});

await send('Page.enable');
await send('Runtime.enable');
for (const [name, w, h, sel, frac] of shots) {
	await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
	await send('Page.navigate', { url: `http://localhost:${PORT}/` });
	// Settle: the map (lazy) and webfont (masthead sizes to it) both shift layout once loaded.
	for (let i = 0; i < 12; i++) {
		await sleep(500);
		const r = await send('Runtime.evaluate', { expression: `!!document.querySelector('.legend, .nomap') && document.fonts.status === 'loaded'`, returnByValue: true });
		if (r.result?.result?.value) break;
	}
	await send('Runtime.evaluate', {
		expression: `history.scrollRestoration = 'manual'; document.documentElement.style.scrollBehavior='auto';
			const el=document.querySelector('${sel}'); const r=el.getBoundingClientRect();
			window.scrollTo(0, window.scrollY + r.top - innerHeight*0.45 + r.height*${frac});`
	});
	await sleep(1400);
	const info = await send('Runtime.evaluate', {
		expression: `JSON.stringify({hud: document.querySelector('.hud')?.innerText.replace(/\\n/g,' | '), active: document.querySelector('[aria-current=step] h2')?.innerText, markers: [...document.querySelectorAll('.poi')].filter((e) => e.style.visibility !== 'hidden').length, overflow: document.documentElement.scrollWidth > innerWidth, y: Math.round(scrollY), hero: Math.round(document.querySelector('.hero').getBoundingClientRect().height), steps: document.querySelectorAll('[data-step]').length, hydrated: !!document.querySelector('.masthead .line')?.style.fontSize, map: !!document.querySelector('.legend')})`,
		returnByValue: true
	});
	console.log(name, info.result?.result?.value);
	const shot = await send('Page.captureScreenshot', { format: 'png' });
	fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(shot.result.data, 'base64'));
}
ws.close();
chrome.kill();
server.kill();
killPort();
