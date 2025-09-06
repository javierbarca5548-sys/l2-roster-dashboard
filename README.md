# Lineage 2 — Roster & Epics Planner

A ready-to-deploy Vite + React app. Tailwind is loaded via the Play CDN (no build step for Tailwind). Charts powered by Recharts.

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:5173

## Build (for Netlify / GitHub Pages)
```bash
npm run build
```
This creates a `dist/` folder to deploy.

## Deploy
- **Vercel**: Import the repo, framework = Vite. No extra settings.
- **Netlify**: Build command: `npm run build`  • Publish dir: `dist`
- **GitHub Pages**: Serve the `dist/` folder via any static hosting method or use an action to deploy `dist/`.
