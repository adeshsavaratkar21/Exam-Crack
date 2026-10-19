import re
from typing import List, Dict, Any
from pypdf import PdfReader
import pdfplumber


class PDFService:
    @staticmethod
    def extract_text(file_path: str) -> str:
        """
        Extracts clean text from a PDF file using pypdf and pdfplumber as fallback.
        """
        extracted_text = []

        try:
            reader = PdfReader(file_path)
            for page_num, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text and len(page_text.strip()) > 30:
                    cleaned_page = PDFService._clean_page_text(page_text)
                    extracted_text.append(f"--- Page {page_num + 1} ---\n{cleaned_page}")
        except Exception as e:
            # Fallback to pdfplumber
            try:
                with pdfplumber.open(file_path) as pdf:
                    for page_num, page in enumerate(pdf.pages):
                        page_text = page.extract_text()
                        if page_text and len(page_text.strip()) > 30:
                            cleaned_page = PDFService._clean_page_text(page_text)
                            extracted_text.append(f"--- Page {page_num + 1} ---\n{cleaned_page}")
            except Exception as e2:
                raise ValueError(f"Failed to extract text from PDF: {str(e2)}")

        combined_text = "\n\n".join(extracted_text)
        if not combined_text.strip():
            # If PDF text is empty (scanned or image-only), return placeholder note
            return "Note: Scanned or image-based PDF document detected. Text layer could not be parsed directly."
        
        return combined_text

    @staticmethod
    def _clean_page_text(text: str) -> str:
        """
        Cleans header/footer repetitions, extra whitespace, and common noise.
        """
        # Replace multiple spaces with single space
        text = re.sub(r"[ \t]+", " ", text)
        # Clean repetitive newlines
        text = re.sub(r"\n{3,}", "\n\n", text)
        # Remove standard university exam headers like "Page X of Y"
        text = re.sub(r"Page \d+ of \d+", "", text, flags=re.IGNORECASE)
        return text.strip()


pdf_service = PDFService()
