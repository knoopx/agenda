# AGENTS.md

## Build, Lint, and Test Commands

- **Dev server:** `bun run devel` or `bun run vite`
- **Typecheck:** `bun tsc --noEmit` (TypeScript typecheck)
- **Lint:** `bun run eslint .` (TypeScript + ESLint)
- **Test all:** `bun vitest` (uses Vitest)
- **Test single file:** `bun vitest src/Agenda/Task/Task.spec.tsx`
- **Test with coverage:** `bun vitest --coverage`
- **Format:** `bun run prettier --write .` (uses Prettier)

## Code Style Guidelines

- **Types:** Use TypeScript everywhere; prefer explicit types and interfaces.
- **React:** Use function components, hooks, and MobX for state. Prefer observer and forwardRef for components.
- **Tests:** Place tests in `.spec.ts(x)` or `.test.ts(x)` files. Use Testing Library and Vitest.
- **Globals:** Icon components (e.g., `IconMdiClockOutline`) are auto-imported and globally available.
- **Config:** Vite config in `vite.config.js`; test config in `test` property.
- **Strictness:** TypeScript is strict; all code must typecheck.
- **CSS:** Use Tailwind for styling; see `index.css` and `tailwind.config.js`.
