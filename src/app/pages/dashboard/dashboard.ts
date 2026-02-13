import { Component, inject } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [NzButtonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.less',
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);

  protected onLogout(): void {
    this.authService.logout();
  }
}
