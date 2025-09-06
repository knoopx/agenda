# AGENTS.md

## Build, Lint, and Test Commands

- **Dev server:** `bun run devel` or `bun run vite`
- **Build:** `bun run build`
- **Lint:** `bun run eslint .` (TypeScript + ESLint)
- **Test all:** `bun vitest` (uses Vitest)
- **Test single file:** `bun vitest src/Agenda/Task/Task.spec.tsx`
- **Test with coverage:** `bun vitest --coverage`
- **Test setup:** See `src/test-setup.ts` (includes JSDOM, jest-dom, cleanup, and mocks)
- **Test runner:** All tests use [Vitest](https://vitest.dev/). Test files must be named `.spec.ts(x)` or `.test.ts(x)`.

## Code Style Guidelines

- **Imports:** Use ES6 imports; auto-imports for icons and hooks are enabled.
- **Formatting:** 2 spaces per indent, trailing commas, single quotes, semicolons.
- **Types:** Use TypeScript everywhere; prefer explicit types and interfaces.
- **Naming:** Use camelCase for variables/functions, PascalCase for components/types.
- **Error Handling:** Use try/catch for plugin transforms; throw formatted errors when possible.
- **React:** Use function components, hooks, and MobX for state. Prefer observer and forwardRef for components.
- **Tests:** Place tests in `.spec.ts(x)` or `.test.ts(x)` files. Use Testing Library and Vitest.
- **Globals:** Icon components (e.g., `IconMdiClockOutline`) are auto-imported and globally available.
- **Config:** Vite config in `vite.config.js`; test config in `test` property.
- **Strictness:** TypeScript is strict; all code must typecheck.
- **CSS:** Use Tailwind for styling; see `index.css` and `tailwind.config.js`.

---
