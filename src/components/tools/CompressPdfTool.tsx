import React, { useState } from 'react';
import { DropZone } from '../DropZone';
import { FileItem, CompressOptions, ProgressState } from '../../types';
import { compressPdf, downloadBlob, formatBytes } from '../../utils/pdfServices';
import {
  Cpu,
  Download,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  TrendingDown,
  Sparkles,
} from 'lucide-react';

export const CompressPdfTool: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [preset, setPreset] = useState<'extreme' | 'recommended' | 'light'>('recommended');
  const [customQuality, setCustomQuality] = useState(0.65);
  const [customDimension, setCustomDimension] = useState(1600);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [progress, setProgress] = useState<ProgressState>({
    isProcessing: false,
    progress: 0,
    stage: '',
    error: null,
    resultBlob: null,
    resultFileName: '',
    originalTotalSize: 0,
    resultSize: 0,
  });

  const [savingsPercent, setSavingsPercent] = useState<number>(0);

  const handleFilesAdded = (newFiles: File[]) => {
    const valid = newFiles.filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );
    if (valid.length === 0) return;

    const targetFile = valid[0];
    setFiles([
      {
        id: Math.random().toString(36).substring(2, 9),
        file: targetFile,
        name: targetFile.name,
        size: targetFile.size,
        type: targetFile.type,
      },
    ]);

    setProgress((p) => ({
      ...p,
      resultBlob: null,
      error: null,
      originalTotalSize: targetFile.size,
    }));
    setSavingsPercent(0);
  };

  const handleRemoveFile = () => {
    setFiles([]);
    setProgress((p) => ({ ...p, resultBlob: null, error: null }));
    setSavingsPercent(0);
  };

  const handlePresetSelect = (selected: 'extreme' | 'recommended' | 'light') => {
    setPreset(selected);
    if (selected === 'extreme') {
      setCustomQuality(0.35);
      setCustomDimension(1100);
    } else if (selected === 'recommended') {
      setCustomQuality(0.65);
      setCustomDimension(1600);
    } else {
      setCustomQuality(0.85);
      setCustomDimension(2200);
    }
  };

  const handleCompress = async () => {
    if (files.length === 0) return;
    const targetFile = files[0].file;

    setProgress({
      isProcessing: true,
      progress: 0,
      stage: 'Scanning PDF streams...',
      error: null,
      resultBlob: null,
      resultFileName: '',
      originalTotalSize: targetFile.size,
      resultSize: 0,
    });

    try {
      const options: CompressOptions = {
        preset,
        quality: customQuality,
        maxDimension: customDimension,
      };

      const result = await compressPdf(targetFile, options, (pct, msg) => {
        setProgress((prev) => ({ ...prev, progress: pct, stage: msg }));
      });

      const blob = new Blob([result.bytes], { type: 'application/pdf' });
      const outName = targetFile.name.replace(/\.pdf$/i, '_compressed.pdf');

      setSavingsPercent(result.savingsPercent);
      setProgress((prev) => ({
        ...prev,
        isProcessing: false,
        progress: 100,
        stage: 'Optimization complete!',
        resultBlob: blob,
        resultFileName: outName,
        resultSize: result.compressedSize,
      }));
    } catch (err: unknown) {
      setProgress((prev) => ({
        ...prev,
        isProcessing: false,
        error: (err as Error).message || 'PDF compression encountered an issue.',
      }));
    }
  };

  return (
    <div className="space-y-5 font-mono">
      {/* DropZone */}
      <DropZone
        accept="application/pdf,.pdf"
        acceptLabel="PDF"
        multiple={false}
        files={files}
        onFilesAdded={handleFilesAdded}
        onRemoveFile={handleRemoveFile}
        isProcessing={progress.isProcessing}
      />

      {/* Compression Presets Panel */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between pb-2 mb-4 border-b border-neutral-100 text-xs font-mono">
          <span className="font-bold uppercase text-black flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-orange-600" />
            COMPRESSION STRATEGY PRESETS
          </span>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[11px] font-bold text-neutral-500 hover:text-black flex items-center gap-1 transition cursor-pointer"
          >
            <Sliders className="w-3 h-3" />
            <span>{showAdvanced ? 'HIDE ADVANCED' : 'CUSTOM PARAMS'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          {/* Extreme */}
          <button
            type="button"
            onClick={() => handlePresetSelect('extreme')}
            disabled={progress.isProcessing}
            className={`p-3.5 border rounded-lg text-left transition cursor-pointer ${
              preset === 'extreme'
                ? 'border-orange-500 bg-orange-50/40 text-black shadow-xs'
                : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300'
            }`}
          >
            <div className="flex items-center justify-between font-bold uppercase">
              <span className="text-black">EXTREME</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 border border-red-200 text-red-700 font-semibold">MAX REDUCTION</span>
            </div>
            <p className="mt-1.5 text-[11px] text-neutral-500 leading-snug">
              Strong image downsampling. Recommended for email attachments and strict upload limits.
            </p>
          </button>

          {/* Recommended */}
          <button
            type="button"
            onClick={() => handlePresetSelect('recommended')}
            disabled={progress.isProcessing}
            className={`p-3.5 border rounded-lg text-left transition cursor-pointer ${
              preset === 'recommended'
                ? 'border-orange-500 bg-orange-50/40 text-black shadow-xs'
                : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300'
            }`}
          >
            <div className="flex items-center justify-between font-bold uppercase">
              <span className="text-black">RECOMMENDED</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 border border-orange-200 text-orange-700 font-semibold">BALANCED</span>
            </div>
            <p className="mt-1.5 text-[11px] text-neutral-500 leading-snug">
              Optimal balance between high visual clarity and substantial file size savings.
            </p>
          </button>

          {/* Light */}
          <button
            type="button"
            onClick={() => handlePresetSelect('light')}
            disabled={progress.isProcessing}
            className={`p-3.5 border rounded-lg text-left transition cursor-pointer ${
              preset === 'light'
                ? 'border-orange-500 bg-orange-50/40 text-black shadow-xs'
                : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300'
            }`}
          >
            <div className="flex items-center justify-between font-bold uppercase">
              <span className="text-black">LIGHT</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 border border-green-200 text-green-700 font-semibold">HIGH FIDELITY</span>
            </div>
            <p className="mt-1.5 text-[11px] text-neutral-500 leading-snug">
              Lossless stream compaction & light re-encoding. Best for presentations and prints.
            </p>
          </button>
        </div>

        {/* Advanced Slider Overrides */}
        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="flex justify-between font-semibold text-neutral-700 mb-1">
                <span>IMAGE COMPRESSION QUALITY</span>
                <span className="text-orange-600 font-bold">{Math.round(customQuality * 100)}%</span>
              </label>
              <input
                type="range"
                min="0.2"
                max="0.95"
                step="0.05"
                value={customQuality}
                onChange={(e) => setCustomQuality(parseFloat(e.target.value))}
                className="w-full accent-orange-600"
              />
            </div>

            <div>
              <label className="flex justify-between font-semibold text-neutral-700 mb-1">
                <span>MAX IMAGE RESOLUTION CLAMP</span>
                <span className="text-orange-600 font-bold">{customDimension}px</span>
              </label>
              <input
                type="range"
                min="800"
                max="3000"
                step="200"
                value={customDimension}
                onChange={(e) => setCustomDimension(parseInt(e.target.value, 10))}
                className="w-full accent-orange-600"
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-5 pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-mono text-neutral-500">
            {files.length > 0
              ? `Target: ${files[0].name} (${formatBytes(files[0].size)})`
              : 'Select a PDF document to optimize'}
          </div>

          <button
            type="button"
            onClick={handleCompress}
            disabled={files.length === 0 || progress.isProcessing}
            className="px-6 py-2.5 bg-orange-600 text-white text-xs font-mono font-bold rounded-lg hover:bg-orange-700 active:translate-y-0.5 disabled:opacity-40 disabled:pointer-events-none transition shadow-xs flex items-center gap-2 uppercase tracking-wide cursor-pointer"
          >
            {progress.isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>COMPRESSING IN RAM...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>OPTIMIZE & COMPRESS</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress */}
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

      {/* Error */}
      {progress.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-xs text-red-800 font-mono text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold uppercase tracking-wider text-red-900">Compression Issue</p>
            <p className="mt-1 text-red-700">{progress.error}</p>
          </div>
        </div>
      )}

      {/* Savings & Download Banner */}
      {progress.resultBlob && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 shadow-xs text-green-900 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <h4 className="text-sm font-bold uppercase text-black">
                  Compression Pipeline Complete
                </h4>
                {savingsPercent > 0 && (
                  <span className="px-2 py-0.5 bg-orange-600 text-white text-xs font-bold rounded">
                    -{savingsPercent}% REDUCED
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600 pt-1">
                <span>
                  Original: <strong className="text-black">{formatBytes(progress.originalTotalSize || 0)}</strong>
                </span>
                <span>→</span>
                <span>
                  New Size: <strong className="text-green-700">{formatBytes(progress.resultSize || 0)}</strong>
                </span>
                {progress.originalTotalSize && progress.resultSize ? (
                  <span className="text-green-700 font-semibold">
                    (Saved {formatBytes(Math.max(0, progress.originalTotalSize - progress.resultSize))})
                  </span>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (progress.resultBlob && progress.resultFileName) {
                  downloadBlob(progress.resultBlob, progress.resultFileName);
                }
              }}
              className="px-5 py-2.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition shadow-xs flex items-center gap-2 uppercase tracking-wide cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD OPTIMIZED PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
