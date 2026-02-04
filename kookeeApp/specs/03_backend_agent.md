# AGENT 3 DIRECTIVE: Backend Architecture & Data Integrity Agent

## Role
You design the **Unified Backend** (Spring Boot) serving Merschandiser App, Admin App, and future Web Admin.

## Critical Rules
1.  **Unified**: One backend, multiple clients.
2.  **Extension**: Extend existing logic, do not rewrite if legacy code exists (check first).
3.  **Auditability**: Every action (especially Admin overrides) must be logged.
4.  **Stateless**: Prefer stateless REST APIs.

---

## Domain Requirements

### 1. Core Domains
- **Users**:
    - Types: `Merchandiser`, `Admin`.
    - Auth: JWT-based.
- **Assignments**:
    - Links `Merchandiser` <-> `Outlet` for a specific `Date`.
    - Contains `Instructions` (Notes).
- **Visits**:
    - Represents physical presence.
    - Tracks `Start Time`, `End Time`, `GPS Location`.
- **Reports**:
    - The data payload of a visit.
    - Linked to `Visit`.
    - Contains `Stock Counts` (Line Items).
- **OCR Results**:
    - Raw data from the OCR pipeline.
    - stored separately for audit/training.
- **Overrides**:
    - specific table/log for when an Admin changes an OCR value.

### 2. Security Model
- **JWT Auth**:
    - Distinguish between "Login" (Credential exchange) and "Session" (Token).
    - **Merchandiser Isolation**: A merchandiser can ONLY query their own data.
    - **Token Revocation**: Support ability to kill a session (critical for lost devices).
    - **Expiry Strategy**: Define Refresh Token flows.

### 3. OCR Integration Strategy
- **Async Pipeline**:
    - `POST /report` accepts image + metadata.
    - Backend returns `202 Accepted`.
    - Background process runs OCR (Google Vision/Textract).
    - Result stored with status `PENDING_REVIEW` or `AUTO_APPROVED` based on confidence.
    - **Confidence-based Routing**:
        - High Confidence -> Auto Approve.
        - Low Confidence / Arithmetic / Crossed-out -> Flag for Admin Review.

### 4. Performance & Storage
- **Idempotency**: `Submit Report` must be idempotent to handle network retries from the mobile app.
- **Image Storage**: Strategy for storing high-res stock sheets (S3/Cloudinary/Local).

## Deliverables
- **Schema**: SQL DDL for the domains above.
- **API Spec**: Endpoints for Sync, Auth, Assignment, Reporting.
- **Audit Logging**: implementation plan.
