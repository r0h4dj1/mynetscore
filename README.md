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

| Command            | Purpose                       |
| ------------------ | ----------------------------- |
| `npm start`        | Dev server                    |
| `npm run build`    | Production build to `dist/`   |
| `npm test`         | Unit tests (Vitest)           |
| `npm run e2e`      | E2E tests, headless (Cypress) |
| `npm run e2e:open` | E2E tests, interactive runner |
| `npm run lint`     | Lint (ESLint)                 |
| `npm run lint:fix` | Auto-fix lint issues          |
| `npm run format`   | Format with Prettier          |

## Running E2E tests

The Cypress suite drives the real app against the live IndexedDB layer (no mocks).
`npm run e2e` (and `npm run e2e:open`) use `start-server-and-test` to boot the dev
server, wait for `http://localhost:4200`, run the specs, then shut the server down —
so you do **not** need a separate `npm start` running.

The specs seed, reset, and read the database through a `window.__APP_DB__` bridge that
`src/main.ts` exposes only when `isDevMode()` is true. It is never included in
production builds, so E2E tests must run against the dev server (the default above).

## Docs

- [Product overview](docs/PRODUCT.md) — vision, features, target audience
- [Architecture](docs/ARCHITECTURE.md) — tech stack, data model, WHS engine
- [Contributing](docs/CONTRIBUTING.md) — coding standards and testing strategy (internal only; external contributions are not accepted)
