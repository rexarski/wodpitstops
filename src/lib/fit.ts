/**
 * Scales one line of text so it spans its parent's width, magazine-masthead style.
 * Width is linear in font-size, so one measurement gives the exact size; re-run on
 * resize and once the webfont has loaded (fallback metrics differ).
 */
export function fitWidth(el: HTMLElement) {
	const parent = el.parentElement;
	if (!parent) return;
	let lastWidth = -1;
	const fit = () => {
		const width = parent.clientWidth;
		if (width === lastWidth) return;
		lastWidth = width;
		const range = document.createRange();
		range.selectNodeContents(el);
		const w = range.getBoundingClientRect().width;
		const size = parseFloat(getComputedStyle(el).fontSize);
		if (w > 0 && size > 0) el.style.fontSize = `${(size * parent.clientWidth) / w}px`;
	};
	fit();
	const ro = new ResizeObserver(fit);
	ro.observe(parent);
	document.fonts?.ready.then(() => {
		lastWidth = -1;
		fit();
	});
	return { destroy: () => ro.disconnect() };
}
