import logging
import os
import base64
import tempfile
from typing import Optional, Dict, Any
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import HttpResponseError

from config.settings import settings

logger = logging.getLogger(__name__)

class AzureService:
    def __init__(self):
        self.endpoint = settings.AZURE_ENDPOINT
        self.key = settings.AZURE_KEY
        self.azure_available = bool(self.endpoint and self.key)
    
    def extract_text_from_receipt(self, image_content: str) -> Dict[str, Any]:
        """
        Extract text from a document using Azure Document Intelligence (prebuilt-layout model).
        
        Args:
            image_content: Base64 encoded image content
        
        Returns:
            Dictionary with success status, extracted text, and raw response
        """
        if not self.azure_available:
            return {
                "success": False, 
                "error": "Azure credentials not configured (AZURE_ENDPOINT or AZURE_KEY missing)."
            }

        try:
            # Decode base64 to a temporary file
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as temp_file:
                temp_file.write(base64.b64decode(image_content))
                temp_path = temp_file.name

            logger.info(f"📄 Azure OCR: Analyzing document...")

            # Create client
            client = DocumentIntelligenceClient(
                endpoint=self.endpoint,
                credential=AzureKeyCredential(self.key)
            )

            with open(temp_path, "rb") as f:
                poller = client.begin_analyze_document(
                    model_id="prebuilt-layout",
                    body=f
                )
            
            result = poller.result()
            
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)

            logger.info("✅ Azure OCR: Text extraction complete")

            # Compile extracted text
            full_text = []

            # 1. Add page text
            for page in result.pages:
                for line in page.lines:
                    full_text.append(line.content)
            
            # 2. Add table data
            tables_data = []
            if result.tables:
                full_text.append("\n--- EXTRACTED TABLES ---\n")
                for table in result.tables:
                    rows = {}
                    for cell in table.cells:
                        rows.setdefault(cell.row_index, {})
                        rows[cell.row_index][cell.column_index] = cell.content

                    table_rows = []
                    for row_index in sorted(rows.keys()):
                        row = rows[row_index]
                        ordered_cells = [row[col] for col in sorted(row.keys())]
                        row_text = " | ".join(ordered_cells)
                        full_text.append(row_text)
                        table_rows.append(ordered_cells)
                    full_text.append("") # Spacer
                    tables_data.append(table_rows)
            
            return {
                "success": True,
                "full_text": "\n".join(full_text),
                "tables": tables_data,
                "raw_response": "Azure analysis complete"
            }

        except HttpResponseError as e:
            error_msg = f"Azure API Error: {e.message}"
            logger.error(f"❌ Azure OCR failed: {error_msg}")
            return {"success": False, "error": error_msg}
        except Exception as e:
            error_msg = f"Unexpected error during Azure OCR: {str(e)}"
            logger.error(f"❌ Azure OCR failed: {error_msg}")
            return {"success": False, "error": error_msg}
