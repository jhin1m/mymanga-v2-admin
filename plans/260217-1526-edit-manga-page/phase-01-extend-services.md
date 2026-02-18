# Phase 1: Extend Services & Add Types

**Effort**: 1.5h | **Status**: pending

## Context

- Current MangaService: `getMangas()`, `deleteManga()` only
- Need: `getManga(id)`, `updateManga(id, formData)` for edit page
- Missing services: Chapter, Group, Genre (for dropdowns/checkboxes)
- Existing pattern: inject(HttpClient), HttpParams, PaginatedResponse<T>

## Overview

Extend MangaService with detail/update methods. Create ChapterService (full CRUD + bulk delete), GroupService (list), GenreService (list). Follow existing service patterns from artists.service.ts and doujinshis.service.ts.

## Key Insights

- **API endpoints** (from docs/admin-api-docs.json):
  - GET `/api/admin/manga/{id}?include=user,genres,chapters,artist,group,doujinshi`
  - PUT `/api/admin/manga/{id}` (multipart/form-data for cover)
  - GET `/api/admin/chapters?filter[manga_id]=xxx&include=manga,user`
  - POST/PUT/DELETE `/api/admin/chapters/{id}`
  - DELETE `/api/admin/chapters/delete-many` (body: `ids[]`)
- **FormData upload**: updateManga must accept FormData (not JSON) for cover file
- **Genre/Group APIs**: Likely exist as `/api/admin/genres`, `/api/admin/groups` (mirror artist pattern)

## Requirements

### MangaService Extensions
- `getManga(id: string, include?: string): Observable<ApiResponse<Manga>>`
- `updateManga(id: string, formData: FormData): Observable<ApiResponse<Manga>>`

### ChapterService (new)
- Interface: `Chapter { id, name, manga_id, order, created_at, updated_at, user?, manga? }`
- `getChapters(params): Observable<PaginatedResponse<Chapter>>`
- `createChapter(data): Observable<ApiResponse<Chapter>>`
- `updateChapter(id, data): Observable<ApiResponse<Chapter>>`
- `deleteChapter(id): Observable<void>`
- `deleteChapters(ids: string[]): Observable<void>` (bulk)

### GroupService (new)
- Interface: `Group { id, name, slug, user_id, user?, created_at, updated_at }`
- `getGroups(params): Observable<PaginatedResponse<Group>>`

### GenreService (new)
- MangaGenre already exists in manga.service.ts
- `getGenres(): Observable<PaginatedResponse<MangaGenre>>` or `ApiResponse<MangaGenre[]>`

## Architecture

All services use:
- `@Injectable({ providedIn: 'root' })`
- `inject(HttpClient)` pattern
- `environment.apiUrl` base URL
- Return Observable (RxJS)

File locations:
- `src/app/core/services/manga.service.ts` (extend)
- `src/app/core/services/chapter.service.ts` (new)
- `src/app/core/services/group.service.ts` (new)
- `src/app/core/services/genre.service.ts` (new)

## Related Code

- `src/app/core/services/manga.service.ts` (lines 65-90)
- `src/app/core/services/artists.service.ts` (lines 32-70) — pattern reference
- `src/app/core/services/auth.service.ts` — ApiResponse<T> interface
- `src/app/core/models/api-types.ts` — PaginatedResponse<T>

## Implementation Steps

### 1. Extend MangaService
```typescript
// Add to manga.service.ts after deleteManga()

/** Get single manga with relations */
getManga(id: string, include = 'user,genres,artist,group,doujinshi'): Observable<ApiResponse<Manga>> {
  let params = new HttpParams();
  if (include) params = params.set('include', include);
  return this.http.get<ApiResponse<Manga>>(`${environment.apiUrl}/api/admin/manga/${id}`, { params });
}

/** Update manga (multipart for cover upload) */
updateManga(id: string, formData: FormData): Observable<ApiResponse<Manga>> {
  return this.http.post<ApiResponse<Manga>>(`${environment.apiUrl}/api/admin/manga/${id}`, formData);
}
```

### 2. Create ChapterService
```typescript
// src/app/core/services/chapter.service.ts

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';
import { PaginatedResponse } from '../models/api-types';

export interface Chapter {
  id: string;
  name: string;
  manga_id: string;
  order: number;
  created_at: string;
  updated_at: string;
  user?: { id: string; name: string };
  manga?: { id: string; name: string };
}

export interface ChapterListParams {
  page?: number;
  per_page?: number;
  include?: string;
  sort?: string;
  'filter[manga_id]'?: string;
}

export interface ChapterCreateData {
  name: string;
  manga_id: string;
  order?: number;
}

@Injectable({ providedIn: 'root' })
export class ChapterService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/chapters`;

  getChapters(params: ChapterListParams): Observable<PaginatedResponse<Chapter>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<Chapter>>(this.apiBase, { params: httpParams });
  }

  createChapter(data: ChapterCreateData): Observable<ApiResponse<Chapter>> {
    return this.http.post<ApiResponse<Chapter>>(this.apiBase, data);
  }

  updateChapter(id: string, data: ChapterCreateData): Observable<ApiResponse<Chapter>> {
    return this.http.put<ApiResponse<Chapter>>(`${this.apiBase}/${id}`, data);
  }

  deleteChapter(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }

  deleteChapters(ids: string[]): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/delete-many`, { body: { ids } });
  }
}
```

### 3. Create GroupService
```typescript
// src/app/core/services/group.service.ts (mirror artist.service.ts)

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api-types';

export interface Group {
  id: string;
  name: string;
  slug: string;
  user_id: string;
  user?: { id: string; name: string };
  created_at: string;
  updated_at: string;
}

export interface GroupListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  include?: string;
  'filter[name]'?: string;
}

@Injectable({ providedIn: 'root' })
export class GroupService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/groups`;

  getGroups(params: GroupListParams): Observable<PaginatedResponse<Group>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<Group>>(this.apiBase, { params: httpParams });
  }
}
```

### 4. Create GenreService
```typescript
// src/app/core/services/genre.service.ts

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api-types';
import { MangaGenre } from './manga.service'; // reuse interface

@Injectable({ providedIn: 'root' })
export class GenreService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/genres`;

  // Assuming paginated response, adjust if API returns simple array
  getGenres(): Observable<PaginatedResponse<MangaGenre>> {
    return this.http.get<PaginatedResponse<MangaGenre>>(this.apiBase);
  }
}
```

### 5. Import ApiResponse in manga.service.ts
```typescript
// Add to imports at top of manga.service.ts
import { ApiResponse } from './auth.service';
```

## Todo

- [ ] Add getManga() and updateManga() to MangaService
- [ ] Import ApiResponse type in MangaService
- [ ] Create chapter.service.ts with full CRUD + bulk delete
- [ ] Create group.service.ts with list method
- [ ] Create genre.service.ts with list method
- [ ] Test all services compile without errors

## Success Criteria

- All services return typed Observables
- getManga(id) loads manga with includes
- updateManga accepts FormData for file upload
- ChapterService supports bulk delete (ids array)
- GroupService/GenreService ready for dropdown population
- No TypeScript errors

## Security Considerations

- All endpoints require Sanctum bearer token (handled by interceptor)
- File upload: validate file type/size on frontend before submit
- Bulk delete: ensure backend validates ownership/permissions

## Next Steps

After services ready:
- Create edit component shell (Phase 2)
- Wire form to services
- Implement file upload UI
