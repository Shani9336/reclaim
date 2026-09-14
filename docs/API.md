# FoundIt API Documentation

FoundIt provides RESTful endpoints built using Next.js App Router API Routes, alongside the Python AI Matching Engine microservice.

---

## Base URL
- **Local:** `http://localhost:3000/api`
- **Production:** `https://foundit.app/api`

---

## Authentication
Authentication is handled via **NextAuth.js** sessions (JWT strategy).
- Session cookies (`next-auth.session-token`) are sent automatically with browser requests.
- For inter-service communication (Next.js to Matching Engine), requests use `X-API-Key: <MATCHING_SERVICE_API_KEY>`.

---

## Endpoints

### 1. Health & Status
#### `GET /api/health`
Checks database connectivity and matching service availability.

**Response `200 OK`:**
```json
{
  "status": "ok",
  "timestamp": "2024-09-15T00:00:00.000Z",
  "version": "0.1.0",
  "services": {
    "database": { "status": "ok", "latencyMs": 14 },
    "matcher": { "status": "ok" }
  }
}
```

---

### 2. Items

#### `GET /api/items`
Retrieves items with filtering, searching, and pagination.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | `""` | Searches title, description, tags, brand, location |
| `type` | string | `undefined` | Filter by `LOST` or `FOUND` |
| `category` | string | `undefined` | Filter by `ELECTRONICS`, `DOCUMENTS`, `WALLET`, `KEYS`, `BAGS`, `JEWELRY`, `CLOTHING`, `OTHER` |
| `status` | string | `undefined` | Filter by `OPEN`, `CLAIMED`, `VERIFIED`, `RETURNED`, `CLOSED` |
| `page` | integer | `1` | Page number |
| `limit` | integer | `12` | Results per page (max 50) |

**Response `200 OK`:**
```json
{
  "items": [
    {
      "id": "cm123abc...",
      "type": "LOST",
      "title": "Lost iPhone 15 Pro Max",
      "description": "Lost my black iPhone with dark blue case...",
      "category": "ELECTRONICS",
      "color": "Black",
      "brand": "Apple",
      "images": ["https://res.cloudinary.com/..."],
      "tags": ["iphone", "apple", "smartphone"],
      "status": "OPEN",
      "visibility": "PUBLIC",
      "reward": "₹2,000",
      "locationText": "DY Patil University Canteen",
      "dateLost": "2024-09-10T00:00:00.000Z",
      "createdAt": "2024-09-10T12:30:00.000Z",
      "user": { "id": "usr_1", "name": "Alice Kumar", "image": "..." },
      "space": { "id": "spc_1", "name": "DY Patil University" }
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 12,
    "totalPages": 4
  }
}
```

#### `POST /api/items`
Creates a new lost or found item. Rate-limited to 10 items/hour.
Automatically triggers background AI matching against counterpart items.

**Headers:** `Content-Type: application/json`

**Request Body (Lost Item):**
```json
{
  "type": "LOST",
  "title": "Lost Blue Backpack",
  "description": "Wildcraft backpack left in lecture hall B with notes inside.",
  "category": "BAGS",
  "color": "Blue",
  "brand": "Wildcraft",
  "locationText": "DY Patil University Lecture Hall Block B",
  "dateLost": "2024-09-14",
  "distinctiveFeatures": "Red zipper pull with initials CS",
  "reward": "₹500",
  "images": ["https://res.cloudinary.com/..."],
  "tags": ["wildcraft", "backpack", "blue"]
}
```

#### `GET /api/items/:id`
Retrieves full details of a specific item, including top AI matches. Contact information is masked unless the viewer is the owner, an admin, or an approved claimant.

#### `PATCH /api/items/:id`
Updates item details or status (`OPEN`, `CLAIMED`, `RETURNED`, etc.). Only authorized for the item owner or admin.

#### `DELETE /api/items/:id`
Removes an item. Only authorized for the item owner or admin.

---

### 3. Claims

#### `GET /api/claims`
Lists claims. Regular users see their own submitted claims; admins see all claims.

#### `POST /api/claims`
Submits an ownership claim on an item with verification proof. Rate-limited to 3/hour.

**Request Body:**
```json
{
  "itemId": "cm123abc...",
  "description": "This is my watch. It has a tiny scratch on the bezel at the 3 o'clock mark and the wallpaper shows my initials.",
  "proofText": "Serial Number: SM-R900-123456",
  "proofImages": ["https://res.cloudinary.com/..."]
}
```

#### `PATCH /api/claims`
Admin review endpoint. Approves or rejects a claim, updates item status to `CLAIMED`, and sends automated notification emails via Resend.

**Request Body:**
```json
{
  "claimId": "clm_123...",
  "status": "APPROVED",
  "adminNote": "Proof verified via serial number and invoice match."
}
```

---

### 4. Notifications

#### `GET /api/notifications`
Returns in-app notifications for the logged-in user and total unread count.

**Query Parameters:**
- `unread=true`: Returns unread notifications only.

#### `PATCH /api/notifications`
Marks specific notifications or all notifications as read.

**Request Body:**
```json
{
  "markAll": true
}
```
or
```json
{
  "ids": ["notif_1", "notif_2"]
}
```

---

## Python Matching Engine API

Runs on port `8000`. Full OpenAPI interactive documentation is available at `http://localhost:8000/docs`.

### `GET /health`
Returns model loading status and model architecture name.

### `POST /match`
Accepts `lost_item` and candidate `found_items` (up to 200 items). Computes weighted composite scoring:
- Text Semantic Cosine Similarity (50%)
- Category Match (20%)
- Color Fuzzy Match (15%)
- Temporal Proximity (15%)

Returns top-K results sorted by score descending, with detailed reasoning per dimension.
