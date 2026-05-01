# MyNetScore

Offline-first, mobile golf handicap calculator. Log rounds, track your index, and keep your data entirely on-device — no accounts, no cloud, no signal required.

Built with Angular 21, Tailwind CSS 4, and Dexie.js (IndexedDB). Runs as a PWA installable on iOS and Android.

## Quick start

**Prerequisites:** Node.js 22+ and npm.

```bash
npm install
npm start        # opens http://localhost:4200
```

The dev server watches for file changes and reloads automatically.

## Scripts

| Command            | Purpose                     |
| ------------------ | --------------------------- |
| `npm start`        | Dev server                  |
| `npm run build`    | Production build to `dist/` |
| `npm test`         | Unit tests (Vitest)         |
| `npm run lint`     | Lint (ESLint)               |
| `npm run lint:fix` | Auto-fix lint issues        |
| `npm run format`   | Format with Prettier        |

## Docs

- [Product overview](docs/PRODUCT.md) — vision, features, target audience
- [Architecture](docs/ARCHITECTURE.md) — tech stack, data model, WHS engine
- [Contributing](docs/CONTRIBUTING.md) — coding standards and testing strategy (internal only; external contributions are not accepted)
