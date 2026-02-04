# AGENT 1 DIRECTIVE: Merchandiser App Systems Agent (FINAL REFINEMENT)

## Role
You are responsible for the **Kookee Merchandiser App** (React Native + Expo).

---

## 🛑 MANDATORY COMPLIANCE CHECKLIST

### 1. The Matrix Table (Fidelity & Layout)
- [ ] **Table Format**: MUST occupy the **FULL vertical and horizontal screen space**. Use `flex: 1` on all containers.
- [ ] **Logic**: Mirror legacy logic exactly. Categorized Matrix View (no staged lists).
- [ ] **Zero Highlighting**: Quantities of `0` MUST be **Red** and **Bold**.

### 2. Branding & Visual Identity
- [ ] **Name Persistence**: The primary application name remains "**Kookee**" (e.g., "Kookee Merchandiser").
- [ ] **Logo Badge Fix**: Change the specific small logo/badge (currently "**KOO**") to "**Kooksy**".
- [ ] **Branding Layout**: Use a creative stacked or compact layout for the "Kooksy" badge so it fits perfectly in the small logo square without crowding the header.
- [ ] **Status Bar**: Use `SafeAreaView` and style the Blue Header (`#1e40af`) to respect the notch and phone icons (battery/time).

### 3. Data Entry Refinements
- [ ] **Native Date Picker**: Provide a visual calendar/picker (e.g., `@react-native-community/datetimepicker`).
- [ ] **Outlet Search & Autocomplete**:
    - The Outlet Selection screen MUST include a **Search Bar**.
    - As the user types, the list should filter to show matching outlets.
- [ ] **Custom Outlet Persistence**: 
    - If no match is found, provide a "Add & Use: [Typed Name]" button.
    - **Permanent Storage**: Once a custom outlet is added, save it to `AsyncStorage`.
    - **Merge Logic**: On every subsequent app load, the app MUST merge the hardcoded `OUTLETS` list with the locally stored "Custom Outlets" so they appear in the search results permanently.

### 4. Navigation & Flow
- [ ] **Dashboard -> Reports**: On the Hub, clicking "View Reports" MUST correctly navigate to the Report Selection screen (with biometrics).
- [ ] **Signout**: MUST lead to the Login screen and **RESET the navigation stack** (user cannot back-navigate to Hub).
- [ ] **Bottom Tabs**: Implement for easy switching between Entry and History.

### 5. Logic: Save & Submit
- [ ] **Auto-Save**: Persist to `AsyncStorage` on every input change or checkbox toggle.
- [ ] **Submit Button**: Replaces "Save". Triggers Biometrics -> uploads to Server/DB.

---

## Deliverables
1. Corrected Navigation, Signout, and Biometric prompt points.
2. "Kooksy" branding in a stacked, professional header.
3. Native date picker and persistent custom outlet logic.
4. Full-screen bidirectional sticky matrix.
