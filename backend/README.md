# FinCortex Backend

FastAPI-based backend for AI-powered corporate reimbursement management system.

## Quick Start (PowerShell)

```bash
cd backend
./scripts/start-dev.ps1
```

This will:
- Create `.env` from `env_template.txt` if missing
- Install dependencies from `requirements*.txt`
- Run FastAPI with auto-reload on `http://localhost:8000`

## How Backend Works

- **FastAPI application** serves REST API endpoints at `/api/v1/*`
- **Supabase** used as database and file storage backend
- **Google Vision API** extracts text from receipt images (OCR)
- **OpenAI GPT** structures OCR text into JSON format
- **Receipt processing flow**: Upload image → OCR extraction → GPT structuring → Database storage
- **Reimbursement creation**: Validates data, creates vendor if needed, stores receipt file, inserts records

## Directory Structure

- **`app/api/`** - API route handlers and endpoint definitions
  - `routes/` - Individual route modules (receipt, rpc, receipt_code)
  - `v1/` - API version 1 router aggregation
- **`app/config/`** - Application configuration and settings
  - `settings.py` - Environment variables and API keys
  - `database.py` - Database connection setup
- **`app/core/`** - Core utilities (security, exceptions, dependencies)
- **`app/services/`** - Business logic services
  - `reimbursement_service.py` - Creates reimbursements and related records
  - `receipt_processing_service.py` - Orchestrates OCR and GPT processing
  - `storage_service.py` - Handles file uploads to Supabase Storage
  - `vision_service.py` - Google Vision API integration
  - `gpt_service.py` - OpenAI GPT integration
  - `supabase_service.py` - Supabase client singleton
- **`app/models/`** - Database model definitions
- **`app/repositories/`** - Data access layer
- **`app/schemas/`** - Pydantic validation schemas
- **`app/middleware/`** - Request/response middleware (CORS, auth, logging, rate limiting)
- **`app/migrations/`** - Database migration scripts
- **`app/tests/`** - Unit and integration tests

## API Endpoints

### Health Check
- **GET** `/api/v1/health` - Returns server status

### Receipt Processing
- **POST** `/api/v1/receipt/upload`
  - **Arguments**: `file` (image file)
  - **Purpose**: Upload receipt image, extract text via OCR, structure with GPT
  - **Returns**: Raw OCR text and structured JSON data

- **POST** `/api/v1/reimbursements`
  - **Arguments** (Form data):
    - `receipt_code` (required) - Unique receipt identifier
    - `user_id` (required) - UUID of submitting user
    - `vendor_name` (required) - Vendor name
    - `expense_date` (required) - Date in YYYY-MM-DD format
    - `category_id` (required) - Expense category ID
    - `receipt_type_id` (required) - Receipt type ID
    - `vendor_type` (required) - Vendor type/category
    - `amount_claimed` (required) - Total amount as string
    - `subcategory_id` (optional) - Expense subcategory ID
    - `invoice_number` (optional) - Original invoice number
    - `address` (optional) - Vendor address
    - `description` (optional) - Expense description
    - `items` (required) - JSON string array of items `[{"item": "name", "price": "10.00", "quantity": "1"}]`
    - `ocr_raw_text` (optional) - Raw OCR extracted text
    - `ocr_structured` (optional) - Structured OCR JSON string
    - `receipt_file` (required) - Receipt image file
  - **Purpose**: Create reimbursement record, upload file to storage, create vendor if needed, insert items and attachments
  - **Returns**: Reimbursement ID, receipt code, and attachment URL

### RPC Endpoints
- **GET** `/api/v1/rpc/column-data` - Get column data as JSON
  - **Arguments**: `table_name`, `column_name` (query params)
- **GET** `/api/v1/rpc/column-values` - Get distinct column values
  - **Arguments**: `table_name`, `column_name` (query params)

### Receipt Code
- **GET** `/api/v1/receipt-code/generate` - Generate unique receipt code

## Migrations

```bash
cd backend
./scripts/migrate.ps1 -message "init"
```

## Health Check

Open `http://localhost:8000/api/v1/health` to verify server is running.
