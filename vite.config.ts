import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// BASE_PATH lets the same build serve from a sub-path (e.g. GitHub Pages
// project site: BASE_PATH=/wodpitstops) or from the root of a custom domain.
const base = (process.env.BASE_PATH ?? '') as '' | `/${string}`;

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: undefined,
				strict: true
			}),
			paths: { base },
			// One page, small stylesheet: inline it so first paint needs no extra CSS request.
			inlineStyleThreshold: 60_000
		})
	]
});
