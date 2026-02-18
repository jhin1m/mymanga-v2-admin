# Angular 21 UI Components Research — Edit Manga Page

**Date:** 2026-02-17
**Project:** admin-mymanga

---

## 1. Rich Text Editors for Angular 21 Standalone

### Option 1: ngx-quill (Recommended)
- **Version:** v29.0.0 supports Angular 21
- **Installation:** `npm i ngx-quill quill`
- **Standalone setup:**
```ts
// app.config.ts
import { provideQuillConfig } from 'ngx-quill/config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideQuillConfig({
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote', 'link'],
          [{ color: [] }],
          [{ align: [] }]
        ]
      }
    })
  ]
};

// component.ts
import { QuillEditorComponent } from 'ngx-quill';
@Component({
  standalone: true,
  imports: [QuillEditorComponent, FormsModule]
})
export class EditMangaComponent {
  content = signal('');
}

// template
<quill-editor [(ngModel)]="content" [modules]="{ toolbar: [...] }"></quill-editor>
```

### Option 2: @kolkov/angular-editor
- **Version:** v3.0.0+ for Angular 20+/21
- **Lighter weight, native Angular**
```ts
import { AngularEditorModule } from '@kolkov/angular-editor';
import { HttpClientModule } from '@angular/common/http';

// Requires HttpClientModule for image upload
```

### Option 3: ngx-editor
- **Standalone imports:** `NgxEditorComponent`, `NgxEditorMenuComponent`
- **More modular, supports schema-based editing**

**Recommendation:** ngx-quill — mature, widely used, Quill.js-based with strong community support.

---

## 2. ng-zorro Image Upload (nz-upload)

```ts
// component.ts
import { NzUploadFile, NzUploadChangeParam } from 'ng-zorro-antd/upload';

@Component({
  selector: 'app-edit-manga',
  imports: [NzUploadModule, NzModalModule]
})
export class EditMangaComponent {
  fileList: NzUploadFile[] = [];
  previewImage = '';
  previewVisible = false;

  handlePreview = (file: NzUploadFile): void => {
    this.previewImage = file.url || file.thumbUrl || '';
    this.previewVisible = true;
  };

  handleChange(info: NzUploadChangeParam): void {
    this.fileList = info.fileList;
  }
}

// template
<nz-upload
  nzAction="https://api.mymanga.com/upload"
  nzListType="picture-card"
  [(nzFileList)]="fileList"
  [nzShowUploadList]="{ showPreviewIcon: true, showRemoveIcon: true }"
  [nzPreview]="handlePreview">
  <button nz-button *ngIf="fileList.length < 1">
    <span nz-icon nzType="upload"></span> Upload Cover
  </button>
</nz-upload>

<nz-modal [(nzVisible)]="previewVisible" [nzContent]="modalContent" [nzFooter]="null">
  <ng-template #modalContent>
    <img [src]="previewImage" style="width: 100%" />
  </ng-template>
</nz-modal>
```

**Key props:**
- `nzListType="picture-card"` — thumbnail grid display
- `[nzPreview]` — handle click-to-preview
- `nzShowUploadList` — control preview/remove icons

---

## 3. ng-zorro Checkbox Grid for Genres

```ts
// component.ts
@Component({
  imports: [NzCheckboxModule, NzGridModule]
})
export class EditMangaComponent {
  genres = [
    { label: 'Webtoon', value: 'webtoon' },
    { label: 'X-ray', value: 'xray' },
    { label: 'Yandere', value: 'yandere' },
    { label: 'Yaoi', value: 'yaoi' },
    { label: 'Yuri', value: 'yuri' },
    { label: 'Zombie', value: 'zombie' }
  ];
  selectedGenres = signal<string[]>([]);
}

// template
<nz-checkbox-group [(ngModel)]="selectedGenres">
  <div nz-row [nzGutter]="16">
    <div nz-col [nzSpan]="8" *ngFor="let genre of genres">
      <label nz-checkbox [nzValue]="genre.value">{{ genre.label }}</label>
    </div>
  </div>
</nz-checkbox-group>
```

**Grid spacing:** `[nzGutter]="16"` (or `{ xs: 8, sm: 16, md: 24 }` for responsive)
**Column width:** `[nzSpan]="8"` = 3 columns (24 / 8)

---

## 4. ng-zorro Select with Search

```ts
// component.ts
@Component({
  imports: [NzSelectModule, FormsModule]
})
export class EditMangaComponent {
  doujinshiList = signal([
    { id: 1, name: 'Doujinshi A' },
    { id: 2, name: 'Doujinshi B' }
  ]);
  selectedDoujinshi = signal<number | null>(null);
}

// template
<nz-select
  nzShowSearch
  nzAllowClear
  nzPlaceHolder="Select Doujinshi"
  [(ngModel)]="selectedDoujinshi"
  [nzFilterOption]="filterOption">
  <nz-option
    *ngFor="let item of doujinshiList()"
    [nzLabel]="item.name"
    [nzValue]="item.id">
  </nz-option>
</nz-select>

// Filter function (component)
filterOption = (input: string, option: any): boolean => {
  return option.nzLabel.toLowerCase().includes(input.toLowerCase());
};
```

**Key props:**
- `nzShowSearch` — enables search input
- `nzAllowClear` — adds clear button
- `[nzFilterOption]` — custom filter logic (default: case-insensitive match)

---

## Sources
- [ngx-quill npm](https://www.npmjs.com/package/ngx-quill)
- [ngx-quill GitHub](https://github.com/KillerCodeMonkey/ngx-quill)
- [@kolkov/angular-editor npm](https://www.npmjs.com/package/@kolkov/angular-editor)
- [ngx-editor npm](https://www.npmjs.com/package/ngx-editor)
- [ng-zorro Upload docs](https://ng.ant.design/components/upload/en)
- [ng-zorro Checkbox docs](https://ng.ant.design/components/checkbox/en)
- [ng-zorro Grid docs](https://ng.ant.design/components/grid/en)
- [ng-zorro Select docs](https://ng.ant.design/components/select/en)
