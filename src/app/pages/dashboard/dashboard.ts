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
