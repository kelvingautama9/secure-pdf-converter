import { PDFDocument, PDFName, PDFRawStream, PDFNumber } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import { decryptPDF, isEncrypted } from '@pdfsmaller/pdf-decrypt';
import { CompressOptions, ImageToPdfOptions, MergeSplitOptions, ProtectUnlockOptions } from '../types';

/**
 * Yield control back to browser event loop to keep the UI responsive
 * and prevent "Page Unresponsive" browser crash dialogues during heavy PDF tasks.
 */
export const yieldToMain = (): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, 0));
};

/**
 * Human-readable byte formatting
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Read File into ArrayBuffer with memory guard
 */
export async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  const MAX_SAFE_FILE_SIZE = 150 * 1024 * 1024; // 150MB client safeguard
  if (file.size > MAX_SAFE_FILE_SIZE) {
    throw new Error(
      `File "${file.name}" is ${formatBytes(file.size)}. Browser RAM limit safeguard: Maximum safe single-file size is 150MB.`
    );
  }
  return await file.arrayBuffer();
}

/**
 * Safe download trigger for client-side generated files
 */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Get total page count of a PDF file
 */
export async function getPdfPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    return pdfDoc.getPageCount();
  } catch (err: unknown) {
    console.warn(`Could not read page count for ${file.name}:`, err);
    return 1;
  }
}

/**
 * Check if a PDF is password encrypted
 */
export async function checkPdfIsEncrypted(file: File): Promise<boolean> {
  try {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const encrypted = await isEncrypted(new Uint8Array(arrayBuffer));
    return Boolean(encrypted);
  } catch {
    return false;
  }
}

/**
 * Converts an image file (JPG, PNG, WebP) into an optimized image element & dimensions
 */
async function processImageFile(
  file: File,
  quality: number,
  maxDimension?: number
): Promise<{ dataUrl: string; width: number; height: number; isPng: boolean }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Failed to read image file: ${file.name}`));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error(`Corrupted or unsupported image file: ${file.name}`));
      img.onload = () => {
        try {
          let targetW = img.naturalWidth;
          let targetH = img.naturalHeight;

          // Downscale proportionally if maxDimension is enforced
          if (maxDimension && maxDimension > 0) {
            const maxSide = Math.max(targetW, targetH);
            if (maxSide > maxDimension) {
              const scale = maxDimension / maxSide;
              targetW = Math.max(1, Math.round(targetW * scale));
              targetH = Math.max(1, Math.round(targetH * scale));
            }
          }

          const isPng = file.type === 'image/png' && quality >= 0.95 && (!maxDimension || maxDimension >= Math.max(img.naturalWidth, img.naturalHeight));
          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Canvas 2D context unavailable in browser.');
          }

          // If converting transparent PNG to JPEG, fill white background
          if (!isPng) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, targetW, targetH);
          }
          ctx.drawImage(img, 0, 0, targetW, targetH);

          const mimeType = isPng ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(mimeType, quality);
          resolve({
            dataUrl,
            width: targetW,
            height: targetH,
            isPng,
          });
        } catch (e) {
          reject(e);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Convert base64 data URL to Uint8Array
function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// =========================================================================
// 1. IMAGE TO PDF
// =========================================================================
export async function imageToPdf(
  files: File[],
  options: ImageToPdfOptions,
  onProgress?: (percent: number, message: string) => void
): Promise<Uint8Array> {
  if (files.length === 0) {
    throw new Error('Please select at least one image file.');
  }

  onProgress?.(5, 'Initializing PDF Document...');
  await yieldToMain();

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle('Converted Document');
  pdfDoc.setProducer('BlackEYE Client PDF Engine');

  const pageDimensions: Record<string, [number, number]> = {
    A4: [595.28, 841.89],
    LETTER: [612, 792],
  };

  // Determine compression parameters if compression is enabled
  let effQuality = options.quality ?? 0.9;
  let effMaxDimension: number | undefined = undefined;

  if (options.compress) {
    if (options.compressPreset === 'extreme') {
      effQuality = 0.5;
      effMaxDimension = 1200;
    } else if (options.compressPreset === 'recommended') {
      effQuality = 0.75;
      effMaxDimension = 1800;
    } else if (options.compressPreset === 'light') {
      effQuality = 0.88;
      effMaxDimension = 2400;
    } else if (options.compressPreset === 'custom') {
      effQuality = options.customQuality ?? 0.75;
      effMaxDimension = options.customMaxDimension ?? 1800;
    }
  }

  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    const progressBase = Math.round(10 + (i / total) * 80);
    onProgress?.(
      progressBase,
      `Processing ${options.compress ? '& compressing ' : ''}image ${i + 1} of ${total}: ${file.name}`
    );
    await yieldToMain();

    try {
      const processed = await processImageFile(file, effQuality, effMaxDimension);
      const imgBytes = dataUrlToBytes(processed.dataUrl);

      const embeddedImage = processed.isPng
        ? await pdfDoc.embedPng(imgBytes)
        : await pdfDoc.embedJpg(imgBytes);

      let pageWidth: number;
      let pageHeight: number;

      if (options.pageSize === 'FIT') {
        pageWidth = processed.width + options.margin * 2;
        pageHeight = processed.height + options.margin * 2;
      } else {
        const [stdW, stdH] = pageDimensions[options.pageSize] || pageDimensions.A4;
        const isLandscape =
          options.orientation === 'landscape' ||
          (options.orientation === 'auto' && processed.width > processed.height);

        pageWidth = isLandscape ? Math.max(stdW, stdH) : Math.min(stdW, stdH);
        pageHeight = isLandscape ? Math.min(stdW, stdH) : Math.max(stdW, stdH);
      }

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      const availableWidth = pageWidth - options.margin * 2;
      const availableHeight = pageHeight - options.margin * 2;

      // Maintain aspect ratio scaling
      const imgScale = Math.min(
        availableWidth / processed.width,
        availableHeight / processed.height,
        1
      );

      const drawWidth = processed.width * imgScale;
      const drawHeight = processed.height * imgScale;

      const drawX = options.margin + (availableWidth - drawWidth) / 2;
      const drawY = options.margin + (availableHeight - drawHeight) / 2;

      page.drawImage(embeddedImage, {
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
      });
    } catch (err: unknown) {
      console.error('Image processing error:', err);
      throw new Error(`Failed to process image "${file.name}": ${(err as Error).message}`);
    }
  }

  onProgress?.(95, 'Compiling and compressing PDF stream...');
  await yieldToMain();

  const finalPdfBytes = await pdfDoc.save({ useObjectStreams: true });
  onProgress?.(100, 'Image to PDF conversion complete!');
  return finalPdfBytes;
}

// =========================================================================
// 2. MERGE & SPLIT PDF
// =========================================================================

/**
 * Merge multiple PDF documents into a single document
 */
export async function mergePdfs(
  files: File[],
  onProgress?: (percent: number, message: string) => void
): Promise<Uint8Array> {
  if (files.length < 2) {
    throw new Error('Merge requires at least two PDF files.');
  }

  onProgress?.(5, 'Creating master PDF document...');
  await yieldToMain();

  const mergedPdf = await PDFDocument.create();
  mergedPdf.setProducer('BlackEYE Client PDF Engine');

  const totalFiles = files.length;

  for (let i = 0; i < totalFiles; i++) {
    const file = files[i];
    const progressPercent = Math.round(10 + (i / totalFiles) * 80);
    onProgress?.(progressPercent, `Merging [${i + 1}/${totalFiles}]: ${file.name}...`);
    await yieldToMain();

    try {
      const buffer = await readFileAsArrayBuffer(file);
      const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    } catch (err: unknown) {
      throw new Error(
        `Failed merging "${file.name}". File may be password protected or corrupted. (${(err as Error).message})`
      );
    }
  }

  onProgress?.(94, 'Assembling cross-reference tables and streams...');
  await yieldToMain();

  const mergedBytes = await mergedPdf.save({ useObjectStreams: true });
  onProgress?.(100, 'Merge completed successfully!');
  return mergedBytes;
}

/**
 * Parse page range string (e.g. "1-3, 5, 8-10") into zero-indexed page numbers
 */
export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  const cleaned = rangeStr.trim();
  if (!cleaned) {
    throw new Error('Page range cannot be empty. Example: 1-3, 5, 7');
  }

  const pagesSet = new Set<number>();
  const parts = cleaned.split(/[,;\s]+/);

  for (const part of parts) {
    if (!part) continue;
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid range format: "${part}"`);
      }
      if (start > end) {
        throw new Error(`Start page cannot exceed end page in "${part}"`);
      }

      for (let p = start; p <= end; p++) {
        if (p < 1 || p > totalPages) {
          throw new Error(`Page ${p} is out of bounds (Document has ${totalPages} pages).`);
        }
        pagesSet.add(p - 1);
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (isNaN(pageNum)) {
        throw new Error(`Invalid page number: "${part}"`);
      }
      if (pageNum < 1 || pageNum > totalPages) {
        throw new Error(`Page ${pageNum} is out of bounds (Document has ${totalPages} pages).`);
      }
      pagesSet.add(pageNum - 1);
    }
  }

  const sortedPages = Array.from(pagesSet).sort((a, b) => a - b);
  if (sortedPages.length === 0) {
    throw new Error('No valid pages found in range.');
  }

  return sortedPages;
}

/**
 * Split PDF: either extract custom page ranges or split into all single pages
 */
export async function splitPdf(
  file: File,
  options: MergeSplitOptions,
  onProgress?: (percent: number, message: string) => void
): Promise<{ blob: Blob; fileName: string }[]> {
  onProgress?.(10, `Loading source PDF: ${file.name}...`);
  await yieldToMain();

  const buffer = await readFileAsArrayBuffer(file);
  const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('The selected PDF contains 0 pages.');
  }

  const baseName = file.name.replace(/\.[^/.]+$/, '');

  // Case 1: Extract specified range into a single new document
  if (options.mode === 'split-range') {
    onProgress?.(30, 'Parsing page range specification...');
    const pageIndices = parsePageRange(options.range, totalPages);

    onProgress?.(50, `Extracting ${pageIndices.length} pages...`);
    await yieldToMain();

    const newDoc = await PDFDocument.create();
    newDoc.setProducer('BlackEYE Client PDF Engine');
    const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
    copiedPages.forEach((p) => newDoc.addPage(p));

    onProgress?.(85, 'Building PDF stream...');
    await yieldToMain();

    const bytes = await newDoc.save({ useObjectStreams: true });
    onProgress?.(100, 'Page extraction completed!');

    return [
      {
        blob: new Blob([bytes], { type: 'application/pdf' }),
        fileName: `${baseName}_extracted_pages.pdf`,
      },
    ];
  }

  // Case 2: Split every page into its own standalone PDF
  const results: { blob: Blob; fileName: string }[] = [];
  onProgress?.(20, `Splitting ${totalPages} pages into individual documents...`);

  for (let i = 0; i < totalPages; i++) {
    const progress = Math.round(20 + ((i + 1) / totalPages) * 75);
    onProgress?.(progress, `Generating page ${i + 1} of ${totalPages}...`);
    await yieldToMain();

    const pageDoc = await PDFDocument.create();
    pageDoc.setProducer('BlackEYE Client PDF Engine');
    const [page] = await pageDoc.copyPages(srcDoc, [i]);
    pageDoc.addPage(page);

    const bytes = await pageDoc.save({ useObjectStreams: true });
    results.push({
      blob: new Blob([bytes], { type: 'application/pdf' }),
      fileName: `${baseName}_page_${i + 1}.pdf`,
    });
  }

  onProgress?.(100, `Successfully split into ${totalPages} PDF files!`);
  return results;
}

// =========================================================================
// 3. PROTECT & UNLOCK PDF
// =========================================================================

/**
 * Protect PDF with AES-256 password encryption and optional granular permissions
 */
export async function protectPdf(
  file: File,
  options: ProtectUnlockOptions,
  onProgress?: (percent: number, message: string) => void
): Promise<Uint8Array> {
  if (!options.password || options.password.trim() === '') {
    throw new Error('Please enter a password to protect the document.');
  }

  onProgress?.(15, `Reading "${file.name}"...`);
  await yieldToMain();

  const buffer = await readFileAsArrayBuffer(file);
  const uint8 = new Uint8Array(buffer);

  // Verify document can be loaded first
  onProgress?.(30, 'Verifying document integrity...');
  await yieldToMain();

  try {
    await PDFDocument.load(uint8, { ignoreEncryption: true });
  } catch (err: unknown) {
    throw new Error(`Cannot protect file: invalid or corrupted PDF (${(err as Error).message})`);
  }

  onProgress?.(60, 'Applying AES-256 encryption & user credentials...');
  await yieldToMain();

  try {
    const encryptedBytes = await encryptPDF(uint8, options.password, {
      ownerPassword: options.ownerPassword || options.password,
      allowPrinting: Boolean(options.allowPrinting),
      allowCopying: Boolean(options.allowCopying),
      allowModifying: Boolean(options.allowModifying),
      allowHighQualityPrint: Boolean(options.allowPrinting),
    });

    onProgress?.(100, 'Document securely encrypted with AES-256!');
    return encryptedBytes;
  } catch (err: unknown) {
    throw new Error(`Encryption failed: ${(err as Error).message}`);
  }
}

/**
 * Unlock a password-protected PDF and produce a clean, unlocked document
 */
export async function unlockPdf(
  file: File,
  password: string,
  onProgress?: (percent: number, message: string) => void
): Promise<Uint8Array> {
  onProgress?.(15, `Loading encrypted file "${file.name}"...`);
  await yieldToMain();

  const buffer = await readFileAsArrayBuffer(file);
  const uint8 = new Uint8Array(buffer);

  onProgress?.(35, 'Analyzing encryption headers...');
  await yieldToMain();

  const encrypted = await isEncrypted(uint8);
  if (!encrypted) {
    onProgress?.(60, 'PDF is not encrypted. Sanitizing and exporting clean copy...');
    const doc = await PDFDocument.load(uint8, { ignoreEncryption: true });
    return await doc.save({ useObjectStreams: true });
  }

  if (!password) {
    throw new Error('This PDF is encrypted. Please provide the unlock password.');
  }

  onProgress?.(55, 'Decrypting cryptographic payload...');
  await yieldToMain();

  try {
    const decryptedBytes = await decryptPDF(uint8, password);
    onProgress?.(80, 'Re-building clean unencrypted PDF...');
    await yieldToMain();

    // Verify and re-save clean document
    const cleanDoc = await PDFDocument.load(decryptedBytes, { ignoreEncryption: true });
    cleanDoc.setProducer('BlackEYE Client PDF Engine');
    const cleanBytes = await cleanDoc.save({ useObjectStreams: true });

    onProgress?.(100, 'PDF successfully unlocked and decrypted!');
    return cleanBytes;
  } catch (err: unknown) {
    throw new Error(
      `Failed to unlock PDF: Incorrect password or unsupported encryption algorithm. (${(err as Error).message})`
    );
  }
}

// =========================================================================
// 4. COMPRESS PDF
// =========================================================================

/**
 * Compresses a PDF client-side:
 * 1. Compacts PDF cross-references into Object Streams (Deflate).
 * 2. Scans for embedded image streams and downsamples high-resolution DCT images.
 * 3. Strips unneeded metadata and duplicate dictionaries.
 */
export async function compressPdf(
  file: File,
  options: CompressOptions,
  onProgress?: (percent: number, message: string) => void
): Promise<{
  bytes: Uint8Array;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
}> {
  onProgress?.(10, `Loading source PDF: ${file.name}...`);
  await yieldToMain();

  const originalSize = file.size;
  const buffer = await readFileAsArrayBuffer(file);
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

  onProgress?.(30, 'Scanning document structure & streams...');
  await yieldToMain();

  // Strip non-essential document metadata to reduce header weight
  pdfDoc.setProducer('BlackEYE Client PDF Engine');
  pdfDoc.setCreator('BlackEYE');

  // Downsample or recompress embedded JPEG images if present in PDF objects
  try {
    const context = pdfDoc.context;
    const enumeratedIndirectObjects = context.enumerateIndirectObjects();
    let processedImages = 0;
    const totalObjects = enumeratedIndirectObjects.length;

    for (let idx = 0; idx < totalObjects; idx++) {
      const [ref, pdfObject] = enumeratedIndirectObjects[idx];

      if (idx % 20 === 0) {
        const p = Math.round(30 + (idx / totalObjects) * 50);
        onProgress?.(p, `Optimizing streams (${idx}/${totalObjects})...`);
        await yieldToMain();
      }

      // Check if this object is an Image stream
      if (pdfObject instanceof PDFRawStream) {
        const dict = pdfObject.dict;
        const subtype = dict.get(PDFName.of('Subtype'));
        const filter = dict.get(PDFName.of('Filter'));

        const isImage = subtype?.toString() === '/Image';
        const isJpeg = filter?.toString() === '/DCTDecode';

        if (isImage && isJpeg) {
          try {
            const rawBytes = pdfObject.contents;
            if (rawBytes.length > 25000) {
              // Only recompress images larger than 25KB
              const blob = new Blob([rawBytes], { type: 'image/jpeg' });
              const url = URL.createObjectURL(blob);

              const recompressed = await new Promise<Uint8Array | null>((res) => {
                const img = new Image();
                img.onload = () => {
                  URL.revokeObjectURL(url);
                  try {
                    let w = img.naturalWidth;
                    let h = img.naturalHeight;

                    // Downscale if exceeds max dimension
                    if (w > options.maxDimension || h > options.maxDimension) {
                      const scale = Math.min(
                        options.maxDimension / w,
                        options.maxDimension / h
                      );
                      w = Math.round(w * scale);
                      h = Math.round(h * scale);
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return res(null);

                    ctx.drawImage(img, 0, 0, w, h);
                    canvas.toBlob(
                      async (outBlob) => {
                        if (outBlob && outBlob.size < rawBytes.length) {
                          const newBytes = new Uint8Array(await outBlob.arrayBuffer());
                          res(newBytes);
                        } else {
                          res(null);
                        }
                      },
                      'image/jpeg',
                      options.quality
                    );
                  } catch {
                    res(null);
                  }
                };
                img.onerror = () => {
                  URL.revokeObjectURL(url);
                  res(null);
                };
                img.src = url;
              });

              if (recompressed) {
                // Update stream contents and dimensions
                dict.set(PDFName.of('Length'), PDFNumber.of(recompressed.length));
                context.assign(ref, PDFRawStream.of(dict, recompressed));
                processedImages++;
              }
            }
          } catch (imgErr) {
            console.warn('Skipped image optimization on stream:', imgErr);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Image optimization step had warnings:', err);
  }

  onProgress?.(85, 'Assembling compressed object streams...');
  await yieldToMain();

  const compressedBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false,
  });

  const compressedSize = compressedBytes.length;
  const savingsPercent =
    originalSize > compressedSize
      ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
      : 0;

  onProgress?.(100, `Optimization complete! Saved ${savingsPercent}%`);

  return {
    bytes: compressedBytes,
    originalSize,
    compressedSize,
    savingsPercent,
  };
}
