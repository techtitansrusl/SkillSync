import pdfplumber

def extract_text_from_pdf(path: str) -> str:
    """
    Simple text extractor for native (non-scanned) PDFs.
    """
    text_parts = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            txt = page.extract_text() or ""
            text_parts.append(txt)
    return "\n".join(text_parts)
