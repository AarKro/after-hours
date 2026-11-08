# After Hours

Website for **After Hours**, a cocktail bar in Zürich. React + Vite + TypeScript + SCSS, hosted on GitHub Pages.

Live: https://aarkro.github.io/after-hours/

## Development

```sh
npm install
npm run dev       # http://localhost:5173/after-hours/
npm run lint
npm run build     # outputs dist/ (incl. 404.html for deep links)
npm run preview
```

## Deploy

```sh
npm run deploy
```

This builds the site and pushes `dist/` to the `gh-pages` branch. In the GitHub repo, go to **Settings → Pages** and set the source to _Deploy from a branch → `gh-pages` / root_ (one-time).

See [CLAUDE.md](./CLAUDE.md) for architecture, design tokens and conventions.
