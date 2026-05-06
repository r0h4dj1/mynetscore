# GEMINI.md

MyNetScore is a mobile-first golf scoring app. Follow these guidelines when contributing code.

## Principles

- **KISS** — choose the simpler approach over clever abstractions.
- **DRY** — extract repeated logic into reusable functions/services/components.
- **SRP** — one reason to change per component/function/class.

## TypeScript

- No `any`. Ever.
- Define explicit interfaces/types for data structures, API responses, function params, and returns.

## Styling

- Tailwind utility classes only.
- No custom CSS unless unavoidable (e.g., complex animations). Use established brand design tokens.

## UI/UX

- Mobile-first — design for small screens first.
- Large touch targets for outdoor on-the-course usage.

## Testing

- **Unit (Vitest):** ~70% coverage target. Focus on critical business logic and complex state transformations. Skip trivial elements. Test behavior (inputs → outputs), not implementation details.
- **E2E (Cypress):** cover critical user flows (logging a round, exporting data). Avoid mocking — hit the real local DB (SQLite/in-memory) so UI, logic, and DB layers are exercised end-to-end.

## Scripts

- Use `npm test` for all tests and `npm test -- --include <path>` for specific files.
