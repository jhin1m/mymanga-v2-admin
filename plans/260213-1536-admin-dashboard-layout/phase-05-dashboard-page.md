# Phase 05: Dashboard Statistics Page

## Context

- [plan.md](./plan.md) | Phase 5 of 5
- Depends on: Phase 01-04
- Current dashboard: simple "Welcome" text + logout button

## Overview

Rebuild dashboard page with page header "Thong tin chung" and 4 statistics cards in responsive grid using nz-row/nz-col and nz-statistic.

## Key Insights

- nz-statistic provides formatted number display with title
- nz-row/nz-col handles responsive grid (xs=24, sm=12, lg=6 for 4-column)
- Dark styling via custom CSS on nz-card and nz-statistic elements
- Remove old logout button (moved to header in Phase 04)

## Requirements

- Page header: "Thong tin chung" (General Information)
- 4 stat cards in responsive grid:
  1. "Thanh vien" (Members): 49,724
  2. "Tap truyen" (Series): 49,724
  3. "Chuong truyen" (Chapters): 187,517
  4. "Ban dong hanh" (Partners): 321
- Cards: bg #171717, border #2a2a2a, border-radius 8px
- Stat title: #9ca3af, 14px
- Stat value: #ffffff, 32px, bold
- Responsive: 1 col mobile, 2 col tablet, 4 col desktop

## Architecture

Modify existing files only:

```
src/app/pages/dashboard/
  dashboard.ts              # MODIFY - update component
  dashboard.html            # MODIFY - rebuild template
  dashboard.less            # MODIFY - dark stat styles
```

## Related Files

- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/dashboard/dashboard.ts`
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/dashboard/dashboard.html`
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/dashboard/dashboard.less`

## Implementation Steps

### Step 1: Update `src/app/pages/dashboard/dashboard.ts`

```typescript
import { Component, signal } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzIconModule } from 'ng-zorro-antd/icon';

interface StatCard {
  title: string;
  value: number;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NzCardModule, NzGridModule, NzStatisticModule, NzIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.less',
})
export class DashboardComponent {
  protected readonly stats = signal<StatCard[]>([
    { title: 'Thành viên', value: 49724, icon: 'user' },
    { title: 'Tập truyện', value: 49724, icon: 'book' },
    { title: 'Chương truyện', value: 187517, icon: 'file' },
    { title: 'Bản đồng hành', value: 321, icon: 'team' },
  ]);
}
```

### Step 2: Update `src/app/pages/dashboard/dashboard.html`

```html
<div class="page-header">
  <h2>Thông tin chung</h2>
</div>

<div nz-row [nzGutter]="[16, 16]">
  @for (stat of stats(); track stat.title) {
    <div nz-col [nzXs]="24" [nzSm]="12" [nzLg]="6">
      <nz-card class="stat-card" [nzBordered]="true">
        <div class="stat-card-content">
          <div class="stat-icon">
            <span nz-icon [nzType]="stat.icon" nzTheme="outline"></span>
          </div>
          <nz-statistic
            [nzValue]="stat.value"
            [nzTitle]="stat.title"
            [nzValueStyle]="{ color: '#ffffff', 'font-size': '32px', 'font-weight': 'bold' }"
          />
        </div>
      </nz-card>
    </div>
  }
</div>
```

### Step 3: Update `src/app/pages/dashboard/dashboard.less`

```less
:host {
  display: block;
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;

  h2 {
    color: #ffffff;
    font-size: 20px;
    font-weight: 600;
    margin: 0;
  }
}

.stat-card {
  background: #171717;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  transition: border-color 0.2s;

  &:hover {
    border-color: #3a3a3a;
  }

  ::ng-deep {
    .ant-card-body {
      padding: 20px 24px;
    }

    .ant-statistic-title {
      color: #9ca3af;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .ant-statistic-content {
      color: #ffffff;
    }
  }
}

.stat-card-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
  font-size: 22px;
  flex-shrink: 0;
}
```

## Todo

- [ ] Update `dashboard.ts` - new imports, stat data signal
- [ ] Update `dashboard.html` - page header + responsive stat grid
- [ ] Update `dashboard.less` - dark card styles
- [ ] Remove old AuthService inject and logout method (handled by layout now)
- [ ] Verify responsive grid: 1/2/4 columns at breakpoints
- [ ] Verify stat numbers render with thousand separators

## Success Criteria

- Dashboard shows "Thong tin chung" header
- 4 stat cards with icons, values, and titles
- Cards have dark background (#171717) with border (#2a2a2a)
- Grid is responsive: 4 cols desktop, 2 cols tablet, 1 col mobile
- nz-statistic formats numbers with commas

## Risk Assessment

- **Low**: nz-statistic may not auto-format numbers with commas in locale - add `nzValueStyle` or pipe if needed
- **Low**: `@for` syntax requires Angular 17+ - confirmed Angular 21, no issue
