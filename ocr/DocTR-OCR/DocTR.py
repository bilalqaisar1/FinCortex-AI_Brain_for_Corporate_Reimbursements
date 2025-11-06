"""
doctr_receipt_ocr.py
Run: python doctr_receipt_ocr.py path/to/receipt.jpg
"""

import sys
import json
import numpy as np
from PIL import Image
import cv2

import torch
from doctr.io import DocumentFile
from doctr.models import ocr_predictor

# -------------------------
# Optional preprocessing
# -------------------------
def preprocess_receipt(path, do_preprocess=True, save_tmp=False):
    """
    Basic preprocessing to improve OCR on noisy receipts:
      - convert to grayscale
      - bilateral filter (denoise while preserving edges)
      - adaptive threshold or Otsu
      - optional resize to have min dimension ~800 px
    Returns: RGB numpy array (H, W, 3) as uint8 for DocTR
    """
    img = cv2.imread(path)
    if img is None:
        raise FileNotFoundError(f"Image not found: {path}")
    if not do_preprocess:
        # convert BGR -> RGB
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # convert to gray and denoise
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    den = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)

    # adaptive threshold to remove background lighting
    th = cv2.adaptiveThreshold(den, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                               cv2.THRESH_BINARY, 31, 10)

    # convert back to RGB
    rgb = cv2.cvtColor(th, cv2.COLOR_GRAY2RGB)

    # resize if too small (keep aspect)
    h, w = rgb.shape[:2]
    min_dim = min(h, w)
    if min_dim < 800:
        scale = 800 / float(min_dim)
        rgb = cv2.resize(rgb, (int(w*scale), int(h*scale)), interpolation=cv2.INTER_LINEAR)

    if save_tmp:
        cv2.imwrite("preprocessed_tmp.png", cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR))
    return rgb

# -------------------------
# DocTR inference + parsing
# -------------------------
def run_doctr_ocr(image_paths, use_gpu=True, det_bs=2, reco_bs=1024,
                  assume_straight_pages=True, disable_orientation=True):
    """
    image_paths: list of local file paths (strings)
    returns: result object (docTR Document) and structured json-like dict
    """

    device = torch.device('cuda' if (use_gpu and torch.cuda.is_available()) else 'cpu')
    print("Using device:", device)

    # Create predictor - you can change architectures if desired
    # fast_base is a lighter detection architecture; crnn_vgg16_bn is recognition
    predictor = ocr_predictor(det_arch="db_resnet50", reco_arch="crnn_vgg16_bn",
                              pretrained=True,
                              assume_straight_pages=assume_straight_pages,
                              detect_orientation=(not disable_orientation),
                              det_bs=det_bs, reco_bs=reco_bs)
    predictor = predictor.to(device)

    # Build a DocumentFile from images
    # If you already have numpy arrays, DocumentFile.from_images accepts them too.
    doc = DocumentFile.from_images(image_paths)

    # Run OCR (result is a Document object)
    result = predictor(doc)  # or predictor([numpy_img,...])
    # result is a doctr Document with .pages -> .blocks -> .lines -> .words

    # Convert result to structured dict
    structured = {"pages": []}
    full_text = []

    for p_idx, page in enumerate(result.pages):
        page_entry = {"page_index": p_idx, "dimensions": page.dimensions, "blocks": []}

        for b_idx, block in enumerate(page.blocks):
            block_entry = {"block_index": b_idx, "lines": []}
            for l_idx, line in enumerate(block.lines):
                # join words in the line with spaces (DocTR preserves order)
                line_words = []
                for w_idx, word in enumerate(line.words):
                    # word is a Word object: word.value or Word.value, word.confidence
                    val = getattr(word, "value", None) or getattr(word, "text", None) or str(word)
                    conf = getattr(word, "confidence", None)
                    geom = getattr(word, "geometry", None)  # may be polygon or bbox
                    # Some versions expose value vs text; this code tries both.
                    word_entry = {"word_index": w_idx, "value": val, "confidence": float(conf) if conf is not None else None, "geometry": geom}
                    line_words.append(word_entry)

                line_text = " ".join([w["value"] for w in line_words if w["value"]])
                full_text.append(line_text)
                line_entry = {"line_index": l_idx, "text": line_text, "words": line_words}
                block_entry["lines"].append(line_entry)

            page_entry["blocks"].append(block_entry)

        structured["pages"].append(page_entry)

    plain_text = "\n".join(full_text)
    return result, structured, plain_text

def extract_key_value_pairs(plain_text):
    """Extract key-value pairs from OCR text using simple rules"""
    receipt_data = {
        "date": None,
        "total": None,
        "merchant": None,
        "items": [],
        "tax": None,
        "invoice_number": None
    }
    
    lines = plain_text.split('\n')
    current_item = {}
    
    for line in lines:
        line = line.strip().lower()
        
        # Try to find date
        if any(x in line for x in ['date:', 'date', '/']) and not receipt_data['date']:
            import re
            date_pattern = r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}'
            date_match = re.search(date_pattern, line)
            if date_match:
                receipt_data['date'] = date_match.group()
                
        # Try to find total
        if any(x in line for x in ['total:', 'total', 'amount:', 'amount']):
            import re
            amount_pattern = r'\$?\d+\.?\d*'
            amount_match = re.search(amount_pattern, line)
            if amount_match:
                receipt_data['total'] = amount_match.group()
                
        # Try to find merchant name (usually in first few lines)
        if not receipt_data['merchant'] and len(line) > 3:
            receipt_data['merchant'] = line
            
        # Try to find tax
        if any(x in line for x in ['tax:', 'tax', 'vat:', 'vat']):
            import re
            tax_pattern = r'\$?\d+\.?\d*'
            tax_match = re.search(tax_pattern, line)
            if tax_match:
                receipt_data['tax'] = tax_match.group()
                
        # Try to find invoice number
        if any(x in line for x in ['invoice#', 'invoice #', 'receipt#']):
            import re
            invoice_pattern = r'[A-Za-z0-9-]+'
            invoice_match = re.search(invoice_pattern, line)
            if invoice_match:
                receipt_data['invoice_number'] = invoice_match.group()
    
    return receipt_data

# -------------------------
# CLI
# -------------------------
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python doctr_receipt_ocr.py path/to/receipt.jpg")
        sys.exit(1)

    path = sys.argv[1]
    # preprocessing (turn off if you want raw input)
    img_np = preprocess_receipt(path, do_preprocess=True, save_tmp=False)
    # You can save temporary preprocessed file then pass path, or pass numpy array directly
    # We'll save a temporary image and pass its path for DocumentFile convenience
    tmp_path = "C:\\Users\\Hashiir\\Desktop\\FinCortex\\OCRS\\3.jpg"
    Image.fromarray(img_np).save(tmp_path)

    result, structured, plain_text = run_doctr_ocr([tmp_path],
                                                   use_gpu=True,
                                                   det_bs=2, reco_bs=1024,
                                                   assume_straight_pages=True,
                                                   disable_orientation=True)

    # Extract key-value pairs
    receipt_data = extract_key_value_pairs(plain_text)
    
    print("---- Plain text ----")
    print(plain_text)
    print("\n---- Example structured output (JSON snippet) ----")
    print(json.dumps(structured, indent=2)[:10000])  # print up to first 10k chars
    print("\n---- Key-Value Pairs ----")
    print(json.dumps(receipt_data, indent=2))
