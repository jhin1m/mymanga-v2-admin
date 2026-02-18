# MyManga VN Admin API Documentation

## Overview

**Base URL**: `/api/admin`
**Authentication**: Bearer Token
**Content Type**: `application/json`

All admin endpoints require authentication except the login endpoint. The API uses throttle exemption for admin routes.

## Standard Query Parameters

Most `GET` endpoints that return a list of resources (e.g., `/api/admin/users`, `/api/admin/mangas`) support the following standard query parameters provided by the dynamic query builder:

### Pagination
- `page` (int): The page number to retrieve. Default: `1`.
- `per_page` (int): Number of items per page. Default: `20`.

### Sorting
- `sort` (string): Field to sort by. Prepend a minus sign `-` for descending order.
- Examples: 
  - `sort=created_at` (Oldest first)
  - `sort=-created_at` (Newest first)

### Filtering
- `filter[field]` (mixed): Filter results by a specific field.
- Multiple filters can be combined: `filter[status]=ongoing&filter[is_reviewed]=1`
- Example: `filter[id]=cf62c5f3-51df-4168-8d8f-490b1dc32ad8`

### Including Relationships
- `include` (string): Comma-separated list of relationships to include in the response.
- Example: `include=genres,latest_chapter`


## Authentication

### Response Format

**Success Response**:
```json
{
  "success": true,
  "data": { ... },
  "code": 200
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Error message",
  "code": 400
}
```

### POST /api/admin/auth
Login to admin panel

**Request**:
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "1|abc123...",
    "type": "Bearer"
  }
}
```

### GET /api/admin/auth
Get admin profile

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid-123",
    "name": "Admin User",
    "email": "admin@example.com",
    "roles": ["admin"]
  }
}
```

### DELETE /api/admin/auth
Logout admin

**Headers**: `Authorization: Bearer {token}`

**Response**: `204 No Content`

## Users Management

**Permissions**: Admin only

### GET /api/admin/users
List all users

**Query Parameters**:
- `page` (int): Page number
- `per_page` (int): Items per page
- `sort` (string): Sort field (`id`, `created_at`, `updated_at`)
- `filter[id]` (uuid): Filter by user ID
- `filter[name]` (string): Filter by name
- `filter[email]` (string): Filter by email
- `filter[role]` (string): Filter by role
- `include` (string): Relationships to include (`pet`, `pets`, `achievements`, `roles`)

**Example**: `/api/admin/users?page=1&per_page=50&sort=-created_at&filter[id]=cf62c5f3-51df-4168-8d8f-490b1dc32ad8`

**Response**:
```json
{
    "status": 200,
    "success": true,
    "data": [
        {
            "id": "cf62c5f3-51df-4168-8d8f-490b1dc32ad8",
            "name": "Ch\u00ed Cao Th\u1ea7n",
            "email": "nguyenhao83dn@gmail.com",
            "google_id": "115166107397551614550",
            "email_verified_at": null,
            "total_points": 45,
            "used_points": 0,
            "achievements_points": 45,
            "exp": 90,
            "level": 1,
            "last_reading_check": "2025-12-14T12:05:34.000000Z",
            "pet_id": null,
            "achievement_id": null,
            "banned_until": null,
            "limit_pet_points": 155,
            "limit_achievement_points": 255,
            "created_at": "2025-12-14T12:07:58.000000Z",
            "updated_at": "2025-12-14T12:15:34.000000Z",
            "avatar_full_url": "http:\/\/127.0.0.1:8000\/storage\/images\/avatars\/WXDtxqfQ7rbpt0z5bqoZma0av0vY5Fw9OFUK0Qze.jpg"
        }
    ],
    "pagination": {
        "count": 50,
        "total": 49724,
        "perPage": 50,
        "currentPage": 1,
        "totalPages": 995,
        "links": {
            "next": "http:\/\/127.0.0.1:8000\/api\/admin\/users?per_page=50&sort=-created_at&page=2"
        }
    }
}
```

### GET /api/admin/users/{id}
Get user details

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid-123",
    "name": "User Name",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00.000000Z"
  }
}
```

### PUT /api/admin/users/{id}
Update user

**Request**:
```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

### DELETE /api/admin/users/{id}/delete-comment
Delete user comment

**Response**: `200 OK`

## Manga Management

**Permissions**:
- `index`, `show`: All authenticated users
- `store`: All authenticated users
- `update`, `destroy`: Admin or owner

### GET /api/admin/mangas
List mangas

**Query Parameters**:
- `page` (int): Page number
- `per_page` (int): Items per page
- `sort` (string): Sort field (`updated_at`, `created_at`, `name`, `views`, `average_rating`, etc.)
- `filter[id]` (uuid): Filter by ID
- `filter[name]` (string): Filter by name (searches name and alt name)
- `filter[status]` (string): Filter by status (`ongoing`, `completed`, etc.)
- `filter[group_id]` (uuid): Filter by group
- `filter[user_id]` (uuid): Filter by uploader
- `filter[artist_id]` (uuid): Filter by artist
- `filter[is_reviewed]` (boolean): Filter by review status
- `filter[search]` (string): Search scope
- `filter[accept_genres]` (array): Filter by included genres
- `filter[reject_genres]` (array): Filter by excluded genres
- `include` (string): Relationships to include (`genres`, `latest_chapter`, `first_chapter`, `user`, `artist`, `group`, etc.)


**Response**:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid-123",
        "name": "Manga Title",
        "name_alt": "Alternative Title",
        "status": "ongoing",
        "cover": "https://example.com/cover.jpg",
        "is_reviewed": true,
        "created_at": "2024-01-01T00:00:00.000000Z"
      }
    ]
  }
}
```

### GET /api/admin/mangas/{id}
Get manga details

### POST /api/admin/mangas
Create new manga

**Request**:
```json
{
  "name": "Manga Title",
  "name_alt": "Alternative Title",
  "artist_id": "uuid-artist",
  "doujinshi_id": "uuid-doujinshi",
  "group_id": "uuid-group",
  "status": "ongoing",
  "cover": "image_file",
  "genres": [1, 2, 3]
}
```

**Validation Rules**:
- `name`: required, string, max:255
- `artist_id`: exists:artists,id
- `doujinshi_id`: exists:doujinshis,id
- `group_id`: exists:groups,id
- `cover`: file, mimes:jpg,png,webp, max:2048KB
- `genres`: array of numeric IDs

### PUT /api/admin/mangas/{id}
Update manga

### DELETE /api/admin/mangas/{id}
Delete manga

## Chapter Management

**Permissions**:
- `index`, `show`: Public access
- `store`: All authenticated users
- `update`, `destroy`, `addImage`, `clearImage`: Admin or owner
- `updateChapterOrder`, `deleteMany`: Admin only

### GET /api/admin/chapters
List chapters

**Query Parameters**: Standard pagination and filtering
- `sort`: `updated_at`, `created_at`, `name`, `views`, `order`
- `filter[id]`: Filter by ID
- `filter[name]`: Filter by name
- `filter[manga_id]`: Filter by manga ID
- `filter[user_id]`: Filter by uploader ID
- `include`: `user`, `manga`

### GET /api/admin/chapters/{id}
Get chapter details

### POST /api/admin/chapters
Create new chapter

**Request**:
```json
{
  "name": "Chapter 1",
  "order": 1,
  "manga_id": "uuid-manga"
}
```

**Validation Rules**:
- `name`: required, string, max:255
- `order`: numeric
- `manga_id`: required, uuid, exists:mangas,id

### PUT /api/admin/chapters/{id}
Update chapter

### DELETE /api/admin/chapters/{id}
Delete chapter

### DELETE /api/admin/chapters/{id}/clr-img
Clear chapter images

### PUT /api/admin/chapters/{id}/add-img
Add image to chapter

**Request**: `multipart/form-data`
- `image`: image file

### PUT /api/admin/chapters/chapters-order
Update chapter order

**Request**:
```json
{
  "chapters_order": [
    {"id": "uuid-1", "order": 1},
    {"id": "uuid-2", "order": 2}
  ]
}
```

### PUT /api/admin/chapters/delete-many
Delete multiple chapters

**Request**:
```json
{
  "ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

## Genre Management

**Permissions**:
- `index`, `show`: Public access
- `store`, `update`, `destroy`: Admin only

### GET /api/admin/genres
List genres

**Query Parameters**: Standard pagination and filtering
- `filter[id]`: Filter by ID
- `filter[name]`: Filter by name
- `filter[slug]`: Filter by slug

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Action",
      "slug": "action",
      "created_at": "2024-01-01T00:00:00.000000Z"
    }
  ]
}
```

### GET /api/admin/genres/{id}
Get genre details

### POST /api/admin/genres
Create genre

**Request**:
```json
{
  "name": "New Genre",
  "slug": "new-genre"
}
```

### PUT /api/admin/genres/{id}
Update genre

### DELETE /api/admin/genres/{id}
Delete genre

## Artist Management

**Permissions**: Admin or owner for update/delete

### GET /api/admin/artists
List artists

**Query Parameters**: Standard pagination and filtering
- `filter[id]`: Filter by ID
- `filter[name]`: Filter by name
- `include`: `user`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-123",
      "name": "Artist Name",
      "created_at": "2024-01-01T00:00:00.000000Z"
    }
  ]
}
```

### GET /api/admin/artists/{id}
Get artist details

### POST /api/admin/artists
Create artist

**Request**:
```json
{
  "name": "Artist Name"
}
```

### PUT /api/admin/artists/{id}
Update artist

### DELETE /api/admin/artists/{id}
Delete artist

## Group Management

**Permissions**: Admin or owner for update/delete

### GET /api/admin/groups
List groups

**Query Parameters**: Standard pagination and filtering
- `filter[id]`: Filter by ID
- `filter[name]`: Filter by name
- `filter[user_id]`: Filter by uploader ID
- `include`: `user`

### GET /api/admin/groups/{id}
Get group details

### POST /api/admin/groups
Create group

**Request**:
```json
{
  "name": "Scanlation Group"
}
```

### PUT /api/admin/groups/{id}
Update group

### DELETE /api/admin/groups/{id}
Delete group

## Doujinshi Management

**Permissions**: Admin or owner for update/delete

### GET /api/admin/doujinshis
List doujinshis

**Query Parameters**: Standard pagination and filtering
- `filter[id]`: Filter by ID
- `filter[name]`: Filter by name
- `filter[user_id]`: Filter by uploader ID
- `include`: `user`

### GET /api/admin/doujinshis/{id}
Get doujinshi details

### POST /api/admin/doujinshis
Create doujinshi

### PUT /api/admin/doujinshis/{id}
Update doujinshi

### DELETE /api/admin/doujinshis/{id}
Delete doujinshi

## Comment Management

**Permissions**: Admin only for delete

### GET /api/admin/comments
List comments

**Query Parameters**: Standard pagination and filtering
- `sort`: `updated_at`, `created_at`
- `filter[username]`: Search by username (scope)
- `filter[created_at_start]`: Start date filter (scope)
- `filter[created_at_end]`: End date filter (scope)
- `include`: `user`, `commentable`, `parent`, `childes`

### GET /api/admin/comments/{id}
Get comment details

### POST /api/admin/comments
Create comment

### PUT /api/admin/comments/{id}
Update comment

### DELETE /api/admin/comments/{id}
Delete comment

## Achievement Management

**Permissions**: Admin or owner for update/delete

### GET /api/admin/achievements
List achievements

**Query Parameters**: Standard pagination and filtering
- `filter[name]`: Filter by name
- `filter[user_id]`: Filter by user ID
- `include`: `user`

### GET /api/admin/achievements/{id}
Get achievement details

### POST /api/admin/achievements
Create achievement

### PUT /api/admin/achievements/{id}
Update achievement

### DELETE /api/admin/achievements/{id}
Delete achievement

## Pet Management

**Permissions**: Admin or owner for update/delete

### GET /api/admin/pets
List pets

**Query Parameters**: Standard pagination and filtering
- `filter[name]`: Filter by name
- `filter[user_id]`: Filter by user ID
- `include`: `user`

### GET /api/admin/pets/{id}
Get pet details

### POST /api/admin/pets
Create pet

### PUT /api/admin/pets/{id}
Update pet

### DELETE /api/admin/pets/{id}
Delete pet

## Advertisement Management

**Permissions**: Admin only

### GET /api/admin/advertisements
List advertisements

**Query Parameters**: Standard pagination and filtering
- `sort`: `id`, `name`, `type`, `location`, `order`, `is_active`, `created_at`, `updated_at`
- `filter[name]`: Filter by name
- `filter[type]`: Filter by type
- `filter[location]`: Filter by location
- `filter[position]`: Filter by position
- `filter[is_active]`: Filter by active status (0/1)

### GET /api/admin/advertisements/{id}
Get advertisement details

### POST /api/admin/advertisements
Create advertisement

### PUT /api/admin/advertisements/{id}
Update advertisement

### DELETE /api/admin/advertisements/{id}
Delete advertisement

## Static/System Management

### GET /api/admin/statics/basic
Get basic statistics

**Response**:
```json
{
  "success": true,
  "data": {
    "total_users": 1000,
    "total_mangas": 500,
    "total_chapters": 5000
  }
}
```

### GET /api/admin/statics/announcement
Get site announcement

**Response**:
```json
{
  "success": true,
  "data": {
    "html": "<p>Site announcement content</p>"
  }
}
```

### POST /api/admin/statics/announcement
Update site announcement

**Permissions**: Admin only

**Request**:
```json
{
  "html": "<p>Updated announcement</p>"
}
```

## Chapter Reports Management

**Permissions**: Admin only

### GET /api/admin/chapter-reports
List all chapter reports

**Query Parameters**: Standard pagination and filtering
- `sort`: `created_at`, `updated_at`, `report_type`
- `filter[id]`: Filter by report ID
- `filter[report_type]`: Filter by report type
  - Values: `broken_images`, `missing_images`, `wrong_order`, `wrong_chapter`, `duplicate`, `other`
- `filter[chapter_id]`: Filter by chapter ID
- `filter[manga_id]`: Filter by manga ID
- `filter[user_id]`: Filter by user ID who reported
- `include`: `user`, `chapter`, `manga`

**Response**:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid-report",
        "user_id": "uuid-user",
        "chapter_id": "uuid-chapter",
        "manga_id": "uuid-manga",
        "report_type": "broken_images",
        "report_type_label": "Ảnh bị lỗi/không load được",
        "description": "Ảnh từ trang 5-10 không load được",
        "created_at": "2025-10-12T10:30:00.000000Z",
        "updated_at": "2025-10-12T10:30:00.000000Z",
        "user": {
          "id": "uuid-user",
          "name": "User Name",
          "email": "user@example.com",
          "avatar_full_url": "https://..."
        },
        "chapter": {
          "id": "uuid-chapter",
          "name": "Chapter 1",
          "slug": "chapter-1",
          "order": 1,
          "views": 1500,
          "created_at": "2025-10-10T08:00:00.000000Z"
        },
        "manga": {
          "id": "uuid-manga",
          "name": "Manga Name",
          "slug": "manga-slug",
          "cover_full_url": "https://..."
        }
      }
    ],
    "meta": {
      "current_page": 1,
      "from": 1,
      "to": 20,
      "total": 150,
      "per_page": 20,
      "last_page": 8
    }
  }
}
```

### GET /api/admin/chapter-reports/{id}
Get details of a specific chapter report

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid-report",
    "user_id": "uuid-user",
    "chapter_id": "uuid-chapter",
    "manga_id": "uuid-manga",
    "report_type": "broken_images",
    "report_type_label": "Ảnh bị lỗi/không load được",
    "description": "Ảnh từ trang 5-10 không load được",
    "created_at": "2025-10-12T10:30:00.000000Z",
    "updated_at": "2025-10-12T10:30:00.000000Z"
  }
}
```

### DELETE /api/admin/chapter-reports/{id}
Delete a specific chapter report

**Response**: `204 No Content`

### DELETE /api/admin/chapter-reports/bulk-delete
Bulk delete multiple chapter reports

**Request**:
```json
{
  "ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

**Validation Rules**:
- `ids`: required, array
- `ids.*`: required, uuid, exists in chapter_reports table

**Response**:
```json
{
  "success": true,
  "data": {
    "deleted_count": 3,
    "message": "Đã xóa 3 báo cáo"
  }
}
```

### GET /api/admin/chapter-reports/statistics
Get statistics about chapter reports

**Response**:
```json
{
  "success": true,
  "data": {
    "total": 150,
    "by_type": {
      "broken_images": 60,
      "missing_images": 35,
      "wrong_order": 25,
      "wrong_chapter": 15,
      "duplicate": 10,
      "other": 5
    },
    "recent_reports": 15,
    "today_reports": 5,
    "top_reported_chapters": [
      {
        "chapter": {
          "id": "uuid-chapter",
          "name": "Chapter 1",
          "slug": "chapter-1"
        },
        "manga": {
          "id": "uuid-manga",
          "name": "Manga Name",
          "slug": "manga-slug"
        },
        "report_count": 12
      }
    ],
    "top_reporters": [
      {
        "user": {
          "id": "uuid-user",
          "name": "User Name",
          "email": "user@example.com"
        },
        "report_count": 8
      }
    ]
  }
}
```

**Report Types**:
- `broken_images`: Ảnh bị lỗi/không load được
- `missing_images`: Thiếu ảnh
- `wrong_order`: Sai thứ tự ảnh
- `wrong_chapter`: Sai chapter/nhầm chapter
- `duplicate`: Chapter trùng lặp
- `other`: Lỗi khác

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthenticated",
  "code": 401
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied",
  "code": 403
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found",
  "code": 404
}
```

### 422 Validation Error
```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."]
  },
  "code": 422
}
```