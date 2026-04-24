# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Finance Suites is an npm workspaces monorepo for financial calculators, designed for multi-platform deployment (web + WeChat mini program).

```
finance-suites/
├── packages/
│   ├── shared/        # Framework-agnostic calculation logic (library)
│   ├── web/           # Next.js 15 web app
│   └── miniprogram/   # Taro mini program (planned, empty)
```

## Commands

Run from the repository root:

```bash
# Development
npm run dev:web          # Start Next.js dev server (turbopack)

# Build
npm run build:web        # Build Next.js app

# Testing
npm run test             # Run vitest for shared package
npm run test:watch       # Run vitest in watch mode

# Quality
npm run lint             # ESLint with --fix on all .ts/.tsx
npm run type-check       # TypeScript strict check (tsc --noEmit)
```

Run a single test file:
```bash
cd packages/shared && npx vitest run __tests__/trading-cost.test.ts
```

Build/watch the shared library:
```bash
cd packages/shared && npm run build   # Compile to dist/
cd packages/shared && npm run dev     # Watch mode
```

## Architecture

### Key Design Principle

Business logic lives exclusively in `packages/shared` (pure TypeScript, no framework dependencies). UI packages consume it via the local workspace reference `@finance-suites/shared`.

### Shared Package Structure

```
packages/shared/src/
├── math/              # One file per calculator (pure functions)
├── types/index.ts     # All input/output TypeScript interfaces
├── utils/validation.ts
└── index.ts           # Barrel export
```

After editing shared source, run `npm run build` in `packages/shared` to update `dist/` before the web package picks up changes.

### Calculator Pattern

Every math module follows the same contract:

```typescript
// 1. Validate inputs (throws ValidationError)
validateNumber(value, 'fieldName');

// 2. Compute
// 3. Return ApiResponse<T>
return { success: true, data: result };
// or
return { success: false, error: { code, message, field } };
```

`ApiResponse<T>` is the universal wrapper for all calculation results — check `success` before accessing `data`.

### Web Package

- **Next.js 15 App Router** with turbopack
- Single-page layout in `packages/web/src/app/page.tsx` with tab-based calculator switching
- Calculator components in `packages/web/src/components/calculators/`
- UI primitives from shadcn/ui (Radix-based) in `packages/web/src/components/ui/`
- Forms: `react-hook-form` + Zod schemas; `useEffect` watches inputs for real-time calculation
- Path alias: `@/*` → `packages/web/src/`

### Adding a New Calculator

1. Add types to `packages/shared/src/types/index.ts`
2. Create `packages/shared/src/math/<name>.ts` with the calculation logic
3. Export from `packages/shared/src/index.ts`
4. Run `npm run build` in `packages/shared`
5. Create `packages/web/src/components/calculators/<Name>Calculator.tsx`
6. Add a tab entry in `packages/web/src/app/page.tsx`
7. Add tests in `packages/shared/__tests__/<name>.test.ts`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Shared lib | TypeScript 5, Vitest |
| Web | Next.js 15, React 19, TypeScript 5 |
| Styling | Tailwind CSS v4, shadcn/ui |
| Forms | react-hook-form, Zod v4 |
| Charts | Recharts |

## Currently Implemented Calculators

- **Compound Interest** — future value, principal, rate (forward + reverse)
- **CAGR** — growth rate, target price, time to target
- **Real Estate** — leverage, rent yield, appreciation
- **HK Stock Trading Costs** — commission, stamp duty, exchange/SFC/FRC fees

Planned (skeleton UI exists): Position Management (Kelly Formula), Valuation Tools (PE & DCF).
