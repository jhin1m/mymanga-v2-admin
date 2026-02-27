import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideAlain, vi_VN as delonViVN } from '@delon/theme';
import {
  MailOutline,
  LockOutline,
  DashboardOutline,
  UserOutline,
  BookOutline,
  TeamOutline,
  FileOutline,
  TagsOutline,
  TrophyOutline,
  HistoryOutline,
  MessageOutline,
  NotificationOutline,
  MenuFoldOutline,
  MenuUnfoldOutline,
  GlobalOutline,
  LogoutOutline,
  SettingOutline,
  DownOutline,
  SearchOutline,
  StopOutline,
  DeleteOutline,
  RedoOutline,
  SaveOutline,
  ArrowLeftOutline,
  PlusOutline,
  EditOutline,
  CheckOutline,
  CloseOutline,
  UploadOutline,
  ExclamationCircleOutline,
  SmileOutline,
  WarningOutline,
  ClockCircleOutline,
  RiseOutline,
  PictureOutline,
  HolderOutline,
  FundProjectionScreenOutline,
  CloudDownloadOutline,
  BugOutline,
  ApiOutline,
} from '@ant-design/icons-angular/icons';
import vi from '@angular/common/locales/vi';
import { HashLocationStrategy, LocationStrategy, registerLocaleData } from '@angular/common';
import { vi_VN } from 'ng-zorro-antd/i18n';

import { NGX_EDITOR_CONFIG_TOKEN } from 'ngx-editor';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { StartupService } from './core/startup/startup.service';

// Register Vietnamese locale for number/date formatting
registerLocaleData(vi);

const icons = [
  MailOutline,
  LockOutline,
  DashboardOutline,
  UserOutline,
  BookOutline,
  TeamOutline,
  FileOutline,
  TagsOutline,
  TrophyOutline,
  HistoryOutline,
  MessageOutline,
  NotificationOutline,
  MenuFoldOutline,
  MenuUnfoldOutline,
  GlobalOutline,
  LogoutOutline,
  SettingOutline,
  DownOutline,
  SearchOutline,
  StopOutline,
  DeleteOutline,
  RedoOutline,
  SaveOutline,
  ArrowLeftOutline,
  PlusOutline,
  EditOutline,
  CheckOutline,
  CloseOutline,
  UploadOutline,
  ExclamationCircleOutline,
  SmileOutline,
  WarningOutline,
  ClockCircleOutline,
  RiseOutline,
  PictureOutline,
  HolderOutline,
  FundProjectionScreenOutline,
  CloudDownloadOutline,
  BugOutline,
  ApiOutline,
];

// Factory function for APP_INITIALIZER
function initializeApp(startupService: StartupService) {
  return () => startupService.load();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    provideAlain({
      icons,
      defaultLang: {
        abbr: 'vi',
        ng: vi,
        zorro: vi_VN,
        date: undefined,
        delon: delonViVN,
      },
    }),
    // Hash routing: URL dạng /admincp/#/manga/edit/id
    // Server luôn trả index.html, Angular tự xử lý phần sau #
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    { provide: NGX_EDITOR_CONFIG_TOKEN, useValue: {} },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [StartupService],
      multi: true,
    },
  ],
};
