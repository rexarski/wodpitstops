/**
 * Svelte action for scrollytelling steps.
 * Reports which step is nearest the viewport's focus line, plus how far the
 * reader has scrolled through it (0 → 1), so the map can advance mile by mile.
 */
export interface StepState {
	index: number;
	progress: number;
}

export function scrolly(
	node: HTMLElement,
	opts: { onchange: (s: StepState | null) => void; focus?: number }
) {
	let steps: HTMLElement[] = [];
	let raf = 0;
	const focus = opts.focus ?? 0.45;

	function collect() {
		steps = Array.from(node.querySelectorAll<HTMLElement>('[data-step]'));
	}

	function measure() {
		raf = 0;
		const vh = window.innerHeight;
		const line = vh * focus;
		let best: StepState | null = null;
		let bestDist = Infinity;
		steps.forEach((el, index) => {
			const r = el.getBoundingClientRect();
			// distance from focus line to the element's span (0 when inside)
			const dist = r.top > line ? r.top - line : r.bottom < line ? line - r.bottom : 0;
			if (dist < bestDist) {
				bestDist = dist;
				const progress = Math.min(1, Math.max(0, (line - r.top) / Math.max(1, r.height)));
				best = { index, progress };
			}
		});
		// Nothing active while the first step is still well below the focus line.
		if (best && (best as StepState).index === 0 && steps[0].getBoundingClientRect().top > vh * 0.9) best = null;
		opts.onchange(best);
	}

	function schedule() {
		if (!raf) raf = requestAnimationFrame(measure);
	}

	collect();
	window.addEventListener('scroll', schedule, { passive: true });
	window.addEventListener('resize', schedule);
	const mo = new MutationObserver(() => {
		collect();
		schedule();
	});
	mo.observe(node, { childList: true, subtree: true });
	schedule();

	return {
		destroy() {
			window.removeEventListener('scroll', schedule);
			window.removeEventListener('resize', schedule);
			mo.disconnect();
			if (raf) cancelAnimationFrame(raf);
		}
	};
}
