# Phase 4: Rich Text Editor Integration

**Effort**: 1.5h | **Status**: pending

## Context

- Pilot field currently uses nz-textarea (Phase 2)
- Screenshot shows rich text toolbar: bold, italic, underline, strikethrough, quote, link, color, alignment
- Angular 21 standalone component pattern
- Need Quill editor library compatible with Angular 21

## Overview

Install ngx-quill v29 (latest for Angular 21 standalone support), configure QuillModule, replace pilot textarea with quill-editor component. Customize toolbar to match screenshot (basic formatting + link + color + align). Quill outputs HTML string, compatible with existing FormControl binding.

## Key Insights

- **ngx-quill v29**: First version with full Angular 21 standalone support
- **Quill CSS**: Must import `quill/dist/quill.snow.css` in styles.less or angular.json
- **Toolbar config**: Pass modules config with toolbar array to quill-editor
- **FormControl binding**: Use `formControlName="pilot"` as usual, Quill outputs HTML
- **Standalone import**: Import QuillModule in component imports array (not needed in app.config for v29)

## Requirements

### Installation
- ngx-quill@^29.0.0
- quill@^2.0.0 (peer dependency)

### Toolbar Features (from screenshot)
- Basic formatting: bold, italic, underline, strike
- Block quote
- Link insert
- Text color picker
- Text alignment (left, center, right)

### Integration
- Replace `<textarea formControlName="pilot">` with `<quill-editor formControlName="pilot">`
- Configure toolbar modules
- Style editor height ~300px
- Preserve existing form binding (no logic changes)

## Architecture

Quill configuration object:
```typescript
quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'link'],
    [{ color: [] }],
    [{ align: [] }],
  ],
};
```

CSS styling (in manga-edit.less):
```less
quill-editor {
  display: block;
  min-height: 300px;
}
```

## Related Code

- `pages/manga-edit/manga-edit.ts` (pilot form field)
- `pages/manga-edit/manga-edit.html` (textarea to replace)
- ngx-quill docs: https://github.com/KillerCodeMonkey/ngx-quill

## Implementation Steps

### 1. Install Dependencies

```bash
npm install ngx-quill@^29.0.0 quill@^2.0.0
```

### 2. Import Quill CSS

Add to `src/styles.less` or add to angular.json styles array:
```less
// In src/styles.less
@import 'quill/dist/quill.snow.css';
```

Or in `angular.json`:
```json
{
  "styles": [
    "src/styles.less",
    "node_modules/quill/dist/quill.snow.css"
  ]
}
```

### 3. Update Component Imports (manga-edit.ts)

Add QuillModule import:
```typescript
import { QuillModule } from 'ngx-quill';

@Component({
  // ...
  imports: [
    // ... existing imports
    QuillModule,
  ],
  // ...
})
```

### 4. Add Quill Config to Component

Add class property:
```typescript
protected readonly quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'link'],
    [{ color: [] }],
    [{ align: [] }],
  ],
};
```

### 5. Replace Textarea in Template (manga-edit.html)

Find pilot field nz-form-item (around line 80-90), replace:

**Before:**
```html
<nz-form-item>
  <nz-form-label>Nội dung</nz-form-label>
  <nz-form-control>
    <textarea
      nz-input
      formControlName="pilot"
      rows="10"
      placeholder="Mô tả nội dung manga"
    ></textarea>
  </nz-form-control>
</nz-form-item>
```

**After:**
```html
<nz-form-item>
  <nz-form-label>Nội dung</nz-form-label>
  <nz-form-control>
    <quill-editor
      formControlName="pilot"
      [modules]="quillModules"
      placeholder="Mô tả nội dung manga"
    ></quill-editor>
  </nz-form-control>
</nz-form-item>
```

### 6. Add Component Styles (manga-edit.less)

```less
// Existing styles...

// Quill editor styling
quill-editor {
  display: block;

  ::ng-deep .ql-container {
    min-height: 300px;
    font-size: 14px;
  }

  ::ng-deep .ql-toolbar {
    background: #fafafa;
    border-radius: 2px 2px 0 0;
  }
}
```

### 7. Test Integration

- Start dev server: `npm start`
- Navigate to manga edit page
- Verify toolbar displays all buttons (bold, italic, underline, strike, quote, link, color, align)
- Type content, test formatting buttons
- Save form, verify HTML content persists
- Reload page, verify pilot content displays in editor

## Todo

- [ ] Install ngx-quill and quill packages
- [ ] Import Quill CSS in styles.less or angular.json
- [ ] Import QuillModule in component
- [ ] Add quillModules config to component class
- [ ] Replace textarea with quill-editor in template
- [ ] Add quill-editor styles to manga-edit.less
- [ ] Test editor displays and binds to formControl
- [ ] Test all toolbar buttons work
- [ ] Test save/reload preserves HTML content

## Success Criteria

- Quill editor renders in pilot field
- Toolbar matches screenshot layout (bold, italic, underline, strike, quote, link, color, align)
- FormControl binding works (no code changes needed)
- Typing and formatting work smoothly
- HTML content saves to backend and reloads correctly
- Editor height ~300px minimum
- No console errors

## Risks

- **Version compatibility**: ngx-quill v29 is new, may have bugs — fallback to v28 if issues
- **CSS conflicts**: Quill styles may conflict with ng-zorro — use ::ng-deep to override
- **HTML sanitization**: Backend should sanitize HTML to prevent XSS — verify with backend team

## Security Considerations

- Quill outputs raw HTML — backend MUST sanitize before storing
- Consider limiting allowed HTML tags (only p, strong, em, u, s, blockquote, a, span)
- Validate link URLs (no javascript: protocol)
- Set CSP headers to prevent inline script execution

## Next Steps

After Quill integration:
- Complete routing and navigation (Phase 5)
- Full end-to-end testing
- Documentation update
