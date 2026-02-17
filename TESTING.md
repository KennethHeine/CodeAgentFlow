# Testing Guidelines

> Conventions and best practices for writing tests in the CodeAgentFlow project.

## Overview

| Category | Framework | Location | Command |
|---|---|---|---|
| Unit tests | Vitest + React Testing Library | `src/**/*.test.{ts,tsx}` | `npm test` |
| E2E tests | Playwright | `e2e/*.spec.ts` | `npm run build && npm run test:e2e` |

## Quick Commands

```bash
npm test              # Run all unit tests once
npm run test:watch    # Run unit tests in watch mode
npm run build && npm run test:e2e  # Run E2E tests (requires build)
```

## File Naming & Location

- **Co-locate tests** with the code they test: place `Foo.test.tsx` next to `Foo.tsx`.
- Use `.test.ts` for pure logic, `.test.tsx` for components.
- E2E tests live in `e2e/` and use `.spec.ts`.

```
src/
├── utils/
│   ├── slugify.ts
│   └── slugify.test.ts      ← unit test next to source
├── components/
│   └── auth/
│       ├── PatModal.tsx
│       └── PatModal.test.tsx ← component test next to source
├── test/
│   ├── setup.ts              ← global test setup
│   └── fixtures.ts           ← shared factories/fixtures
e2e/
└── app.spec.ts               ← E2E tests
```

## Writing Unit Tests

### Structure: Arrange–Act–Assert

Use the AAA pattern for clarity:

```ts
it('returns null for expired items', () => {
  // Arrange
  vi.useFakeTimers();
  setStorageItem('key', 'value', 1);

  // Act
  vi.advanceTimersByTime(2);
  const result = getStorageItem('key');

  // Assert
  expect(result).toBeNull();
});
```

### Use `describe` blocks to group related tests

Group by function, component, or behavior:

```ts
describe('slugify', () => {
  it('converts spaces to hyphens', () => { ... });
  it('handles empty string', () => { ... });
});
```

### Naming conventions

- Test names should describe the **behavior**, not the implementation:
  - ✅ `'returns null for expired items'`
  - ❌ `'calls localStorage.removeItem when timestamp exceeds Date.now()'`

## Shared Fixtures

Use the factory functions in `src/test/fixtures.ts` to create test data:

```ts
import { createTask, createEpic, createTaskDraft } from '../../test/fixtures';

const task = createTask({ title: 'My Task', status: 'done' });
const epic = createEpic({ tasks: [task] });
```

Available factories:
- `createSubtask(overrides?)` — creates a mock `Subtask`
- `createTask(overrides?)` — creates a mock `Task`
- `createEpic(overrides?)` — creates a mock `Epic`
- `createSubtaskDraft(overrides?)` — creates a mock `SubtaskDraft`
- `createTaskDraft(overrides?)` — creates a mock `TaskDraft`
- `createEpicCreationState(overrides?)` — creates a mock `EpicCreationState`

**Rules:**
- Add new factories when you find yourself repeating object literals across tests.
- Factories should provide sensible defaults — override only what matters for the test.
- Don't over-abstract: if a test has unique data, inline it.

## Component Tests

Use React Testing Library for component tests:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('calls onSubmit with value', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(<MyComponent onSubmit={onSubmit} />);

  await user.type(screen.getByTestId('input'), 'hello');
  await user.click(screen.getByTestId('submit'));

  expect(onSubmit).toHaveBeenCalledWith('hello');
});
```

**Prefer:**
- `getByTestId` / `getByText` / `getByRole` over implementation details
- `userEvent` over `fireEvent` for realistic user interactions
- Testing behavior (what the user sees and does) over internal state

## Timers & Async

- **Never use real `setTimeout`** in tests — use `vi.useFakeTimers()` and `vi.advanceTimersByTime()`.
- Always call `vi.useRealTimers()` in `afterEach` when using fake timers.
- For async operations, `await` the result or use `waitFor()`.

```ts
afterEach(() => {
  vi.useRealTimers();
});

it('expires after TTL', () => {
  vi.useFakeTimers();
  setItem('key', 'value', 100);
  vi.advanceTimersByTime(101);
  expect(getItem('key')).toBeNull();
});
```

## Isolation

- Each test file runs in its own jsdom environment.
- Clean up shared state (like `localStorage`) in `beforeEach`/`afterEach`.
- Don't rely on test execution order.
- Module-level singletons (e.g., the Octokit client in `github.ts`) persist across tests in the same file — be mindful of initialization side effects.

## What to Test

### High value (always test)
- Utility functions (pure logic, edge cases, boundary conditions)
- Component rendering states (loading, error, empty, populated)
- User interactions (clicks, form submissions, keyboard shortcuts)
- Business logic (status derivation, markdown generation/parsing)

### Medium value (test when practical)
- Component prop variations
- Error handling paths
- Accessibility attributes

### Low value (skip unless critical)
- CSS class names and styling
- Third-party library internals
- Implementation details that could change freely

## When to Skip Tests

- Pure CSS-only changes
- Documentation-only changes
- Config file updates validated by build/lint
