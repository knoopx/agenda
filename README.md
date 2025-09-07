# Agenda

A fast, modern agenda and task management app built with TypeScript, React, MobX, Bun, Vite, Tailwind CSS, and Vitest. Designed for speed, simplicity, and developer productivity.

## Features

- Automatic agenda and calendar views (day, week, month)
- Task management with completion tracking and history
- Recurring tasks with advanced rules (natural language, rrule-like)
- Date, time, duration, and distance labels
- Tag and context completion popovers
- Grouping, sorting, and filtering tasks
- Emoji/tag support for tasks
- URL detection and clickable links in tasks
- Expression grammar for natural language input (PEG.js-based)
- Fast keyboard navigation and shortcuts for all major actions
- Color labels and priority indicators
- Cloud sync via WebDAV integration
- Responsive UI for mobile and touch devices

## Usage

- **Keyboard Shortcuts:**
  - `Enter` to add/complete/edit tasks
  - `Esc` to cancel/close dialogs
  - Arrow keys to navigate tasks

- **Natural Language Input:**
  - Add tasks like: `Review PR tomorrow at 10am #work`
  - Supports dates, times, durations, recurrence (e.g., `every Monday`), tags, and URLs.

- **Emoji & Tags:**
  - Use hashtags (`#work`, `#home`) to auto-assign emoji and color labels.
  - Emoji are auto-picked from keywords.

- **Editing:**
  - Click or use keyboard to edit tasks inline.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+)

### Installation

```sh
bun install
```

### Development

Start the dev server:

```sh
bun run devel
# or
bun run vite
```

### Type Checking

```sh
bun tsc --noEmit
```

### Linting

```sh
bun run eslint .
```

### Formatting

```sh
bun run prettier --write .
```

### Testing

Run all tests:

```sh
bun vitest
```

Run a single test file:

```sh
bun vitest src/Agenda/Task/Task.spec.tsx
```

Test with coverage:

```sh
bun vitest --coverage
```

## Contributing & Support

- Pull requests and issues are welcome!
- For help, open an issue or discussion on GitHub.

## License

See [LICENSE](LICENSE) for details.

> Built with ❤️ using Bun, Vite, MobX, Tailwind, and Vitest.
