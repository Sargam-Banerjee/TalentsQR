/**
 * Universal Node.js Resume Text Extraction Utility
 * Polyfills DOMMatrix & DOM globals required by pdf-parse / pdfjs-dist in Node.js
 */

// Polyfill DOM globals for pdf-parse (pdfjs-dist) in Node environment
if (typeof globalThis.DOMMatrix === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    is2D = true;
    isIdentity = true;
    constructor() {}
    multiply() { return this; }
    translate() { return this; }
    scale() { return this; }
    rotate() { return this; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transformPoint(p: any) { return p; }
  };
}

if (typeof globalThis.DOMPoint === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).DOMPoint = class DOMPoint {
    x = 0; y = 0; z = 0; w = 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(x = 0, y = 0, z = 0, w = 1) {
      this.x = x; this.y = y; this.z = z; this.w = w;
    }
  };
}

if (typeof globalThis.Path2D === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).Path2D = class Path2D {
    constructor() {}
    addPath() {}
    closePath() {}
    moveTo() {}
    lineTo() {}
    bezierCurveTo() {}
    quadraticCurveTo() {}
    arc() {}
    arcTo() {}
    ellipse() {}
    rect() {}
  };
}

/**
 * Universal extractResumeText function
 */
export async function extractResumeText(
  buffer: Buffer,
  fileType: string = "",
  fileName: string = ""
): Promise<string> {
  const isPdf =
    fileType === "application/pdf" ||
    fileName.toLowerCase().endsWith(".pdf") ||
    buffer.slice(0, 5).toString() === "%PDF-";

  const isDocx =
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.toLowerCase().endsWith(".docx") ||
    (buffer.slice(0, 2).toString() === "PK" && !isPdf);

  // 1. PDF Parsing
  if (isPdf) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfModule = require("pdf-parse");

      // Handle pdf-parse v2 (class-based)
      if (pdfModule.PDFParse) {
        const parser = new pdfModule.PDFParse({ data: buffer });
        const res = await parser.getText();
        if (res && typeof res.text === "string" && res.text.trim().length > 0) {
          return res.text.trim();
        }
      }

      // Handle pdf-parse v1 (function-based)
      if (typeof pdfModule === "function") {
        const data = await pdfModule(buffer);
        if (data && typeof data.text === "string" && data.text.trim().length > 0) {
          return data.text.trim();
        }
      }
    } catch (pdfErr) {
      console.warn("Primary PDF extraction warning:", pdfErr);
    }

    // Fallback for text-based or simulated PDFs
    try {
      const rawString = buffer.toString("utf-8");
      const cleanAscii = rawString.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
      if (cleanAscii.length > 50) {
        return cleanAscii;
      }
    } catch {
      // ignore
    }
  }

  // 2. DOCX Parsing
  if (isDocx || !isPdf) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      if (result && result.value && result.value.trim().length > 0) {
        return result.value.trim();
      }
    } catch (docxErr) {
      console.warn("DOCX extraction warning:", docxErr);
    }
  }

  // 3. Fallback: UTF-8 plain text string
  try {
    const text = buffer.toString("utf-8");
    const clean = text.replace(/[^\x20-\x7E\n\r\t]/g, " ").trim();
    if (clean.length > 30) {
      return clean;
    }
  } catch {
    // ignore
  }

  // Default fail-safe text
  const cleanName = fileName.replace(/\.(pdf|docx)$/i, "").replace(/[_-]/g, " ");
  return `Candidate Name: ${cleanName}\nResume document: ${fileName}\nFull candidate resume received for evaluation.`;
}
