# Angular 21 Reactive Forms Patterns - Edit Page Research

## 1. Reactive Forms + File Upload (Multipart)

**Pattern**: Separate FormData from FormGroup
- Reactive FormGroup for text fields (title, author, etc.)
- FormData for submission when file present
- Don't add file to FormControl — track separately with signal

```typescript
form = this.fb.group({ title: '', author: '' });
coverFile = signal<File | null>(null);

onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  this.coverFile.set(file || null);
}

submit() {
  const formData = new FormData();
  formData.append('title', this.form.value.title);
  formData.append('author', this.form.value.author);
  if (this.coverFile()) formData.append('coverImage', this.coverFile()!);
  // POST formData — HttpClient auto-sets multipart header
}
```

**Key points**:
- Never set `Content-Type: multipart/form-data` manually — browser adds boundary
- Validate file type/size client-side with accept attribute
- Use HttpEventType.UploadProgress for progress tracking

Sources: [SparkCodeHub](https://www.sparkcodehub.com/angular/forms/implement-file-upload), [Medium - Multipart Data](https://medium.com/@sandakova.varvara/multipart-data-2be14bd21ff1)

## 2. Pre-populating Form from API

**Use `patchValue()` for edit forms**:
- `patchValue()` — partial update, ignores missing fields (safe for API data)
- `setValue()` — requires all fields, throws if structure mismatch

```typescript
loadManga(id: string) {
  this.api.getManga(id).subscribe(manga => {
    this.form.patchValue({
      title: manga.title,
      author: manga.author
      // missing fields ignored
    });
  });
}
```

**When to use each**:
- Edit forms → `patchValue()` (API may not return all form fields)
- Reset/initialization → `setValue()` (strict validation)

Sources: [Ultimate Courses](https://ultimatecourses.com/blog/angular-2-form-controls-patch-value-set-value), [Medium - patchValue vs setValue](https://medium.com/@bhagirathsinhmakwana2001/angular-reactive-forms-set-value-and-patch-value-functions-c123705562f4)

## 3. NG-ZORRO Form Validation

**Error display pattern**:
```html
<nz-form-control nzHasFeedback [nzErrorTip]="errorTpl">
  <input nz-input formControlName="title" />
  <ng-template #errorTpl let-control>
    @if (control.errors?.['required']) { Title required }
    @if (control.errors?.['maxlength']) { Max 200 chars }
  </ng-template>
</nz-form-control>
```

**Key props**:
- `nzValidateStatus` — 'success' | 'warning' | 'error' | 'validating'
- `nzHasFeedback` — shows icon (checkmark/cross)
- `nzErrorTip` — error message (string or TemplateRef)

**Important**: After `markAsDirty()`, call `updateValueAndValidity()` to trigger nz-form-control update

Sources: [NG-ZORRO Form Docs](https://ng.ant.design/components/form/en), [validate-reactive demo](https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/components/form/demo/validate-reactive.ts)

## 4. Embedded Chapter Table

**Pattern**: Table outside FormGroup
- Chapter list is separate data, not part of manga form
- Use nz-table with CRUD actions (edit/delete)
- Pass manga ID to chapter operations

```typescript
// manga-edit.component.ts
mangaId = input.required<string>();
chapters = signal<Chapter[]>([]);

loadChapters() {
  this.api.getChapters(this.mangaId()).subscribe(data => this.chapters.set(data));
}

deleteChapter(id: string) {
  this.api.deleteChapter(id).subscribe(() => this.loadChapters());
}
```

**Alternative (if chapters editable inline)**: Use FormArray for in-place editing
- Not needed for your case — chapters managed separately via modal/page

Sources: [Angular FormArray Guide](https://blog.angular-university.io/angular-form-array/), [Material Table + Forms](https://medium.com/@agremzo/combining-material-table-with-reactive-forms-c94c610da01e)

## 5. Auto-save Indicator

**Pattern**: Signal + debounceTime + state tracking

```typescript
saveState = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');
lastSaved = signal<Date | null>(null);

constructor() {
  this.form.valueChanges.pipe(
    debounceTime(1500),
    switchMap(value => {
      this.saveState.set('saving');
      return this.api.updateManga(this.mangaId(), value);
    })
  ).subscribe({
    next: () => {
      this.saveState.set('saved');
      this.lastSaved.set(new Date());
      setTimeout(() => this.saveState.set('idle'), 3000); // reset after 3s
    },
    error: () => this.saveState.set('error')
  });
}
```

**Template**:
```html
@if (lastSaved()) {
  <span>Cập nhật lần cuối lúc {{ lastSaved() | date:'HH:mm:ss dd/MM/yyyy' }}</span>
}
@if (saveState() === 'saving') { <nz-spin /> }
```

**Key operators**:
- `debounceTime(1500)` — wait 1.5s after last keystroke
- `auditTime` / `throttleTime` — alternative for periodic saves

Sources: [Nils Mehlhorn - Angular Autosave](https://nils-mehlhorn.de/posts/angular-autosave-form-services-ngrx/), [Medium - Auto-Save Angular](https://medium.com/@angular-adventurer/auto-save-in-angular-build-smart-reliable-form-saving-without-buttons-0a91558c0e39)

---

## Unresolved Questions
None — patterns are well-documented and applicable to Angular 21 standalone components.
