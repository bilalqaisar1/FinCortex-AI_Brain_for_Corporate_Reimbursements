🧾 DocTR OCR — Receipt Text Extraction
📌 Overview

This project uses Mindee’s DocTR (Document Text Recognition)
 to perform Optical Character Recognition (OCR) on images and scanned documents.
It can detect and extract text from receipts, invoices, or any printed documents using deep learning–based text detection and recognition models.

The project demonstrates:

Image preprocessing and inference using DocTR

Text detection and recognition from various document images

Visualization of bounding boxes and extracted text

Option to save the extracted text to a .txt or .csv file

🚀 Features

✅ Detect and recognize text from images or PDFs
✅ High accuracy using pretrained models (db_resnet50, crnn_vgg16_bn, etc.)
✅ Works offline (no cloud API needed)
✅ Easy to integrate in other Python projects
✅ Supports CPU and GPU inference

🧠 Model Architecture

DocTR is built on two main stages:

Text Detection — uses differentiable binarization (DBNet/LinkNet) to locate text regions.

Text Recognition — uses CRNN or Transformer-based models to read text lines within detected regions.

🛠️ Installation

Clone the repository and install dependencies:

git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>

# Create a virtual environment (recommended)
python -m venv venv
source venv/bin/activate   # (Linux/Mac)
venv\Scripts\activate      # (Windows)

# Install requirements
pip install -r requirements.txt


🧩 If you haven’t created a requirements.txt, you can generate it using:

pip freeze > requirements.txt

📸 Usage
1️⃣ Run the script on a single image
python main.py --image path/to/receipt.jpg

2️⃣ Run on multiple images
python main.py --folder path/to/images/

3️⃣ Example Output
Detected text:
----------------
Store Name: ABC Supermart
Total: $45.20
Date: 2024-11-02
----------------

4️⃣ Optional visualization
python main.py --image sample.jpg --show


This displays the image with text detection boxes.
