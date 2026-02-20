# Phase 01: Service & Types

> Parent: [plan.md](./plan.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-20 |
| Priority | P2 |
| Implementation | pending |
| Review | pending |

Create `PetsService` with CRUD methods and TypeScript interfaces. Mirrors `achievements.service.ts` exactly.

## Key Insights

- API endpoints: `/api/admin/pets` with standard CRUD
- Filters: `filter[name]`, `filter[user_id]`
- Include: `user` relationship
- Same response format as achievements (PaginatedResponse, ApiResponse)

## Requirements

- Pet interface matching API response
- PetListParams with filter/pagination support
- PetPayload for create/update
- CRUD methods: list, create, update, delete

## Related Files

- `src/app/core/services/achievements.service.ts` — reference pattern
- `src/app/core/models/api-types.ts` — PaginatedResponse type
- `src/app/core/services/auth.service.ts` — ApiResponse type

## Implementation Steps

### Create `src/app/core/services/pets.service.ts`

```typescript
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './auth.service';
import { PaginatedResponse } from '../models/api-types';

/** Shape of Pet from API */
export interface Pet {
  id: string;
  name: string;
  user_id: string;
  user?: { id: string; name: string };
  created_at: string;
  updated_at: string;
}

/** Params for filter/pagination */
export interface PetListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  include?: string;
  'filter[name]'?: string;
  'filter[user_id]'?: string;
}

/** Payload for create/update */
export interface PetPayload {
  name: string;
}

@Injectable({ providedIn: 'root' })
export class PetsService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/pets`;

  /** List pets with filter + pagination */
  getPets(params: PetListParams): Observable<PaginatedResponse<Pet>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<Pet>>(this.apiBase, { params: httpParams });
  }

  /** Create pet */
  createPet(payload: PetPayload): Observable<ApiResponse<Pet>> {
    return this.http.post<ApiResponse<Pet>>(this.apiBase, payload);
  }

  /** Update pet */
  updatePet(id: string, payload: PetPayload): Observable<ApiResponse<Pet>> {
    return this.http.put<ApiResponse<Pet>>(`${this.apiBase}/${id}`, payload);
  }

  /** Delete pet */
  deletePet(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
```

## Todo

- [ ] Create `src/app/core/services/pets.service.ts` with above code

## Success Criteria

- Service compiles without errors
- All CRUD methods present
- Types exported for component use

## Risk Assessment

- Low risk — direct copy of proven pattern
- Pet model may have additional fields not documented; service will still work, just add fields to interface later

## Next Steps

Proceed to Phase 02 (component & template)
