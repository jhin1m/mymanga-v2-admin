# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Admin panel for MyManga built with **Angular 21** and **ng-alain** (admin UI framework). Uses standalone components (no NgModules).

## Commands

```bash
npm start          # Dev server at http://localhost:4200
npm run build      # Production build → dist/
npm test           # Unit tests via Vitest
npm run watch      # Dev build with watch mode
```

## Tech Stack

- **Angular 21** with standalone components and signals API
- **ng-alain** for admin layout/components
- **LESS** for component styles (configured in angular.json schematics)
- **Vitest** for unit testing (with jsdom)
- **TypeScript 5.9** with strict mode enabled

## Architecture

- Entry point: `src/main.ts` → bootstraps `App` component with `appConfig`
- App config: `src/app/app.config.ts` — providers (router, etc.)
- Routes: `src/app/app.routes.ts` — lazy-loaded route definitions
- Components use standalone pattern: `imports` array in `@Component` decorator, no NgModules
- Component prefix: `app` (enforced in angular.json)

## Code Conventions

- Prettier configured: 100 char width, single quotes, angular HTML parser
- Components use signal-based state (`signal()`, `computed()`)
- Strict TypeScript: `noImplicitReturns`, `noPropertyAccessFromIndexSignature`, `strictTemplates`
- Style files use `.less` extension
- Test files: `*.spec.ts` (co-located with source)
