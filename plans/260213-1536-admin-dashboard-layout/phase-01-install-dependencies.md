# Phase 01: Install @delon/* Dependencies

## Context

- [plan.md](./plan.md) | Phase 1 of 5
- Current: ng-alain v21.0.4 (devDependency, CLI only)
- Missing: all @delon/* runtime packages

## Overview

Install @delon/theme, @delon/abc, @delon/util as production dependencies. These provide layout components, sidebar-nav, page-header, MenuService, and utilities needed for the admin shell.

## Key Insights

- ng-alain v21.0.4 targets Angular 21 + NG-ZORRO 21 - @delon packages must match v21.x
- @delon/theme provides: `LayoutDefaultComponent`, `LayoutDefaultHeaderItemComponent`, `LayoutDefaultNavComponent`, `MenuService`, `SettingsService`, `provideAlain()`
- @delon/abc provides: `SidebarNavComponent`, `PageHeaderComponent`
- @delon/util provides: utility functions used internally by theme/abc

## Requirements

- Install compatible versions of @delon/theme, @delon/abc, @delon/util
- Verify no peer dependency conflicts
- Ensure `npm start` still compiles

## Architecture

No architectural changes. Adds runtime dependencies.

## Related Files

- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/package.json`

## Implementation Steps

### Step 1: Install @delon packages

```bash
npm install @delon/theme@^21 @delon/abc@^21 @delon/util@^21
```

### Step 2: Verify installation

```bash
npm ls @delon/theme @delon/abc @delon/util
```

### Step 3: Verify build compiles

```bash
npm start
# Confirm no import errors, dev server starts
```

## Todo

- [ ] Run `npm install @delon/theme@^21 @delon/abc@^21 @delon/util@^21`
- [ ] Verify no peer dependency warnings
- [ ] Confirm `npm start` compiles without errors

## Success Criteria

- `@delon/theme`, `@delon/abc`, `@delon/util` listed in `package.json` dependencies
- `npm start` compiles successfully

## Risk Assessment

- **Low**: Version mismatch - mitigate by pinning to ^21 which aligns with ng-alain v21.0.4
- **Low**: Possible additional peer deps (e.g., @delon/acl) - install if npm warns about them
