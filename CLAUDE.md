# After Hours

Static marketing site for **After Hours**, a cocktail bar in Zürich. React + Vite + TypeScript + SCSS, deployed to GitHub Pages.

- Design source: Figma file `l6YPyYo81hDDdRKCbOwLtp` ("After-Hours"). Pages: `design system` (tokens + components), `desktop`, `mobile`.
- Repo: `github.com/AarKro/after-hours`. Live: `https://aarkro.github.io/after-hours/`.

## Commands

```sh
npm run dev       # local dev server
npm run build     # type-check + production build into dist/ (also writes dist/404.html)
npm run preview   # serve the production build
npm run lint      # ESLint
npm run format    # Prettier (write)
npm run deploy    # build + publish dist/ to the gh-pages branch
```

## Architecture

```
src/
  main.tsx, App.tsx       # router setup (BrowserRouter, basename = import.meta.env.BASE_URL)
  routes.ts               # route path helpers — never hard-code paths in components
  data/                   # static content (drinks, opening hours, contact details)
  pages/                  # one folder per route: Home, Recipes, Recipe, Contact, NotFound
  components/             # reusable UI, one folder per component: Component.tsx + Component.module.scss
  hooks/                  # shared hooks (useInView, usePrefersReducedMotion, …)
  assets/animations/      # After Effects → SVG (SMIL) animations, imported with ?raw
  assets/icons/           # static UI icons exported from Figma
  styles/                 # design tokens + global styles (see below)
```

### Styling rules

- **No magic numbers.** Every color, spacing, radius, size, font value, breakpoint, duration and z-index comes from a token in `src/styles/tokens/`. If a value is missing, add a named token; don't inline it.
- Tokens mirror the Figma variables 1:1 (`surface/raised` → `$surface-raised`, spacing `xs/s/m/l/xl`, radius `m/l/full`, type roles `display/h1/h2/h3/body-l/body-m/caption`).
- Figma has two modes, **mobile** and **desktop**. Responsive values are emitted as CSS custom properties that switch at the breakpoint (see `styles/_theme.scss`), so components use one property, e.g. `var(--space-section)`, `var(--font-size-h2)`.
- Component styles are CSS Modules (`*.module.scss`) and `@use 'styles/abstracts' as *;` for tokens and mixins.
- Mobile-first: write base styles for mobile, then `@include bp(desktop) { … }`.
- Accessibility overrides of the design: error text uses `$feedback-error-text` (a tint of `feedback/error`), because the raw token is ~2:1 on `surface/default`. Borders keep the raw token.

### Animated illustrations

The SVGs in `src/assets/animations/` are SMIL animations exported with better-lottie. All of them play once and freeze, except `bar-loop`, which repeats.

- Render them through `<AnimatedSvg>`. It inlines the markup, gives every instance unique IDs (gradients/clipPaths would otherwise collide) and controls the SVG timeline (`pauseAnimations` / `setCurrentTime` / `unpauseAnimations`).
- Durations are read from the SVG itself (max `begin + dur`), never hard-coded.
- **Trigger:** play once when scrolled into view.
- The drink illustrations (`rocks-glass`, `orange`, `shaker`) only animate as the large illustration on the recipe page. Everywhere else (cocktail cards) they render as a still of the final frame (`<Illustration>` without `animated`).
- The hero bar scene plays `bar-intro`, then swaps to the looping `bar-loop`.
- `prefers-reduced-motion`: jump straight to the final frame (bar shows the static first frame of the loop).
- `button.svg` is the animated "reserve a table" button. **Desktop only**, and it plays on hover/focus. On mobile, use the regular `<Button>`.

| Illustration                     | Used for                     |
| -------------------------------- | ---------------------------- |
| `logo.svg`                       | header + footer logo         |
| `bar-intro.svg` → `bar-loop.svg` | home hero                    |
| `rocks-glass.svg`                | Old Fashioned, Negroni       |
| `orange.svg`                     | Amaretto Sour, Aperol Spritz |
| `shaker.svg`                     | Espresso Martini             |

### Routing / GitHub Pages

- Vite `base` is `/after-hours/`. Router `basename` comes from `import.meta.env.BASE_URL`.
- Deep links work because the build copies `index.html` to `404.html` (GitHub Pages serves it for unknown paths and the SPA takes over).
- Routes: `/`, `/recipes`, `/recipes/:slug`, `/contact`, and a catch-all 404. Pages are lazy-loaded per route (the inline SVGs are the bulk of the JS).
- The nav says **Recipes** (Figma: "Recipe") because it links to the recipes index, not a single recipe.
- "reserve a table" CTAs link to `/contact?intent=reservation`, which prefills the message.

### Contact form

- Fields: first name, last name, e-mail, message (all required). Client-side validation runs on blur and on submit, and re-validates live after the first submit. Focus moves to the first invalid field on submit.
- First + last name sit side by side from the tablet breakpoint (stacked in Figma). The salutation and birthdate fields from Figma were dropped on purpose.
- **Submission is simulated** (no backend yet). The submit handler lives in `src/pages/Contact/submitContactForm.ts`. Swap in a real service (e.g. Web3Forms/Formspree) there.

## Presentation

`presentation/` holds the course presentation and deliverables (separate package, not part of the site build). See `presentation/README.md`. The deck is German (`src/slides.de.html`) and uses the site's look. The bar scene was animated with AI (Claude Code driving Illustrator + After Effects); only the bar slides carry the "mit KI" tag.

## Conventions

- TypeScript strict. Function components, named exports for components.
- Content lives in `src/data/`, not in JSX.
- Accessibility: semantic landmarks, visible focus (`border/focus` accent), labelled controls, `aria-invalid` + `aria-describedby` on errors, decorative SVGs `aria-hidden`.
- Commit in small logical steps. Commit messages are imperative and in sentence case.
