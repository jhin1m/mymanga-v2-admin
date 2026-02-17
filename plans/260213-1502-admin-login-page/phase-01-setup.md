# Phase 1: Project Setup & Dependencies

## Context Links
- [plan.md](./plan.md)
- [package.json](/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/package.json)
- [angular.json](/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/angular.json)
- [src/styles.less](/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/styles.less)
- [src/app/app.config.ts](/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/app.config.ts)

## Overview

Install ng-zorro-antd runtime packages, create environment config files, and wire up HttpClient + animations providers. This unblocks all subsequent phases.

## Key Insights

- ng-alain is devDep only (schematics); need ng-zorro-antd as runtime dep
- Angular 21 uses `@angular/build:application` builder -- environment fileReplacements go under `build.configurations.production`
- No `@angular/animations` in deps yet; ng-zorro requires it
- `provideHttpClient(withInterceptorsFromDi())` or `withInterceptors([...])` needed

## Requirements

1. ng-zorro-antd installed and importable
2. Environment files created with `apiUrl` variable
3. HttpClient available via DI
4. Animations provider registered (ng-zorro needs it)
5. ng-zorro base CSS imported in styles.less

## Architecture

```
app.config.ts
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),   // Phase 2 adds interceptor
    provideAnimationsAsync(),
    provideBrowserGlobalErrorListeners(),
  ]
```

## Related Code Files

| File | Action |
|------|--------|
| package.json | Add deps: ng-zorro-antd, @angular/animations, @ant-design/icons-angular |
| angular.json | Add fileReplacements for production config |
| src/environments/environment.ts | Create: `{ apiUrl: 'http://127.0.0.1:8000' }` |
| src/environments/environment.prod.ts | Create: `{ apiUrl: 'https://mymanga.vn' }` |
| src/app/app.config.ts | Add provideHttpClient, provideAnimationsAsync |
| src/styles.less | Import ng-zorro-antd/ng-zorro-antd.less or ng-zorro-antd.min.css |

## Implementation Steps

### Step 1: Install packages
```bash
npm install ng-zorro-antd @ant-design/icons-angular @angular/animations
```
Verify versions compatible with Angular 21.

### Step 2: Create environment files

**src/environments/environment.ts**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:8000',
};
```

**src/environments/environment.prod.ts**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://mymanga.vn',
};
```

### Step 3: Configure fileReplacements in angular.json

In `projects.my-project.architect.build.configurations.production`, add:
```json
"fileReplacements": [
  {
    "replace": "src/environments/environment.ts",
    "with": "src/environments/environment.prod.ts"
  }
]
```

### Step 4: Update app.config.ts

```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([])),  // interceptor added in Phase 2
    provideAnimationsAsync(),
  ]
};
```

### Step 5: Import ng-zorro styles in styles.less

```less
@import 'ng-zorro-antd/ng-zorro-antd.less';
```

Or use CSS import if LESS theme customization not needed:
```less
@import 'ng-zorro-antd/ng-zorro-antd.min.css';
```

Prefer `.less` import for future theme variable overrides.

## Todo

- [ ] Install ng-zorro-antd, @ant-design/icons-angular, @angular/animations
- [ ] Create src/environments/environment.ts
- [ ] Create src/environments/environment.prod.ts
- [ ] Add fileReplacements to angular.json production config
- [ ] Update app.config.ts with HttpClient + animations providers
- [ ] Import ng-zorro styles in styles.less
- [ ] Verify `npm start` compiles without errors

## Success Criteria

- `npm start` runs without errors
- ng-zorro components importable in standalone components
- `environment.apiUrl` resolves correctly per build config

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| ng-zorro-antd version incompatible with Angular 21 | High | Check npm for Angular 21 peer dep support; fallback to latest compatible |
| LESS import path resolution | Low | Use `~` prefix or node_modules relative path if needed |

## Security Considerations

- Environment files should NOT contain secrets (only API base URLs)
- environment.prod.ts will be committed; confirm no sensitive data

## Next Steps

Proceed to [Phase 2: Auth Infrastructure](./phase-02-auth-infrastructure.md)
