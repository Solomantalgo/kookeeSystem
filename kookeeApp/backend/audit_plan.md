# Audit Logging Implementation Plan

## 1. Goal
Ensure every critical state change (CREATE, UPDATE, DELETE) is logged with `Who`, `What`, `When`, and `Why` (if applicable).
**Focus**: Admin overrides on OCR data must be strictly tracked.

## 2. Database Schema
Ref: `backend/schema.sql` -> `audit_logs` table.
- `actor_id`: User performing the action.
- `action`: E.g., `APPROVE_REPORT`, `EDIT_STOCK`.
- `entity_type`: `REPORT`, `ASSIGNMENT`.
- `entity_id`: UUID of the modified record.
- `old_value`: JSON snapshot BEFORE change.
- `new_value`: JSON snapshot AFTER change.

## 3. Technical Strategy: Spring AOP + Custom Annotation
We will avoid polluting service methods with `auditRepository.save(...)` calls. Instead, we use a custom annotation `@Auditable`.

### 3.1 The Annotation
```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Auditable {
    String action(); // e.g., "UPDATE_REPORT"
    String entityType(); // e.g., "REPORT"
}
```

### 3.2 The Aspect (`AuditAspect.java`)
**Logic**:
1.  **Around Advice** (`@Around("@annotation(auditable)")`):
2.  **Before Execution**:
    - If `action` is update/delete, fetch the *existing* entity from DB (using generic repository or service).
    - Store as `oldVal`.
3.  **Execute Method**: `joinPoint.proceed()`.
4.  **After Execution**:
    - Capture the return value (the updated entity) as `newVal`.
    - Get `currentUser` from `SecurityContextHolder`.
    - Asynchronously save to `audit_logs`.

### 3.3 Handling Diffing
- Use a library like `Javers` or highly targeted JSON diffing (Jackson) to store only changed fields if full object is too large.
- For `reports`, strictly store the full JSON of `report_items` to trace stock count changes.

## 4. Critical Audit Scenarios
| Scenario | Action Name | Criticality | Notes |
| :--- | :--- | :--- | :--- |
| Admin edits a stock count | `UPDATE_REPORT_ITEMS` | **HIGH** | Must capture `old_value` (original OCR) vs `new_value`. |
| Admin rejects a report | `REJECT_REPORT` | MEDIUM | Capture reason in metadata. |
| Admin assigns a route | `CREATE_ASSIGNMENT` | MEDIUM | Track WHO assigned it. |
| Admin logs in | `LOGIN` | LOW | Standard security log. |

## 5. Security & immutability
- `audit_logs` table should be APPEND ONLY.
- DB user for the app should NOT have `DELETE` or `UPDATE` permission on `audit_logs` table if possible (enforced by DB permissions).
