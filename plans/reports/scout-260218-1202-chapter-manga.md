# Scout Report: Chapter & Manga Pages

## Summary
Scouted codebase for chapter-related files, manga pages, upload functionality, and route structure. Found complete manga management system with create/edit/list pages, chapter service with full CRUD, and image upload handling via FormData.

## File Locations

### Route Configuration
- **App Routes**: `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/app.routes.ts`
  - Login: `/login` (standalone, outside layout)
  - Manga routes under `/manga` with children: `list`, `create`, `edit/:id`
  - All manga routes authenticated via `authGuard`

### Manga Pages
- **Create Page**: `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/manga-create/`
  - `manga-create.ts` - Component (new, in progress per git status)
  - `manga-create.html` - Template
  - `manga-create.less` - Styles

- **Edit Page**: `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/manga-edit/`
  - `manga-edit.ts` - Component (fully featured, 519 lines)
  - `manga-edit.html` - Template (started reading, ~100 lines shown)
  - `manga-edit.less` - Styles

- **List Page**: `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/manga-list/`
  - `manga-list.ts` - Component
  - `manga-list.html` - Template
  - `manga-list.less` - Styles

### Services
- **Chapters Service**: `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/services/chapters.service.ts` (67 lines)
  - Methods: `getChapters()`, `createChapter()`, `updateChapter()`, `deleteChapter()`, `deleteChaptersBulk()`
  - Interfaces: `Chapter`, `ChapterListParams`, `ChapterPayload`
  - API Base: `${environment.apiUrl}/api/admin/chapters`

- **Manga Service**: `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/services/manga.service.ts` (108 lines)
  - Methods: `getMangas()`, `getManga()`, `createManga()`, `updateManga()`, `deleteManga()`
  - Interfaces: `Manga`, `MangaUser`, `MangaRelation`, `MangaGenre`, `MangaListParams`
  - API Base: `${environment.apiUrl}/api/admin/mangas`

- **Related Services** (for dropdown search):
  - `genres.service.ts`
  - `artists.service.ts`
  - `groups.service.ts`
  - `doujinshis.service.ts`
  - `members.service.ts`

### Shared Components
- **Pagination Bar**: `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/shared/pagination-bar/pagination-bar.ts`

## Key Features Found

### Upload Functionality
- **Image Upload**: Uses `NzUploadModule` (ng-zorro) with `beforeCoverUpload()` handler
- **FormData Pattern**: Both manga-create and manga-edit send FormData (not JSON)
- **No Dedicated Upload Service**: Upload handled inline in components via `FormData` + `MangaService`
- **Preview**: Uses `FileReader` API for local preview before upload

Example from manga-edit.ts (lines 335-346):
```typescript
beforeCoverUpload = (file: NzUploadFile): boolean => {
  const rawFile = file as unknown as File;
  this.coverFile = rawFile;
  const reader = new FileReader();
  reader.onload = () => this.coverPreviewUrl.set(reader.result as string);
  reader.readAsDataURL(rawFile);
  return false; // Prevent automatic upload
};
```

### Chapter Management in Edit Page
- **List**: Paginated chapter list with search, sort, and selection
- **Checkboxes**: Select individual chapters or all on current page
- **Actions**: Delete single, bulk delete, navigate to create/edit
- **Pagination**: Uses `PaginationBarComponent` (shared)
- **State**: Tracks `chapters`, `chaptersLoading`, `checkedChapterIds`, `allChaptersChecked`

Navigation in lines 474-480:
```typescript
onNavigateCreateChapter(): void {
  this.router.navigate(['/manga', this.mangaId(), 'chapters', 'create']);
}
onNavigateEditChapter(chapter: Chapter): void {
  this.router.navigate(['/manga', this.mangaId(), 'chapters', chapter.id, 'edit']);
}
```

### Drag-and-Drop / CDK
- **Not Found**: No `@angular/cdk` imports detected
- **Not Found**: No drag-drop directives in any component
- Conclusion: Drag-and-drop not implemented yet

## Architecture Patterns

### Form Handling
- Reactive Forms (`ReactiveFormsModule`)
- Form Builder with validation
- Signal-based state management

### Search/Filter Dropdowns
- Server-side search using `nzServerSearch`
- Debounce (300ms) + `distinctUntilChanged()` via RxJS
- Example: Artist, Group, Doujinshi, User dropdowns with dynamic loading

### State Management
- Angular Signals: `signal()`, `computed()`
- No NgRx or other global state manager
- Component-level state with signals

### API Communication
- HttpClient with typed observables
- FormData for file uploads (multipart)
- Laravel-style filters: `filter[name]`, `filter[status]`
- Include relations: `?include=user,genres,artist,group,doujinshi`

## Data Models

### Chapter Interface
```typescript
interface Chapter {
  id: string;
  name: string;
  order: number;
  manga_id: string;
  created_at: string;
  updated_at: string;
}
```

### Manga Interface
```typescript
interface Manga {
  id: string;
  name: string;
  name_alt: string | null;
  pilot: string | null;
  status: number; // 1=Completed, 2=InProgress
  slug: string;
  is_reviewed: boolean;
  is_hot: boolean;
  cover_full_url: string | null;
  finished_by: string | null;
  created_at: string;
  updated_at: string;
  user?: MangaUser;
  artist?: MangaRelation | null;
  group?: MangaRelation | null;
  doujinshi?: MangaRelation | null;
  genres?: MangaGenre[];
}
```

## UI Components Used

### Modules Imported
- `NzCardModule` - Cards/sections
- `NzFormModule` - Form layout
- `NzInputModule` - Text inputs
- `NzSelectModule` - Dropdowns with search
- `NzButtonModule` - Buttons
- `NzGridModule` - Layout (row/col)
- `NzIconModule` - Icons
- `NzCheckboxModule` - Checkboxes
- `NzSwitchModule` - Toggle switches
- `NzUploadModule` - File upload
- `NzSpinModule` - Loading spinner
- `NzDividerModule` - Dividers
- `NzTableModule` - Tables (chapters list)
- `NzPopconfirmModule` - Delete confirmations
- `NzTooltipModule` - Tooltips
- `NgxEditorModule` - Rich text (pilot/description)

## Routes Not Yet in app.routes.ts

The manga-edit component navigates to chapter routes that don't exist in app.routes.ts yet:
- `/manga/:mangaId/chapters/create`
- `/manga/:mangaId/chapters/:chapterId/edit`

These routes need to be added to support chapter management.

## Next Steps for Implementation

1. Create chapter routes in app.routes.ts (create + edit)
2. Create chapter-create and chapter-edit components
3. Implement image upload for chapters if needed
4. Consider drag-drop for chapter ordering (currently no CDK usage)
5. Test pagination and bulk delete functionality
