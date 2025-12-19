# Technical Documentation: Application Execution Flow

This document details the exact technical execution flow of the FinCortex Full-Stack Application, covering Frontend, Backend API, Database interactions, and AI Services.

---

## 1. Authentication Flow

**Goal:** Securely log in a user, verify credentials against the database, and establish a session.

### **Execution Flow**
1.  **Frontend Trigger**:
    *   **File**: `fin-cortex/src/context/AuthContext.tsx`
    *   **Action**: User invokes `loginWithRPC(email, password, role)`.
    *   **Fallback**: It first attempts a standard Supabase `auth.signIn(email, password)`. If successful, it loads the profile. If not found in Auth but exists in DB (legacy/migrated users), it proceeds to step 2.

2.  **API Call**:
    *   **Frontend**: `fetch('/api/v1/auth/check-login-credential', ...)`
    *   **Payload**: `{ email, password, employee_code? }`

3.  **Backend Processing (Next.js API Route)**:
    *   **File**: `fin-cortex/src/app/api/v1/auth/check-login-credential/route.ts`
    *   **Logic**:
        *   Initializes `supabaseAdmin` client.
        *   Calls Supabase RPC function `check_user_credentials` via `supabaseAdmin.rpc()`.
    *   **Database**: Executes `check_user_credentials` (PostgreSQL function).
        *   Verifies email/password hash.
        *   Returns user details (`useruuid`, `role`, `name`, etc.).

4.  **Backend Response**:
    *   Returns JSON: `{ success: true, data: { useruuid, role, name, ... } }`.

5.  **Frontend Handling**:
    *   **File**: `AuthContext.tsx`
    *   **Action**:
        *   Receives `useruuid` and `role`.
        *   Calls internal helper `loadUserProfile(user)` to sync and store the full profile in React state (`userProfile`).
        *   This creates a "session-like" state for the application logic, even if the primary authentication source was the custom RPC check.

---

## 2. Role Determination

**Goal:** Identify if the user is a User, Manager, or Admin and enforce permissions.

### **Execution Flow**
1.  **Database Storage**:
    *   Roles are stored in the specific tables (`users`, `managers`, `admins`) or a unified `user_roles` configuration depending on the schema version.
    *   The `check_user_credentials` RPC function strictly returns the role associated with the credentials provided.

2.  **Backend Determination**:
    *   Upon login via `check-login-credential`, the Postgres function explicitly checks the `role` column or associated role table and returns it in the API response (`data.role`).

3.  **Frontend Retrieval & Storage**:
    *   **File**: `fin-cortex/src/context/AuthContext.tsx`
    *   **Logic**: The `loadUserProfile` function takes the role returned from the backend (or 'user' as default) and sets it in the `userProfile` object:
        ```typescript
        setUserProfile({
           ...profileData,
           userRole: profileData.userRole || role || 'user'
        });
        ```
    *   This `userProfile.userRole` is the single source of truth for the frontend session.

---

## 3. Role-Based Navigation (Dashboard Buttons)

**Goal:** Direct users to their specific dashboard (`/user`, `/manager`, `/admin`) based on their role.

### **Execution Flow**
1.  **Frontend Protection Component**:
    *   **File**: `fin-cortex/src/app/components/auth/RouteProtection.tsx`
    *   **Usage**: Wraps protected pages (e.g., `UsersPage`, `ReimbursementsPage`).

2.  **Logic Check**:
    *   Reads `userProfile.userRole` from `AuthContext`.
    *   Checks if `userRole` exists in the `allowedRoles` prop passed to the component.
    *   **If Unauthorized**: Automatically redirects:
        *   `admin` -> `/admin`
        *   `manager` -> `/manager`
        *   `user` -> `/user/dashboard`

3.  **Conditional Rendering**:
    *   **File**: Note specifically `ManagerLayout` (`fin-cortex/src/components/dashboard/ManagerLayout.tsx`) or Navbar components.
    *   These components check `userProfile.userRole` to show/hide specific sidebar links (e.g., "Team Members" is only visible to Managers).

---

## 4. Submit Claim (User Flow)

**Goal:** Process a receipt image, extract data using AI, and confirm details before submission.

### **Step 1: Image Upload & OCR**
*   **Frontend File**: `fin-cortex/src/app/components/forms/ExpenseForm.tsx`
*   **User Action**: Uploads an image.
*   **API Call**: `POST /api/v1/receipt/upload` (to Python Backend).
    *   **Payload**: `Multipart Form Data` (file, `admin_uuid`).
*   **Backend Route**: `backend/app/api/routes/receipt.py` -> `upload_receipt` function.
*   **Service**: `backend/app/services/vision_service.py`
    *   **Logic**: Encodes image to Base64, calls **Google Vision API** (`TEXT_DETECTION`).
    *   **Result**: Returns raw string text of the receipt.

### **Step 2: AI Parsing (GPT)**
*   **Called By**: `upload_receipt` in `receipt.py` immediately after OCR.
*   **Service**: `backend/app/services/gpt_service.py` -> `structure_text_with_openai`.
*   **Logic**:
    1.  Fetches allowed Categories/Subcategories from DB (via RPC `get_expense_categories_with_subcategories`) using `admin_uuid` to ensure compliance.
    2.  Constructs a Prompt for **GPT-4o (or configured model)** containing:
        *   The Raw OCR Text.
        *   The list of allowed Categories.
        *   Instructions to return strictly valid JSON.
*   **GPT Response**:
    *   Determines **Category** (e.g., "Food") and **Sub-category** (e.g., "Team Lunch").
    *   Extracts Vendor, Date, Total, Items.
*   **Backend Response**: Returns JSON `{ success: true, data: { raw_text: "...", structured: { ...JSON } } }` to frontend.

---

## 5. Auto-Fill Form Logic

**Goal:** Populate the form with AI-extracted data.

### **Execution Flow**
1.  **Frontend State Update**:
    *   **File**: `fin-cortex/src/app/components/forms/ExpenseForm.tsx`
    *   **Logic**: The `useEffect` hook watches for changes in `ocrData` (response from Step 4).
    *   **Mapping**:
        ```typescript
        setFormData((prev) => ({
            ...prev,
            vendorName: ocrData["Vendor Name"],
            date: parseDate(ocrData.Date),
            totalAmount: parseAmount(ocrData["Total Amount"]),
            // ... maps items and address
        }));
        ```
2.  **User Review**:
    *   The form fields are now populated. The user can manually edit any field if the AI made a mistake.
    *   `detectedCategory` and `detectedSubcategory` are shown as read-only hints.

---

## 6. Form Submission to Database

**Goal:** Save the final verified claim to the database.

### **Execution Flow**
1.  **Frontend Submit**:
    *   **File**: `ExpenseForm.tsx` -> `handleSubmit`.
    *   **API Call**: `POST {BACKEND_URL}/api/v1/reimbursements`.
    *   **Payload**: `FormData` containing:
        *   `file` (Receipt Image)
        *   `items` (JSON string of line items)
        *   `ocr_structured` (JSON string of AI results)
        *   Form fields (amount, vendor, category_ids, etc.)

2.  **Backend Processing**:
    *   **Route**: `backend/app/api/routes/receipt.py` -> `create_reimbursement_endpoint`.
    *   **Validation**: Parses `items` JSON, validates UUIDs (`user_id`, `admin_id`).
    *   **Category Resolution**: If frontend didn't provide specific IDs, backend attempts to match the GPT-extracted category names to DB IDs again to be safe.

3.  **Database Services**:
    *   **File**: `backend/app/services/reimbursement_service.py`
    *   **Upload**: Saves image to **Supabase Storage** bucket (`users/{user_id}/{filename}`).
    *   **Insert**: Calls `create_reimbursement` function.
        *   Inserts into `reimbursements` table.
        *   Inserts into `reimbursement_items` table.
        *   Inserts into `attachments` table (linking the image).

4.  **Response**:
    *   Returns `{ success: true, data: { reimbursement_id: ... } }`.
    *   Frontend redirects user to Dashboard on success.

---

## 7. User List in Manager Dashboard

**Goal:** Manager views their team members.

### **Execution Flow**
1.  **Frontend Component**:
    *   **File**: `fin-cortex/src/app/manager/users/page.tsx`
    *   **API Client**: `fin-cortex/src/app/api/v1/manager/fetch-user/users.ts`.

2.  **API Call**:
    *   **Endpoint**: `GET {BACKEND_URL}/api/v1/rpc/users-by-manager?manager_id=...`
    *   **File**: `backend/app/api/routes/rpc.py`.

3.  **Backend Logic**:
    *   Calls Supabase PRC function `get_users_by_manager(p_manager_id)`.
    *   **Query**: Selects users where `manager_id` matches the request.
    *   **Returns**: List of users with status, department, and contact info.

4.  **Display**:
    *   React state `teamMembers` is updated.
    *   User list is rendered in a `<Card>` list view.

---

## 8. Reimbursement Data in Manager Dashboard

**Goal:** Manager views list of claims needing approval.

### **Execution Flow**
1.  **Frontend Component**:
    *   **File**: `fin-cortex/src/app/manager/reimbursements/page.tsx`
    *   **API Client**: `fin-cortex/src/app/api/v1/manager/fetch-reimbursements/reimbursements.ts`.

2.  **API Call**:
    *   **Endpoint**: `GET {BACKEND_URL}/api/v1/rpc/reimbursements-by-manager?manager_id=...`

3.  **Backend Logic**:
    *   **File**: `backend/app/api/routes/rpc.py` (Generic RPC handler usually maps to specific services).
    *   **DB Function**: Calls `get_reimbursements_by_manager`.
    *   **Aggregation**: Joins `reimbursements` with `users` to show "Who spent what".

4.  **Display**:
    *   Renders a table/list of reimbursements showing Status (Pending/Approved), Amount, and Vendor.

---

## 9. Receipt Image on Manager Dashboard

**Goal:** Manager views the proof of expense (receipt image).

### **Execution Flow**
1.  **Navigation**:
    *   Manager clicks "View Details" on a reimbursement item.
    *   Navigates to: `fin-cortex/src/app/manager/reimbursements/[reimbursementId]/page.tsx`.

2.  **Data Fetching**:
    *   Fetches detailed record including `attachments` array.

3.  **Image Rendering**:
    *   **File**: `fin-cortex/src/app/manager/reimbursements/[reimbursementId]/page.tsx`
    *   **Logic**:
        ```typescript
        const getImageUrl = (filePath: string) => {
            return `https://dczlyrrkjnxbmqkbgtgz.supabase.co/storage/v1/object/public/receipts-bucket/${filePath}`;
        };
        ```
    *   The component iterates through `detail.attachments`.
    *   Uses the `<Image>` component to render the URL generated above.
    *   Clicking the thumbnail opens a `<Dialog>` modal with the full-size image.
