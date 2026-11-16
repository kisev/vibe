/**
 * The base path the release site is published at. `vite.config.ts` builds both
 * artifacts on top of it, the production router mounts under it, and the dev
 * preview links back to it, so the literal lives here once rather than in each
 * of them. Kept free of build inputs, since the config reads it before Vite runs.
 */
export const productionBase = '/vibe/'
