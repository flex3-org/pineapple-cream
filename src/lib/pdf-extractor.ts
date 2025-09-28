import * as pdfjsLib from "pdfjs-dist";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  error?: string;
}

/**
 * Extract text from a PDF file using PDF.js
 * @param pdfUrl - URL to the PDF file
 * @param maxLines - Maximum number of lines to extract (default: 10)
 * @returns Promise with extracted text and metadata
 */
export async function extractTextFromPDF(
  pdfUrl: string,
  maxLines: number = 10
): Promise<PDFExtractionResult> {
  try {
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;

    const pageCount = pdf.numPages;
    let fullText = "";
    let lineCount = 0;

    // Extract text from pages until we reach maxLines
    for (
      let pageNum = 1;
      pageNum <= pageCount && lineCount < maxLines;
      pageNum++
    ) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Combine text items from the page
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");

        // Split into lines and take only what we need
        const lines = pageText
          .split(/\r?\n/)
          .filter((line) => line.trim().length > 0);
        const remainingLines = maxLines - lineCount;
        const linesToTake = lines.slice(0, remainingLines);

        if (linesToTake.length > 0) {
          fullText += `\n--- Page ${pageNum} ---\n${linesToTake.join("\n")}\n`;
          lineCount += linesToTake.length;
        }

        // Stop if we've reached the line limit
        if (lineCount >= maxLines) {
          fullText += `\n[... truncated to first ${maxLines} lines ...]`;
          break;
        }
      } catch (pageError) {
        console.warn(`Error extracting text from page ${pageNum}:`, pageError);
        fullText += `\n--- Page ${pageNum} ---\n[Error extracting text from this page]\n`;
        lineCount += 1; // Count error message as a line
      }
    }

    return {
      text: fullText.trim(),
      pageCount,
    };
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    return {
      text: "",
      pageCount: 0,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error occurred while extracting PDF text",
    };
  }
}

/**
 * Extract text from PDF with retry mechanism
 * @param pdfUrl - URL to the PDF file
 * @param maxLines - Maximum number of lines to extract (default: 10)
 * @param maxRetries - Maximum number of retry attempts
 * @returns Promise with extracted text and metadata
 */
export async function extractTextFromPDFWithRetry(
  pdfUrl: string,
  maxLines: number = 10,
  maxRetries: number = 2
): Promise<PDFExtractionResult> {
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await extractTextFromPDF(pdfUrl, maxLines);
      if (!result.error) {
        return result;
      }
      lastError = result.error;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unknown error";
      console.warn(`PDF extraction attempt ${attempt + 1} failed:`, error);
    }

    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * Math.pow(2, attempt))
      );
    }
  }

  return {
    text: "",
    pageCount: 0,
    error: `Failed to extract PDF text after ${
      maxRetries + 1
    } attempts. Last error: ${lastError}`,
  };
}
