import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Login stays outside admin layout
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent),
  },
  // All authenticated routes wrapped in admin layout
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/admin-layout/admin-layout').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'members',
        loadComponent: () => import('./pages/members/members').then((m) => m.MembersComponent),
      },
      {
        path: 'artists',
        loadComponent: () => import('./pages/artists/artists').then((m) => m.ArtistsComponent),
      },
      {
        path: 'doujinshi',
        loadComponent: () =>
          import('./pages/doujinshis/doujinshis').then((m) => m.DoujinshisComponent),
      },
      {
        path: 'genres',
        loadComponent: () => import('./pages/genres/genres').then((m) => m.GenresComponent),
      },
      {
        path: 'groups',
        loadComponent: () => import('./pages/groups/groups').then((m) => m.GroupsComponent),
      },
      {
        path: 'badges',
        loadComponent: () =>
          import('./pages/achievements/achievements').then((m) => m.AchievementsComponent),
      },
      {
        path: 'pets',
        loadComponent: () => import('./pages/pets/pets').then((m) => m.PetsComponent),
      },
      {
        path: 'comments',
        loadComponent: () =>
          import('./pages/comments/comments').then((m) => m.CommentsComponent),
      },
      {
        path: 'chapter-reports',
        loadComponent: () =>
          import('./pages/chapter-reports/chapter-reports').then(
            (m) => m.ChapterReportsComponent
          ),
      },
      {
        path: 'advertisements',
        loadComponent: () =>
          import('./pages/advertisements/advertisements').then(
            (m) => m.AdvertisementsComponent
          ),
      },
      {
        path: 'manga',
        children: [
          {
            path: 'list',
            loadComponent: () =>
              import('./pages/manga-list/manga-list').then((m) => m.MangaListComponent),
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./pages/manga-create/manga-create').then((m) => m.MangaCreateComponent),
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import('./pages/manga-edit/manga-edit').then((m) => m.MangaEditComponent),
          },
          {
            path: ':mangaId/chapters/create',
            loadComponent: () =>
              import('./pages/chapter-create/chapter-create').then((m) => m.ChapterCreateComponent),
          },
          {
            path: ':mangaId/chapters/:chapterId/edit',
            loadComponent: () =>
              import('./pages/chapter-edit/chapter-edit').then((m) => m.ChapterEditComponent),
          },
          { path: '', redirectTo: 'list', pathMatch: 'full' },
        ],
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
