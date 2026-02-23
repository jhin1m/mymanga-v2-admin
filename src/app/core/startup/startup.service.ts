import { Injectable, inject } from '@angular/core';
import { MenuService, SettingsService } from '@delon/theme';

/**
 * App initialization service.
 * Configures sidebar menu items and app settings on startup.
 */
@Injectable({ providedIn: 'root' })
export class StartupService {
  private readonly menuService = inject(MenuService);
  private readonly settingsService = inject(SettingsService);

  load(): Promise<void> {
    return Promise.resolve().then(() => {
      this.initAppSettings();
      this.initMenuItems();
    });
  }

  private initAppSettings(): void {
    this.settingsService.setApp({
      name: 'MyManga AdminCP',
      description: 'Quản lý hệ thống MyManga',
    });

    this.settingsService.setUser({
      name: 'Admin',
      avatar: '',
    });
  }

  private initMenuItems(): void {
    this.menuService.add([
      {
        group: true,
        text: 'MENU CHÍNH',
        children: [
          {
            text: 'Tổng quan',
            link: '/dashboard',
            icon: { type: 'icon', value: 'dashboard' },
          },
          {
            text: 'Thành viên',
            link: '/members',
            icon: { type: 'icon', value: 'user' },
          },
          {
            text: 'Manga',
            link: '/manga',
            icon: { type: 'icon', value: 'book' },
            children: [
              { text: 'Danh sách', link: '/manga/list' },
              { text: 'Thêm mới', link: '/manga/create' },
            ],
          },
          {
            text: 'Artist',
            link: '/artists',
            icon: { type: 'icon', value: 'team' },
          },
          {
            text: 'Doujinshi',
            link: '/doujinshi',
            icon: { type: 'icon', value: 'file' },
          },
          {
            text: 'Thể loại',
            link: '/genres',
            icon: { type: 'icon', value: 'tags' },
          },
        ],
      },
      {
        group: true,
        text: 'CỘNG ĐỒNG',
        children: [
          {
            text: 'Nhóm dịch',
            link: '/groups',
            icon: { type: 'icon', value: 'team' },
          },
          {
            text: 'Danh hiệu',
            link: '/badges',
            icon: { type: 'icon', value: 'trophy' },
          },
          {
            text: 'Bạn đồng hành',
            link: '/pets',
            icon: { type: 'icon', value: 'smile' },
          },
        ],
      },
      {
        group: true,
        text: 'HỆ THỐNG',
        children: [
          {
            text: 'Bình luận',
            link: '/comments',
            icon: { type: 'icon', value: 'message' },
          },
          {
            text: 'Báo cáo Chapter',
            link: '/chapter-reports',
            icon: { type: 'icon', value: 'warning' },
          },
          {
            text: 'Thông báo',
            link: '/notifications',
            icon: { type: 'icon', value: 'notification' },
          },
        ],
      },
    ]);
  }
}
