# Chapter Edit - File Reference & Architecture

**Search Scope:** Edit chapter feature (Angular admin panel)  
**Date:** 2026-02-24  
**Status:** Complete

---

## FOUND FILES

### Component Files (Edit & Create)

| File | Purpose |
|------|---------|
| `/src/app/pages/chapter-edit/chapter-edit.ts` | Edit chapter component (sign API calls, form, image CRUD, drag-drop reorder) |
| `/src/app/pages/chapter-edit/chapter-edit.html` | Template (info card, image upload, pending previews, existing images) |
| `/src/app/pages/chapter-edit/chapter-edit.less` | Styles (drag-drop, upload status indicators, dark theme) |
| `/src/app/pages/chapter-create/chapter-create.ts` | Create chapter component (form, image upload, chapter creation flow) |
| `/src/app/pages/chapter-create/chapter-create.html` | Create chapter template |
| `/src/app/pages/chapter-create/chapter-create.less` | Create chapter styles |

### Service Files

| File | Purpose |
|------|---------|
| `/src/app/core/services/chapters.service.ts` | Chapter CRUD API (get, create, update, delete, upload images, clear images) |
| `/src/app/core/services/chapter-report.service.ts` | Chapter reports API (get reports, statistics, bulk delete) |

### Routes

| File | Details |
|------|---------|
| `/src/app/app.routes.ts` | Route configs for chapter pages (lines 90-98) |

---

## KEY INTERFACES & TYPES

### Chapter Models (from chapters.service.ts)

```typescript
// Basic chapter shape from API
interface Chapter {
  id: string;
  name: string;
  order: number;
  manga_id: string;
  created_at: string;
  updated_at: string;
}

// Image data structure for display
interface ChapterImage {
  id: string;
  image_full_url: string;
  order: number;
}

// Full chapter with images
interface ChapterDetail extends Chapter {
  content?: string[];  // API returns image URLs as array of strings
  images?: ChapterImage[];
}

// Create/update chapter payload
interface ChapterPayload {
  name: string;
  order?: number;
  image_urls?: string[];
}
```

### Edit Component Types (from chapter-edit.ts)

```typescript
// Per-file upload tracking
type UploadStatus = 'waiting' | 'uploading' | 'done' | 'error';

interface PendingFile {
  file: File;
  previewUrl: string;
  status: UploadStatus;
}
```

### Chapter Report Models (from chapter-report.service.ts)

```typescript
// 6 report types
const REPORT_TYPES = {
  broken_images: 'Ảnh bị lỗi',
  missing_images: 'Thiếu ảnh',
  wrong_order: 'Sai thứ tự ảnh',
  wrong_chapter: 'Sai chapter',
  duplicate: 'Chapter trùng lặp',
  other: 'Lỗi khác',
};

interface ChapterReport {
  id: string;
  user_id: string;
  chapter_id: string;
  manga_id: string;
  report_type: ReportType;
  report_type_label: string;
  description: string;
  created_at: string;
  updated_at: string;
  user?: { id: string; name: string; email: string; avatar_full_url?: string };
  chapter?: { id: string; name: string; slug: string; order: number; views: number };
  manga?: { id: string; name: string; slug: string; cover_full_url?: string };
}

interface ChapterReportStatistics {
  total: number;
  by_type: Record<string, number>;
  recent_reports: number;
  today_reports: number;
}
```

---

## ROUTE STRUCTURE

```typescript
// Routes config in app.routes.ts (lines 72-101)
{
  path: 'manga',
  children: [
    { path: 'list', ... },
    { path: 'create', ... },
    { path: 'edit/:id', ... },
    {
      path: ':mangaId/chapters/create',
      loadComponent: () => import('./pages/chapter-create/chapter-create').then(m => m.ChapterCreateComponent),
    },
    {
      path: ':mangaId/chapters/:chapterId/edit',
      loadComponent: () => import('./pages/chapter-edit/chapter-edit').then(m => m.ChapterEditComponent),
    },
  ],
}
```

**URL Patterns:**
- Create chapter: `/manga/:mangaId/chapters/create`
- Edit chapter: `/manga/:mangaId/chapters/:chapterId/edit`

---

## KEY IMPLEMENTATION DETAILS

### ChaptersService API Endpoints

```typescript
GET    /api/admin/chapters                    // List chapters (with manga_id filter)
POST   /api/admin/chapters                    // Create chapter
GET    /api/admin/chapters/:id                // Get chapter detail (with images)
PUT    /api/admin/chapters/:id                // Update chapter name/images
DELETE /api/admin/chapters/:id                // Delete single chapter
PUT    /api/admin/chapters/delete-many        // Bulk delete
PUT    /api/admin/chapters/chapters-order     // Reorder chapters
POST   /api/admin/chapters/:id/add-img        // Upload image (multipart, _method=put)
DELETE /api/admin/chapters/:id/clr-img        // Clear all images
```

### Edit Chapter Flow

1. **Load:** Fetch chapter details (images in `content` field)
2. **Preview:** Drag files → local preview (no upload yet)
3. **Auto-clear:** On first file drag, auto-clears old images (marks as pending deletion)
4. **Save Flow:**
   - Clear existing images (`DELETE /clr-img`)
   - Upload pending files sequentially (`POST /add-img` × N)
   - Fetch fresh chapter (to get updated image_urls from server)
   - Update chapter name + image_urls (`PUT /chapters/:id`)
   - Reload data

### Upload Status Tracking

- `waiting`: File selected, not uploading yet
- `uploading`: Currently being uploaded
- `done`: Upload successful
- `error`: Upload failed

Per-file status shown with icons (loading, check-circle, close-circle).

### Drag-Drop Reorder

- Uses Angular CDK (CdkDropList, CdkDrag)
- Reorders `images()` signal
- Order sent to server in update payload

### Image Safety

- Preview URLs created via `URL.createObjectURL(file)`
- Cleaned up in `ngOnDestroy()` to prevent memory leaks
- 3MB file size limit enforced
- Image type validation (`image/*`)

---

## COMPONENT STRUCTURE

### chapter-edit.ts (ChapterEditComponent)

**State Signals:**
- `loading`, `saving` → UI feedback
- `chapter`, `chapterId`, `mangaId` → current data
- `images` → existing images from server (with drag-drop)
- `uploading`, `pendingDeletion` → upload state
- `pendingPreviews` → files waiting to upload (with per-file status)

**Form:**
- `editForm` with `name` (required)

**Methods:**
- `loadChapter()` → fetch from API, map `content` to `images`
- `onSave()` → route to upload/clear/update based on pending state
- `uploadPendingFiles()` → clear → upload sequentially → reload → update name
- `clearThenUpdateName()` → clear images → update name
- `updateChapterName()` → update chapter with current image URLs
- `beforeImageUpload()` → validate file, create preview, auto-clear old images
- `onImageDrop()` → reorder images via CDK drag-drop

**Imports:**
- Standalone: ReactiveFormsModule, DatePipe, CDK drag-drop, NzZorro modules

### chapter-create.ts (ChapterCreateComponent)

**Flow:**
1. Submit form → create chapter
2. If images pending → upload sequentially
3. Navigate to edit page

**State:**
- `saving`, `uploading` → UI feedback
- `mangaId`, `pendingPreviews` → data
- `uploadedCount`, `uploadTotal` → progress

---

## STYLING NOTES

### Dark Theme Compatible

- Uses `rgba(255, 255, 255, ...)` for light borders/backgrounds
- Upload status colors: `#1890ff` (blue), `#52c41a` (green), `#ff4d4f` (red)
- Pulse animation on uploading items

### Key Classes

- `.top-bar` → header with back + title + save button
- `.image-item` → card for each image (pending/existing)
- `.upload-status` → per-file status badge
- `.pending-section` → grouping for files awaiting upload
- `.drag-handle` → grab icon for reordering

---

## DEPENDENCIES

**External packages:**
- `@angular/cdk` - Drag-drop functionality
- `ng-zorro-antd` - Form, card, button, upload, message, empty, progress, icon, spin

**Services:**
- `ChaptersService` → chapter CRUD + image upload
- `ChapterReportService` → chapter reports (separate feature)

**Guards:**
- `authGuard` on layout route

---

## Summary

**Total files found:** 8 files  
**Components:** 2 (chapter-edit, chapter-create)  
**Services:** 2 (chapters, chapter-report)  
**Routes:** 2 (create, edit)  
**Models/Interfaces:** 8 (Chapter, ChapterDetail, ChapterImage, ChapterPayload, etc.)

All files follow Angular 21 standalone component pattern, use signals for state, and integrate with ng-zorro components for UI.

