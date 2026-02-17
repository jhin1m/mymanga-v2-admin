# Phase 02: Dark Theme Setup

## Context

- [plan.md](./plan.md) | Phase 2 of 5
- Depends on: Phase 01 (dependencies installed)
- Current `styles.less` only has: `@import 'ng-zorro-antd/ng-zorro-antd.less';`

## Overview

Create dark theme LESS variables file and restructure `styles.less` to import theme variables BEFORE ng-zorro, then add global dark overrides for body, scrollbar, and common elements.

## Key Insights

- ng-zorro uses LESS variables that can be overridden before import
- @delon/theme also exposes LESS variables for layout customization
- Import order matters: theme vars -> delon theme -> ng-zorro -> custom overrides

## Requirements

- Dark color palette: black backgrounds, white text, blue accent
- Sidebar: #0a0a0a background
- Header: #000000 background
- Cards/components: #171717 background
- Primary color: #2563eb (Tailwind blue-600)

## Architecture

```
src/
  styles/
    theme.less          # LESS variable overrides (NEW)
  styles.less           # Main entry, imports in correct order (MODIFY)
```

## Related Files

- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/styles.less`
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/angular.json` (styles array references styles.less)

## Implementation Steps

### Step 1: Create `src/styles/theme.less`

```less
// === Dark Theme Variable Overrides ===
// Import BEFORE ng-zorro to override default Ant Design variables

// Primary
@primary-color: #2563eb;

// Layout
@layout-header-background: #000000;
@layout-sider-background: #0a0a0a;
@layout-body-background: #000000;
@layout-trigger-background: #141414;

// Component backgrounds
@component-background: #171717;
@body-background: #000000;
@popover-background: #171717;

// Text
@text-color: #ffffff;
@text-color-secondary: #9ca3af;
@heading-color: #ffffff;

// Borders
@border-color-base: #2a2a2a;
@border-color-split: #2a2a2a;

// Menu (sidebar)
@menu-bg: #0a0a0a;
@menu-item-color: #9ca3af;
@menu-item-active-bg: rgba(37, 99, 235, 0.1);
@menu-highlight-color: #2563eb;
@menu-dark-bg: #0a0a0a;
@menu-dark-item-active-bg: rgba(37, 99, 235, 0.1);
@menu-dark-color: #9ca3af;
@menu-dark-highlight-color: #ffffff;
@menu-dark-selected-item-text-color: #ffffff;

// Card
@card-background: #171717;
@card-head-color: #ffffff;

// Table
@table-bg: #171717;
@table-header-bg: #1f1f1f;
@table-header-color: #9ca3af;
@table-row-hover-bg: #1f1f1f;

// Input
@input-bg: #1f1f1f;
@input-border-color: #2a2a2a;
@input-color: #ffffff;
@input-placeholder-color: #6b7280;
```

### Step 2: Update `src/styles.less`

```less
// 1. Theme variable overrides (MUST be before ng-zorro import)
@import './styles/theme.less';

// 2. Delon theme (layout styles)
@import '@delon/theme/layout-default/style';
@import '@delon/theme/style/index';

// 3. NG-ZORRO base styles
@import 'ng-zorro-antd/ng-zorro-antd.less';

// 4. Global dark overrides
html, body {
  background: @body-background;
  color: @text-color;
}

// Scrollbar
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #0a0a0a;
}

::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

// Delon layout overrides
.alain-default {
  &__header {
    box-shadow: 0 1px 0 #2a2a2a;
  }

  &__aside {
    border-right: 1px solid #2a2a2a;
  }
}
```

### Step 3: Create `src/styles/` directory

The `src/styles/` directory needs to be created before adding `theme.less`.

## Todo

- [ ] Create `src/styles/` directory
- [ ] Create `src/styles/theme.less` with all dark variable overrides
- [ ] Update `src/styles.less` with correct import order and global overrides
- [ ] Verify `npm start` compiles - check for LESS variable resolution errors
- [ ] Visual check: body background should be black

## Success Criteria

- No LESS compilation errors
- Body background renders as #000000
- ng-zorro components pick up dark variables

## Risk Assessment

- **Medium**: Some @delon LESS imports may not exist or path may differ in v21 - check actual package contents if import fails
- **Low**: LESS variable names may differ between ng-zorro versions - verify against ng-zorro v21 docs if colors don't apply
