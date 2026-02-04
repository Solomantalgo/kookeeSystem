# Kookee Backend API Documentation

## Sync Endpoints (Mobile App → Backend)
Used for batch data synchronization from the mobile app.

### 1. Sync Outlets
- **POST** `/api/sync/outlets`
- **Body**: `{ "outlets": [{ "name": "...", "location": "..." }] }`

### 2. Sync Products
- **POST** `/api/sync/products`
- **Body**: `{ "products": [{ "name": "...", "category": "..." }] }`

### 3. Sync Visits
- **POST** `/api/sync/visits`
- **Body**: `{ "visits": [{ "visit_id": "...", "outlet_name": "...", "merchandiser_id": "...", "visit_date": "...", "check_in_time": "...", "photo_proof_url": "...", "status": "..." }] }`

### 4. Sync Reports
- **POST** `/api/sync/reports`
- **Body**: `{ "reports": [{ "report_id": "...", "visit_id": "...", "outlet_id": "...", "merchandiser_id": "...", "submitted_at": "...", "quick_visit": false, "products": [{ "product_name": "...", "quantity": 10 }] }] }`

---

## Admin Dashboard Endpoints

### 1. List Merchandisers
- **GET** `/api/merchandisers`

### 2. Merchandiser Stats
- **GET** `/api/merchandisers/:id/stats?date=YYYY-MM-DD`

### 3. List Outlets
- **GET** `/api/outlets`

### 4. Outlet History
- **GET** `/api/outlets/:id/history`

### 5. Create Assignments
- **POST** `/api/assignments`
- **Body**: `{ "merchandiser_id": "...", "outlet_ids": ["..."], "assigned_date": "YYYY-MM-DD" }`

### 6. List Assignments
- **GET** `/api/assignments?date=YYYY-MM-DD`

### 7. Missing Assignments
- **GET** `/api/assignments/missing?date=YYYY-MM-DD`

### 8. List Reports
- **GET** `/api/reports?date=YYYY-MM-DD&outlet_id=XXX&merchandiser_id=XXX`

### 9. Report Detail
- **GET** `/api/reports/:id`

### 10. Dashboard Stats
- **GET** `/api/dashboard/merchandiser?date=YYYY-MM-DD`
