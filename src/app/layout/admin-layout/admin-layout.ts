import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  LayoutDefaultComponent,
  LayoutDefaultHeaderItemComponent,
} from '@delon/theme/layout-default';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { LayoutDefaultService } from '@delon/theme/layout-default';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [
    RouterOutlet,
    LayoutDefaultComponent,
    LayoutDefaultHeaderItemComponent,
    NzIconModule,
    NzDropDownModule,
    NzAvatarModule,
    NzMenuModule,
  ],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.less',
})
export class AdminLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly layoutService = inject(LayoutDefaultService);

  protected readonly layoutOptions = {
    logoLink: '/dashboard',
    logoFixWidth: 200,
    showHeaderCollapse: false,
  };

  protected toggleCollapsed(): void {
    this.layoutService.toggleCollapsed();
  }

  protected onLogout(): void {
    this.authService.logout();
  }
}
