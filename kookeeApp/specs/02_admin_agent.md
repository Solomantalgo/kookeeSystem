# AGENT 2 DIRECTIVE: Admin Operations & Oversight Agent

## Role
You are responsible for the **Kookee Admin Mobile App** (React Native + Expo).
**Target Audience**: Admins / Ops Managers on the move.

---

## 🧭 GLOBAL NAVIGATION (Bottom Tabs)
Implement a Bottom Tab Navigator with NO sidebars:
1.  **Dashboard** (Home)
2.  **Reports** (List of submissions)
3.  **Alerts** (Missing reports & Exceptions)
4.  **Profile** (Settings & Logout)

---

## REQUIRED SCREENS & LOGIC

### 1. Dashboard Screen (Admin Home)
**Layout**: Vertical Cards (Scrollable).
- **Today Summary Card**:
    - `Reports Submitted` (Count)
    - `Expected Reports` (Assignment Count)
    - `Missing` (Count)
- **Alerts Card**:
    - `Missing Outlet Reports` (Count)
    - *(Note: OCR Alerts removed per instruction)*
- **Quick Stats Card**:
    - `Active Merchandisers`
    - `Outlets Visited Today`
- **Actions**:
    - Tap "Missing" -> Navigates to **Alerts Tab** (Filtered to Missing).

### 2. Reports List Screen
**Layout**: Scrollable Cards (NOT Tables).
- **Filters**: Date, Outlet, Status.
- **Card Content**:
    - Outlet Name
    - Merchandiser Name
    - Date
    - Status Flag (e.g., ✔ Verified, ⚠ Missing)
- **Action**: Tap Card -> View **Report Detail**.

### 3. Report Detail Screen
**Purpose**: "See Truth" & Verification.
- **Header**: Outlet, Merchandiser, Date, Auth Type (Biometric).
- **Items List**: simple list of `Item: Quantity`.
- **"View Original Sheet"**: Button to view the captured image (if applicable).
- **Actions**:
    - `[ ✔ VERIFY ]`: Marks report as trusted.
    - `[ ✏ EDIT ]`: Inline quantity correction.

### 4. Alerts Screen
**Purpose**: Handle exceptions.
- **Missing Report Card**:
    - Outlet Name
    - Expected Date
    - Action: "Copy WhatsApp Follow-up".

### 5. Profile / Settings Screen
- **Admin Identity**: Name & Role.
- **Settings**:
    - Toggle: "Require biometric on actions".
    - Notifications: ON/OFF.
- **Logout**: Securely clears token and stack.

---

## CRITICAL WORKFLOWS

### A. Assign Outlets (The "Assign" Logic)
- **Screen**: floating action button (FAB) on Dashboard or Nav Bar.
- **Inputs**: Date, Merchandiser, Multiple Outlets (Checkbox), Instructions.
- **WhatsApp Generator**:
    - MUST generate the **EXACT** text template for copy-pasting.
    - **Template**:
      ```text
      📍 DAILY OUTLET ASSIGNMENT – [DATE]
      Outlets:
      1. [Name]
      2. [Name]
      Notes: [Instructions]
      ```

### B. Admin Security
- **Unlock**: Device Verification (PIN/Biometric) on app open.
- **Data**: No storing sensitive biometric data; rely on OS.

---

## UI Design Rules (DO NOT BREAK)
- ✔ **Cards over Tables**: Tables are for desktop; use cards for mobile.
- ✔ **Fast & Minimial**: No heavy typing, no bulk ops.
- ✔ **One Primary Action**: Per screen.

keep the current login screen its okay 