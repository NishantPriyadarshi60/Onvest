# Testing

## Unit tests (Vitest)

```bash
npm run test        # watch mode
npm run test:run    # single run
npm run test:coverage
```

Tests live in `src/**/*.test.ts` and `src/**/*.test.tsx`.

## E2E tests (Playwright)

First install browsers (once):

```bash
npx playwright install
```

Then run:

```bash
npm run test:e2e
```

E2E tests live in `e2e/`. The dev server is started automatically when running E2E tests.
