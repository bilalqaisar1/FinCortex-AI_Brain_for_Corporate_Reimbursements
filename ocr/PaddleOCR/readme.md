# 🧾 Receipt OCR using PaddleOCR

This Python script performs Optical Character Recognition (OCR) on a receipt image using the **PaddleOCR** library.
It extracts text and confidence scores, then organizes them into readable sections such as business info, transaction details, items, payment information, and more.

---

## 🚀 Features

* Uses **PaddleOCR** for high-accuracy text recognition.
* Automatically extracts and prints detected text with confidence scores.
* Organizes output into meaningful sections (e.g., business info, transaction details, etc.).
* Handles errors like missing images or parsing issues gracefully.

---

## 🧩 Requirements

Install the required dependencies before running the script:

```bash
pip install paddleocr==2.7.0.3 paddlepaddle==2.6.1
```

> ⚠️ **Note:** If `paddlepaddle==2.6.1` is unavailable for your system, try installing:
>
> ```bash
> pip install paddlepaddle
> ```

---

## 📂 File Structure

```
.
├── pd.py               # Main OCR script
└── C:\Users\User\Desktop\OCRs\EasyOCR\pic1.jpg  # Example input image path
```

---

## 🧠 How It Works

1. Initializes a **PaddleOCR** model for English language detection.
2. Reads an image from the specified path.
3. Extracts recognized texts and their confidence scores.
4. Displays the text in organized sections:

   * Business Information
   * Transaction Information
   * Items and Pricing
   * Payment Information
   * Additional Information

---

## ▶️ Usage

1. **Set your image path** in the script:

   ```python
   img_path = 'C:\\path\\to\\your\\image.jpg'
   ```

2. **Run the script:**

   ```bash
   python pd.py
   ```

3. **View results** printed in your terminal.

---

## 🪲 Error Handling

* If the image file doesn’t exist, it displays an error message.
* If OCR or parsing fails, the script reports the exact issue.

---

## 🧰 Example Output

```
Processing image...

=== Receipt Details ===

Business Information:
----------------------------------------
McDonald's (Confidence: 0.98)
123 Main Street (Confidence: 0.95)

Transaction Information:
----------------------------------------
Date: 2023-11-05 (Confidence: 0.97)

Items and Pricing:
----------------------------------------
Big Mac - $5.99 (Confidence: 0.96)
Fries - $2.99 (Confidence: 0.95)
...

Payment Information:
----------------------------------------
Total: $8.98 (Confidence: 0.97)
Paid via: Credit Card (Confidence: 0.96)
```

---

