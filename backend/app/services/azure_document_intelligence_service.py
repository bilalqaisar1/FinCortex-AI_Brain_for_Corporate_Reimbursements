"""
Azure Document Intelligence service for OCR text extraction.
"""
import logging
import os
from typing import Optional

from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import HttpResponseError

from app.config.settings import settings

logger = logging.getLogger(__name__)


class AzureDocumentIntelligenceError(Exception):
    """Custom exception for Azure Document Intelligence errors."""
    pass


def extract_text_with_azure(file_path: str) -> str:
    """
    Extract text from a document using Azure Document Intelligence (prebuilt-layout model).
    
    Args:
        file_path: Path to the document file
    
    Returns:
        Extracted text content as a single string
    
    Raises:
        AzureDocumentIntelligenceError: If extraction fails or credentials/file are invalid
    """
    if not settings.azure_endpoint or not settings.azure_key:
        raise AzureDocumentIntelligenceError("Azure credentials not configured (AZURE_ENDPOINT or AZURE_KEY missing).")

    if not os.path.exists(file_path):
        raise AzureDocumentIntelligenceError(f"File not found: {file_path}")

    logger.info(f"📄 Azure OCR: Analyzing {os.path.basename(file_path)}")

    try:
        # Create client
        client = DocumentIntelligenceClient(
            endpoint=settings.azure_endpoint,
            credential=AzureKeyCredential(settings.azure_key)
        )

        with open(file_path, "rb") as f:
            poller = client.begin_analyze_document(
                model_id="prebuilt-layout",
                body=f
            )
        
        result = poller.result()
        logger.info("✅ Azure OCR: Text extraction complete")

        # Compile extracted text
        full_text = []

        # 1. Add page text
        for page in result.pages:
            for line in page.lines:
                full_text.append(line.content)
        
        # 2. Add table data (optional but good for context)
        if result.tables:
            full_text.append("\n--- EXTRACTED TABLES ---\n")
            for table in result.tables:
                rows = {}
                for cell in table.cells:
                    rows.setdefault(cell.row_index, {})
                    rows[cell.row_index][cell.column_index] = cell.content

                for row_index in sorted(rows.keys()):
                    row = rows[row_index]
                    ordered_cells = [row[col] for col in sorted(row.keys())]
                    full_text.append(" | ".join(ordered_cells))
                full_text.append("") # Spacer
        
        return "\n".join(full_text)

    except HttpResponseError as e:
        error_msg = f"Azure API Error: {e.message}"
        logger.error(f"❌ Azure OCR failed: {error_msg}")
        raise AzureDocumentIntelligenceError(error_msg)
    except Exception as e:
        error_msg = f"Unexpected error during Azure OCR: {str(e)}"
        logger.error(f"❌ Azure OCR failed: {error_msg}")
        raise AzureDocumentIntelligenceError(error_msg)
