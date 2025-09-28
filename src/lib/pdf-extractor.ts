import pdfToText from "react-pdftotext";

/**
 * Extract text from a PDF file
 * @param file - The PDF file to extract text from
 * @param maxLines - Maximum number of lines to extract (default: 10)
 * @returns Promise<string> - Extracted text
 */
export async function extractTextFromPDF(
  file: File,
  maxLines: number = 10
): Promise<string> {
  try {
    const text = await pdfToText(file);
    const lines = text.split("\n");

    // Filter out empty lines and get first maxLines
    const filteredLines = lines
      .filter((line) => line.trim())
      .slice(0, maxLines);

    return filteredLines.join("\n");
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF file");
  }
}

/**
 * Extract text from various file types
 * @param file - The file to extract text from
 * @param maxLines - Maximum number of lines to extract (default: 10)
 * @returns Promise<string> - Extracted text
 */
export async function extractTextFromFile(
  file: File,
  maxLines: number = 10
): Promise<string> {
  const fileType = file.type.toLowerCase();

  if (fileType === "application/pdf") {
    return extractTextFromPDF(file, maxLines);
  } else if (fileType.startsWith("text/") || fileType === "application/json") {
    // Handle text files
    const text = await file.text();
    const lines = text.split(/\n|\r\n|\r/).filter((line) => line.trim());
    return lines.slice(0, maxLines).join("\n");
  } else {
    // For other file types, return filename and type as fallback
    return `File: ${file.name}\nType: ${file.type}\nSize: ${file.size} bytes`;
  }
}

/**
 * Call the tagging API to get content tags
 * @param text - The text content to analyze
 * @returns Promise<string> - The tag returned by the API
 */
export async function getContentTag(text: string): Promise<string> {
  try {
    const response = await fetch("http://81.15.150.173:8000/get_tag", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.tag || "unknown";
  } catch (error) {
    console.error("Error calling tagging API:", error);
    // Return a fallback tag if API fails
    return "untagged";
  }
}
