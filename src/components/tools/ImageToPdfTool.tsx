import React, { useState } from 'react';
import { DropZone } from '../DropZone';
import { FileItem, ImageToPdfOptions, ProgressState } from '../../types';
import { imageToPdf, downloadBlob, formatBytes } from '../../utils/pdfServices';
import { Download, Play, CheckCircle2, AlertCircle, RefreshCw, Settings2, Cpu, Sliders } from 'lucide-react';
import { haptic } from '../../utils/haptics';

export const ImageToPdfTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [options, setOptions] = useState<ImageToPdfOptions>({
    pageSize: 'A4',
    orientation: 'auto',
    margin: 18,
    quality: 0.9,
  });

  // Compression options for Image to PDF
  const [compressPdf, setCompressPdf] = useState<boolean>(false);
  const [compressPreset, setCompressPreset] = useState<'recommended' | 'extreme' | 'light' | 'custom'>('recommended');
  const [customQuality, setCustomQuality] = useState<number>(0.75);
  const [customMaxDimension, setCustomMaxDimension] = useState<number>(1800);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const [progress, setProgress] = useState<ProgressState>({
    isProcessing: false,
    progress: 0,
    stage: '',
    error: null,
    resultBlob: null,
    resultFileName: '',
  });

  const handleFilesAdded = (newFiles: File[]) => {
    // Filter valid image types
    const valid = newFiles.filter((f) => f.type.startsWith('image/'));
    const items: FileItem[] = valid.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl: URL.createObjectURL(file),
    }));

    setFiles((prev) => [...prev, ...items]);
    // Clear previous result
    setProgress((p) => ({ ...p, resultBlob: null, error: null }));
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= files.length) return;
    setFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    haptic.medium();
    setProgress({
      isProcessing: true,
      progress: 0,
      stage: 'Preparing images in browser memory...',
      error: null,
      resultBlob: null,
      resultFileName: '',
      originalTotalSize: files.reduce((acc, f) => acc + f.size, 0),
    });

    try {
      const rawFiles = files.map((f) => f.file);
      const convertOptions: ImageToPdfOptions = {
        ...options,
        compress: compressPdf,
        compressPreset: compressPdf ? compressPreset : 'none',
        customQuality,
        customMaxDimension,
      };

      const pdfBytes = await imageToPdf(rawFiles, convertOptions, (pct, msg) => {
        setProgress((prev) => ({
          ...prev,
          progress: pct,
          stage: msg,
        }));
      });

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const firstFileName = files[0].name.replace(/\.[^/.]+$/, '');
      const outName = files.length === 1 ? `${firstFileName}.pdf` : `BlackEYE_${files.length}_images.pdf`;

      haptic.success();
      setProgress((prev) => ({
        ...prev,
        isProcessing: false,
        progress: 100,
        stage: 'Conversion successful!',
        resultBlob: blob,
        resultFileName: outName,
        resultSize: blob.size,
      }));
    } catch (err: unknown) {
      haptic.error();
      setProgress((prev) => ({
        ...prev,
        isProcessing: false,
        error: (err as Error).message || 'Failed to convert images to PDF.',
      }));
    }
  };

  const savingsPercent =
    progress.originalTotalSize && progress.resultSize && progress.resultSize < progress.originalTotalSize
      ? Math.round(((progress.originalTotalSize - progress.resultSize) / progress.originalTotalSize) * 100)
      : 0;

  return (
    <div className="space-y-5 font-mono">
      {/* File Upload DropZone */}
      <DropZone
        accept="image/jpeg,image/png,image/webp,image/bmp"
        acceptLabel="JPG / PNG / WEBP"
        multiple={true}
        files={files}
        onFilesAdded={handleFilesAdded}
        onRemoveFile={handleRemoveFile}
        onReorderFiles={handleReorder}
        isProcessing={progress.isProcessing}
      />

      {/* Tool Options Configuration Panel */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-2 pb-2 mb-4 border-b border-neutral-100">
          <Settings2 className="w-4 h-4 text-orange-600" />
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
            PDF LAYOUT & FORMAT PARAMETERS
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          {/* Page Size */}
          <div>
            <label className="block text-neutral-700 font-semibold mb-1">PAGE SIZE</label>
            <select
              value={options.pageSize}
              onChange={(e) =>
                setOptions((o) => ({ ...o, pageSize: e.target.value as ImageToPdfOptions['pageSize'] }))
              }
              disabled={progress.isProcessing}
              className="w-full bg-white border border-neutral-300 text-neutral-900 rounded-lg p-2.5 font-mono text-xs focus:border-orange-500 focus:outline-none"
            >
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="LETTER">US Letter (8.5 × 11 in)</option>
              <option value="FIT">Fit Page to Image (Original)</option>
            </select>
          </div>

          {/* Orientation */}
          <div>
            <label className="block text-neutral-700 font-semibold mb-1">ORIENTATION</label>
            <select
              value={options.orientation}
              onChange={(e) =>
                setOptions((o) => ({
                  ...o,
                  orientation: e.target.value as ImageToPdfOptions['orientation'],
                }))
              }
              disabled={progress.isProcessing || options.pageSize === 'FIT'}
              className="w-full bg-white border border-neutral-300 text-neutral-900 rounded-lg p-2.5 font-mono text-xs focus:border-orange-500 focus:outline-none disabled:opacity-40"
            >
              <option value="auto">Auto (Match Image Ratio)</option>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>

          {/* Margins */}
          <div>
            <label className="block text-neutral-700 font-semibold mb-1">PAGE MARGIN</label>
            <select
              value={options.margin}
              onChange={(e) => setOptions((o) => ({ ...o, margin: Number(e.target.value) }))}
              disabled={progress.isProcessing || options.pageSize === 'FIT'}
              className="w-full bg-white border border-neutral-300 text-neutral-900 rounded-lg p-2.5 font-mono text-xs focus:border-orange-500 focus:outline-none disabled:opacity-40"
            >
              <option value="0">No Margin (Full Bleed)</option>
              <option value="18">Compact (18 pt)</option>
              <option value="36">Standard (36 pt)</option>
              <option value="54">Spacious (54 pt)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Compression Feature Panel for Image to PDF */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-orange-600" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
              PDF COMPRESSION / SIZE OPTIMIZATION
            </h4>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-mono font-bold select-none">
            <input
              type="checkbox"
              checked={compressPdf}
              onChange={(e) => setCompressPdf(e.target.checked)}
              disabled={progress.isProcessing}
              className="w-4 h-4 accent-orange-600 rounded cursor-pointer"
            />
            <span className={compressPdf ? 'text-orange-600' : 'text-neutral-500'}>
              {compressPdf ? 'COMPRESSION ACTIVE' : 'ENABLE COMPRESS'}
            </span>
          </label>
        </div>

        {compressPdf ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-600">Select compression preset:</span>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[11px] font-bold text-neutral-500 hover:text-black flex items-center gap-1 cursor-pointer transition"
              >
                <Sliders className="w-3 h-3" />
                <span>{showAdvanced ? 'HIDE CUSTOM' : 'CUSTOM PARAMETERS'}</span>
              </button>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setCompressPreset('recommended')}
                disabled={progress.isProcessing}
                className={`p-3 border rounded-lg text-left transition cursor-pointer font-mono ${
                  compressPreset === 'recommended'
                    ? 'border-orange-500 bg-orange-50/40 text-black shadow-xs'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs">
                  <span className="text-black">RECOMMENDED</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 border border-orange-200 text-orange-700 font-semibold">
                    BALANCED
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-neutral-500 leading-snug">
                  75% quality, 1800px max. Ideal balance between visual sharpness and small file size.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCompressPreset('extreme')}
                disabled={progress.isProcessing}
                className={`p-3 border rounded-lg text-left transition cursor-pointer font-mono ${
                  compressPreset === 'extreme'
                    ? 'border-orange-500 bg-orange-50/40 text-black shadow-xs'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs">
                  <span className="text-black">EXTREME</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 border border-red-200 text-red-700 font-semibold">
                    MAX SAVINGS
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-neutral-500 leading-snug">
                  50% quality, 1200px max. Aggressive compression for strict email & portal limits.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCompressPreset('light')}
                disabled={progress.isProcessing}
                className={`p-3 border rounded-lg text-left transition cursor-pointer font-mono ${
                  compressPreset === 'light'
                    ? 'border-orange-500 bg-orange-50/40 text-black shadow-xs'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs">
                  <span className="text-black">LIGHT</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 border border-green-200 text-green-700 font-semibold">
                    HIGH FIDELITY
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-neutral-500 leading-snug">
                  88% quality, 2400px max. Retains fine image details while reducing file size.
                </p>
              </button>
            </div>

            {/* Custom Sliders */}
            {showAdvanced && (
              <div className="mt-3 pt-3 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <div className="flex justify-between font-semibold text-neutral-700 mb-1">
                    <span>IMAGE QUALITY</span>
                    <span className="text-orange-600 font-bold">{Math.round(customQuality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="0.95"
                    step="0.05"
                    value={customQuality}
                    onChange={(e) => {
                      setCustomQuality(parseFloat(e.target.value));
                      setCompressPreset('custom');
                    }}
                    className="w-full accent-orange-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-neutral-700 mb-1">
                    <span>MAX DIMENSION CLAMP</span>
                    <span className="text-orange-600 font-bold">{customMaxDimension}px</span>
                  </div>
                  <input
                    type="range"
                    min="800"
                    max="3200"
                    step="200"
                    value={customMaxDimension}
                    onChange={(e) => {
                      setCustomMaxDimension(parseInt(e.target.value, 10));
                      setCompressPreset('custom');
                    }}
                    className="w-full accent-orange-600"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-neutral-500 font-mono">
            Check the box above to optimize and reduce the output PDF document size right as images are compiled.
          </p>
        )}

        {/* Action Button Strip */}
        <div className="mt-5 pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] font-mono text-neutral-500">
            {files.length > 0
              ? `${files.length} image${files.length > 1 ? 's' : ''} queued (${formatBytes(files.reduce((acc, f) => acc + f.size, 0))})`
              : 'Add one or more images to proceed'}
          </div>

          <button
            type="button"
            onClick={handleConvert}
            disabled={files.length === 0 || progress.isProcessing}
            className="w-full sm:w-auto px-6 py-2.5 bg-orange-600 text-white text-xs font-mono font-bold rounded-lg hover:bg-orange-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition shadow-xs flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
          >
            {progress.isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>PROCESSING...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{compressPdf ? 'COMPRESS & CONVERT TO PDF' : 'CONVERT TO PDF'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress & Result Display */}
      {progress.isProcessing && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 shadow-xs">
          <div className="flex justify-between text-xs font-mono mb-2">
            <span className="font-bold text-neutral-900 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-600" />
              {progress.stage}
            </span>
            <span className="font-bold text-orange-600">{progress.progress}%</span>
          </div>
          <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-600 transition-all duration-200"
              style={{ width: `${progress.progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {progress.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-xs text-red-800 font-mono text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold uppercase tracking-wider text-red-900">Conversion Interrupted</p>
            <p className="mt-1 text-red-700">{progress.error}</p>
          </div>
        </div>
      )}

      {/* Download Success Banner (Green) */}
      {progress.resultBlob && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-5 shadow-xs text-green-900 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <h4 className="text-sm font-bold uppercase text-black">
                  PDF Generated Successfully
                </h4>
                {savingsPercent > 0 && (
                  <span className="px-2 py-0.5 bg-orange-600 text-white text-xs font-bold rounded">
                    -{savingsPercent}% REDUCED
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-neutral-600 pt-1">
                <span>
                  Original Images: <strong className="text-black">{formatBytes(progress.originalTotalSize || 0)}</strong>
                </span>
                <span>→</span>
                <span>
                  Final PDF: <strong className="text-green-700 font-bold">{formatBytes(progress.resultSize || 0)}</strong>
                </span>
                {progress.originalTotalSize && progress.resultSize && progress.resultSize < progress.originalTotalSize ? (
                  <span className="text-green-700 font-semibold">
                    (Saved {formatBytes(progress.originalTotalSize - progress.resultSize)})
                  </span>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                haptic.success();
                if (progress.resultBlob && progress.resultFileName) {
                  downloadBlob(progress.resultBlob, progress.resultFileName);
                }
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 active:scale-95 transition shadow-xs flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
