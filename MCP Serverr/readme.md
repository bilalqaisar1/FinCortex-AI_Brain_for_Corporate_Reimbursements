# MCP Reimbursement Server

A powerful **Model Context Protocol (MCP)** server for handling employee reimbursement workflows with AI-powered receipt processing, RAG-based chatbot, and intelligent data extraction capabilities.

## 🚀 Features

### Core Capabilities
- **🧾 Receipt Processing:** Automated text extraction from receipt images using Google Vision API
- **🤖 AI-Powered Data Extraction:** Structured data extraction using OpenAI GPT-4o-mini
- **💬 RAG Chatbot:** Intelligent conversational assistant for reimbursement queries with database access
- **📊 Reimbursement Management:** Complete CRUD operations for reimbursement requests
- **🔍 Natural Language to SQL:** Convert user queries into SQL for database insights
- **📈 Analytics & Statistics:** Get comprehensive reimbursement statistics and breakdowns

### AI Services
1. **Vision Service** - Google Cloud Vision API integration with fallback mock service
2. **OpenAI Service** - Receipt field extraction, natural language processing, and SQL generation
3. **RAG Service** - Retrieval-augmented generation for context-aware responses
4. **Supabase Service** - Database operations and reimbursement management

## 📁 Project Structure

```
MCP-Server/
├── config/                  # Configuration settings
│   └── settings.py         # Application settings and environment variables
├── core/                   # Core database setup
│   └── database.py        # SQLAlchemy database configuration
├── models/                 # Data models
│   ├── database_models.py # SQLAlchemy ORM models
│   └── schemas.py         # Pydantic schemas for validation
├── routers/                # API route handlers
│   ├── ocr.py             # Receipt OCR endpoints
│   ├── openai_processor.py # OpenAI processing endpoints
│   ├── rag_chatbot.py     # RAG chatbot endpoints
│   └── reimbursement_tools.py # Reimbursement CRUD endpoints
├── services/               # Business logic services
│   ├── vision_service.py   # Google Vision API service
│   ├── openai_service.py   # OpenAI API service
│   ├── rag_service.py      # RAG chatbot service
│   └── supabase_service.py # Database operations service
├── tools/                  # MCP tools definitions
│   └── mcp_tools.py       # MCP tool specifications
├── utils/                  # Utility functions
│   └── helpers.py         # Helper functions
├── main.py                # MCP client for testing
├── server.py              # FastAPI server application
└── requirements.txt       # Python dependencies
```

## 🛠️ Installation

### Prerequisites
- Python 3.12+
- Google Cloud Vision API credentials (optional - uses mock service if not configured)
- OpenAI API key
- Supabase account (optional - can use SQLite)

### Setup

1. **Clone the repository:**
```bash
cd /path/to/MCP-Server
```

2. **Create and activate virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables:**
Create a `.env` file in the root directory with the following variables:

```env
# OpenAI Configuration (Required)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# Supabase Configuration (Optional - uses SQLite by default)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key

# Google Vision API (Optional - uses mock service if not configured)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/credentials.json
GOOGLE_VISION_API_KEY=your_google_vision_api_key

# Server Configuration
MCP_SERVER_HOST=0.0.0.0
MCP_SERVER_PORT=8000
API_PREFIX=/api/v1

# Database
DATABASE_URL=sqlite:///./reimbursement.db

# Storage
RECEIPTS_BUCKET=receipts-bucket
RECEIPTS_FOLDER=receipts
```

## 🚦 Usage

### Starting the Server

Run the FastAPI server:

```bash
python server.py
```

The server will start on `http://localhost:8000`

**API Documentation:** Access interactive API docs at `http://localhost:8000/docs`

### Using the MCP Client

The `main.py` file provides a Python client for interacting with the MCP server:

```python
from main import MCPReimbursementClient

# Initialize client
client = MCPReimbursementClient()

# Check server health
health = client.get_health()

# Process a receipt
result = client.process_receipt_end_to_end(
    image_path="path/to/receipt.jpg",
    user_id="user_123"
)

# Chat with RAG assistant
response = client.chat_with_rag(
    user_id="user_123",
    message="What are my total reimbursements this month?"
)

# Get reimbursement statistics
stats = client.get_reimbursement_stats(user_id="user_123")
```

## 📡 API Endpoints

### Health & Info
- `GET /` - Server information
- `GET /health` - Health check endpoint
- `GET /tools` - List all available MCP tools

### OCR Endpoints (`/api/v1/ocr`)
- `POST /process-receipt` - Extract text from receipt image
- `POST /process-receipt-end-to-end` - Complete receipt processing (OCR + AI extraction)
- `POST /analyze-receipt-structure` - Analyze receipt document structure
- `GET /vision-status` - Check Google Vision API status

### OpenAI Processing (`/api/v1/openai`)
- `POST /extract-receipt-fields` - Extract structured data from receipt text

### RAG Chatbot (`/api/v1/rag`)
- `POST /chat` - Chat with the AI assistant
- `POST /reset-conversation` - Reset conversation history

### Reimbursement Tools (`/api/v1/tools`)
- `GET /user-reimbursements` - Get user's reimbursements (with optional status filter)
- `GET /reimbursement-stats` - Get reimbursement statistics
- `POST /submit-reimbursement` - Submit a new reimbursement request

## 🧰 Available MCP Tools

The server provides the following MCP tools:

1. **process_receipt** - Process receipt images and extract text
2. **process_receipt_end_to_end** - Complete receipt processing pipeline
3. **extract_receipt_fields** - Extract structured fields from receipt text
4. **chat_with_rag** - Conversational AI for reimbursement queries
5. **get_user_reimbursements** - Query user reimbursements
6. **get_reimbursement_stats** - Get statistical insights
7. **submit_reimbursement** - Submit new reimbursement requests

## 📊 Database Models

### User
- `id` (String, Primary Key)
- `email` (String, Unique)
- `full_name` (String)
- `created_at` (DateTime)

### Reimbursement
- `id` (Integer, Primary Key)
- `user_id` (String)
- `merchant_name` (String)
- `transaction_date` (DateTime)
- `total_amount` (Float)
- `tax_amount` (Float)
- `currency` (String, default: "USD")
- `purpose` (Text)
- `project_code` (String)
- `status` (String, default: "pending")
- `items` (JSON)
- `created_at` / `updated_at` (DateTime)

### Conversation
- `id` (Integer, Primary Key)
- `user_id` (String)
- `conversation_id` (String)
- `message` / `response` (Text)
- `timestamp` (DateTime)

## 🎯 Key Features Explained

### Receipt Processing Pipeline

1. **Image Upload** - Users upload receipt images (base64 encoded)
2. **OCR Processing** - Google Vision API extracts text (or mock service if not configured)
3. **AI Extraction** - OpenAI analyzes text and extracts structured data:
   - Vendor name
   - Transaction date and time
   - Individual line items with quantities and prices
   - Total amount and tax
   - Category classification
4. **Data Storage** - Structured data stored in database for future queries

### RAG Chatbot

The chatbot combines:
- **Database Context** - Retrieves relevant reimbursement data
- **Natural Language Understanding** - Interprets user queries
- **SQL Generation** - Converts questions to SQL queries
- **Conversational Memory** - Maintains conversation history
- **Intelligent Responses** - Generates contextual answers

**Example Queries:**
- "Show me all pending reimbursements"
- "What's my total spending this month?"
- "List all reimbursements from Amazon"
- "How many reimbursements are approved?"

### Natural Language to SQL

The system can:
1. Analyze natural language queries
2. Generate appropriate SQL queries
3. Execute queries safely
4. Format results into natural language responses

## 🔒 Security Considerations

- API keys stored in environment variables
- Database connections use parameterized queries
- CORS configured (currently allows all origins - configure for production)
- Service role keys for Supabase backend operations

## 🧪 Development

### Running in Development Mode

The server runs with auto-reload enabled by default:

```bash
python server.py
```

### Database Migrations

Database tables are automatically created on server startup using SQLAlchemy's `create_all()` method.

## 🔧 Configuration Options

All configuration is managed through `config/settings.py` using Pydantic Settings:

- **API Settings** - Project name, version, API prefix
- **External APIs** - OpenAI, Google Vision, Supabase credentials
- **Server Settings** - Host, port configuration
- **Storage Settings** - Receipt storage buckets and folders
- **Database** - SQLite by default, configurable to PostgreSQL/other

## 📦 Dependencies

Key dependencies:
- **FastAPI** - Modern web framework
- **OpenAI** - AI-powered data extraction
- **Google Cloud Vision** - OCR processing
- **Supabase** - Database and storage
- **LangChain** - RAG implementation
- **SQLAlchemy** - ORM and database management
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

See `requirements.txt` for complete list.

## 🤝 Integration Examples

### Example: Submit a Reimbursement

```python
from main import MCPReimbursementClient

client = MCPReimbursementClient()

# Process receipt image
ocr_result = client.process_receipt_end_to_end(
    image_path="receipt.jpg",
    user_id="emp_001"
)

# Submit reimbursement
if ocr_result['success']:
    receipt_data = ocr_result['data']['structured_data']
    
    submission = client.submit_reimbursement(
        user_id="emp_001",
        receipt_data=receipt_data,
        purpose="Client dinner meeting"
    )
    
    print(f"Submitted: {submission}")
```

### Example: Query Reimbursements via Chat

```python
# Natural language query
response = client.chat_with_rag(
    user_id="emp_001",
    message="Show me all my approved reimbursements from last month"
)

print(response['response'])
```

## 📝 License

This project is part of a reimbursement management system.

## 🙋 Support

For issues or questions:
1. Check the API documentation at `/docs`
2. Review the `.env` configuration
3. Ensure all required API keys are configured
4. Check server logs for detailed error messages

## 🚀 Future Enhancements

Potential improvements:
- PDF receipt support
- Multi-language OCR
- Receipt categorization using ML
- Approval workflow automation
- Email notifications
- Mobile app integration
- Advanced analytics dashboard
- Bulk upload processing

---

**Version:** 1.0.0  
**Built with:** FastAPI, OpenAI, Google Cloud Vision, LangChain, SQLAlchemy
