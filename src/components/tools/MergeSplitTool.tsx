import React, { useState } from 'react';
import { DropZone } from '../DropZone';
import { FileItem, MergeSplitOptions, ProgressState } from '../../types';
import {
  mergePdfs,
  splitPdf,
  downloadBlob,
  formatBytes,
  getPdfPageCount,
} from '../../utils/pdfServices';
import { haptic } from '../../utils/haptics';
import {
  Layers,
  Scissors,
  Download,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Info,
} from 'lucide-react';

export const MergeSplitTool: React.FC = () => {
  const [subTab, setSubTab] = useState<'merge' | 'split'>('merge');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [splitOptions, setSplitOptions] = useState<MergeSplitOptions>({
    mode: 'split-range',
    range: '1-2',
  });

  const [progress, setProgress] = useState<ProgressState>({
    isProcessing: false,
    progress: 0,
    stage: '',
    error: null,
    resultBlob: null,
    resultFileName: '',
  });

  const [splitResults, setSplitResults] = useState<{ blob: Blob; fileName: string }[]>([]);

  const handleFilesAdded = async (newFiles: File[]) => {
    const valid = newFiles.filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    const items: FileItem[] = [];
    for (const file of valid) {
      const pageCount = await getPdfPageCount(file);
      items.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        pageCount,
      });
    }

    if (subTab === 'split') {
      // Split mode works on 1 primary document at a time
      setFiles(items.slice(0, 1));
      if (items[0] && items[0].pageCount) {
        setSplitOptions((s) => ({
          ...s,
          range: `1-${Math.min(items[0].pageCount || 1, 3)}`,
        }));
      }
    } else {
      setFiles((prev) => [...prev, ...items]);
    }

    setProgress((p) => ({ ...p, resultBlob: null, error: null }));
    setSplitResults([]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
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

  const handleExecute = async () => {
    if (files.length === 0) return;

    haptic.medium();
    setProgress({
      isProcessing: true,
      progress: 0,
      stage: 'Initializing PDF operation...',
      error: null,
      resultBlob: null,
      resultFileName: '',
    });
    setSplitResults([]);

    try {
      if (subTab === 'merge') {
        if (files.length < 2) {
          throw new Error('Please select at least 2 PDF files to merge.');
        }

        const rawFiles = files.map((f) => f.file);
        const mergedBytes = await mergePdfs(rawFiles, (pct, msg) => {
          setProgress((prev) => ({ ...prev, progress: pct, stage: msg }));
        });

        const blob = new Blob([mergedBytes], { type: 'application/pdf' });
        const outName = `BlackEYE_Merged_${files.length}_docs.pdf`;

        haptic.success();
        setProgress((prev) => ({
          ...prev,
          isProcessing: false,
          progress: 100,
          stage: 'Merge complete!',
          resultBlob: blob,
          resultFileName: outName,
          resultSize: blob.size,
        }));
      } else {
        // Split mode
        const targetFile = files[0].file;
        const results = await splitPdf(targetFile, splitOptions, (pct, msg) => {
          setProgress((prev) => ({ ...prev, progress: pct, stage: msg }));
        });

        setSplitResults(results);
        haptic.success();

        if (results.length === 1) {
          setProgress((prev) => ({
            ...prev,
            isProcessing: false,
            progress: 100,
            stage: 'Split completed!',
            resultBlob: results[0].blob,
            resultFileName: results[0].fileName,
            resultSize: results[0].blob.size,
          }));
        } else {
          setProgress((prev) => ({
            ...prev,
            isProcessing: false,
            progress: 100,
            stage: `Split into ${results.length} files successfully!`,
          }));
        }
      }
    } catch (err: unknown) {
      haptic.error();
      setProgress((prev) => ({
        ...prev,
        isProcessing: false,
        error: (err as Error).message || 'Failed processing PDF operation.',
      }));
    }
  };

  return (
    <div className="space-y-5 font-mono">
      {/* Sub-tab Mode Switcher */}
      <div className="flex border border-neutral-200 bg-neutral-100 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            setSubTab('merge');
            setProgress((p) => ({ ...p, resultBlob: null, error: null }));
            setSplitResults([]);
          }}
          className={`flex-1 py-2 text-xs font-mono font-bold flex items-center justify-center gap-2 rounded-lg transition cursor-pointer ${
            subTab === 'merge'
              ? 'bg-white text-black shadow-xs'
              : 'text-neutral-600 hover:text-black'
          }`}
        >
          <Layers className={`w-3.5 h-3.5 ${subTab === 'merge' ? 'text-orange-600' : ''}`} />
          <span>MERGE MULTIPLE PDFS</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptic.selection();
            setSubTab('split');
            if (files.length > 1) setFiles([files[0]]);
            setProgress((p) => ({ ...p, resultBlob: null, error: null }));
            setSplitResults([]);
          }}
          className={`flex-1 py-2 text-xs font-mono font-bold flex items-center justify-center gap-2 rounded-lg transition cursor-pointer ${
            subTab === 'split'
              ? 'bg-white text-black shadow-xs'
              : 'text-neutral-600 hover:text-black'
          }`}
        >
          <Scissors className={`w-3.5 h-3.5 ${subTab === 'split' ? 'text-orange-600' : ''}`} />
          <span>SPLIT & EXTRACT PAGES</span>
        </button>
      </div>

      {/* DropZone */}
      <DropZone
        accept="application/pdf,.pdf"
        acceptLabel="PDF"
        multiple={subTab === 'merge'}
        files={files}
        onFilesAdded={handleFilesAdded}
        onRemoveFile={handleRemoveFile}
        onReorderFiles={subTab === 'merge' ? handleReorder : undefined}
        isProcessing={progress.isProcessing}
      />

      {/* Split Specific Controls */}
      {subTab === 'split' && files.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-100 text-xs font-mono">
            <span className="font-bold uppercase text-black">
              SPLIT SPECIFICATION — {files[0].name} ({files[0].pageCount} Pages)
            </span>
            <span className="text-[10px] text-orange-600 font-bold">1-BASED INDEX</span>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-800">
                <input
                  type="radio"
                  name="splitMode"
                  checked={splitOptions.mode === 'split-range'}
                  onChange={() => setSplitOptions((s) => ({ ...s, mode: 'split-range' }))}
                  className="accent-orange-600"
                />
                <span className="font-semibold text-black">Custom Page Range</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-neutral-800">
                <input
                  type="radio"
                  name="splitMode"
                  checked={splitOptions.mode === 'split-all'}
                  onChange={() => setSplitOptions((s) => ({ ...s, mode: 'split-all' }))}
                  className="accent-orange-600"
                />
                <span className="font-semibold text-black">
                  Split Every Page into Individual PDFs
                </span>
              </label>
            </div>

            {splitOptions.mode === 'split-range' && (
              <div className="mt-2">
                <label className="block text-neutral-600 mb-1">
                  Specify pages or ranges (e.g. <code>1-3, 5, 7-{files[0].pageCount}</code>):
                </label>
                <input
                  type="text"
                  value={splitOptions.range}
                  onChange={(e) => setSplitOptions((s) => ({ ...s, range: e.target.value }))}
                  placeholder={`e.g. 1-${Math.min(files[0].pageCount || 1, 3)}`}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 rounded-lg p-2.5 font-mono text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="text-xs font-mono text-neutral-500">
          {subTab === 'merge'
            ? `${files.length} PDF files staged for concatenation`
            : files.length > 0
            ? `Ready to split ${files[0].name}`
            : 'Select PDF file(s) to continue'}
        </div>

        <button
          type="button"
          onClick={handleExecute}
          disabled={
            progress.isProcessing ||
            (subTab === 'merge' ? files.length < 2 : files.length === 0)
          }
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
              <span>{subTab === 'merge' ? 'MERGE PDFS' : 'SPLIT PDF'}</span>
            </>
          )}
        </button>
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
            <p className="font-bold uppercase tracking-wider text-red-900">Operation Interrupted</p>
            <p className="mt-1 text-red-700">{progress.error}</p>
          </div>
        </div>
      )}

      {/* Single Result Download (Green) */}
      {progress.resultBlob && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-5 shadow-xs text-green-900 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
              <div>
                <h4 className="text-sm font-bold uppercase text-black">
                  Output Assembled Successfully
                </h4>
                <p className="text-xs text-neutral-600 mt-0.5">
                  Output: <span className="text-black font-semibold">{progress.resultFileName}</span> • Size: <span className="text-green-700 font-bold">{formatBytes(progress.resultSize || 0)}</span>
                </p>
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

      {/* Multi-Split Results List */}
      {splitResults.length > 1 && (
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-100 text-xs font-mono">
            <span className="font-bold uppercase text-black">
              SPLIT RESULTS ({splitResults.length} PAGES READY)
            </span>
            <button
              type="button"
              onClick={() => {
                haptic.success();
                splitResults.forEach((res, i) => {
                  setTimeout(() => downloadBlob(res.blob, res.fileName), i * 200);
                });
              }}
              className="text-[11px] font-bold text-orange-600 hover:text-orange-700 underline cursor-pointer"
            >
              DOWNLOAD ALL (BATCH)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 text-xs font-mono">
            {splitResults.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg"
              >
                <div className="truncate pr-2">
                  <span className="font-semibold text-neutral-900 block truncate">{item.fileName}</span>
                  <span className="text-[10px] text-neutral-500 block">
                    {formatBytes(item.blob.size)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    haptic.success();
                    downloadBlob(item.blob, item.fileName);
                  }}
                  className="px-3 py-1.5 bg-green-600 text-white text-[10px] font-bold rounded-md shrink-0 hover:bg-green-700 active:scale-95 transition cursor-pointer"
                >
                  SAVE
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
