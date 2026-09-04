import React, { useRef } from 'react';
import { UploadCloud, File, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { FileItem } from '../types';
import { formatBytes } from '../utils/pdfServices';
import { haptic } from '../utils/haptics';

interface DropZoneProps {
  accept: string;
  acceptLabel: string;
  multiple?: boolean;
  files: FileItem[];
  onFilesAdded: (newFiles: File[]) => void;
  onRemoveFile: (id: string) => void;
  onReorderFiles?: (fromIndex: number, toIndex: number) => void;
  isProcessing: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  accept,
  acceptLabel,
  multiple = true,
  files,
  onFilesAdded,
  onRemoveFile,
  onReorderFiles,
  isProcessing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      haptic.success();
      onFilesAdded(droppedFiles);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      haptic.success();
      onFilesAdded(selected);
      // Reset input value so re-selecting same file triggers change
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Dashed Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed border-neutral-300/90 rounded-2xl bg-neutral-50/50 p-5 sm:p-8 md:p-10 transition-all cursor-pointer group ${
          isDragOver
            ? 'border-orange-500 bg-orange-50/30 scale-[0.995]'
            : 'hover:border-orange-500/70 hover:bg-orange-50/10 active:scale-[0.995]'
        } ${isProcessing ? 'opacity-60 pointer-events-none' : ''}`}
        onClick={() => {
          haptic.light();
          fileInputRef.current?.click();
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center text-center">
          {/* Central Icon Box */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 transition-transform shadow-xs">
            <UploadCloud className="w-6 h-6 sm:w-7 sm:h-7 text-orange-600" strokeWidth={2} />
          </div>

          <h3 className="text-xs sm:text-base font-bold font-mono tracking-tight text-neutral-950 uppercase mb-1">
            DROP {acceptLabel.split('/')[0]} FILES HERE OR CLICK TO BROWSE
          </h3>
          <p className="text-[11px] sm:text-xs font-mono text-neutral-500 max-w-md">
            Zero data uploaded. 100% processed safely in your browser.
          </p>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              haptic.light();
              fileInputRef.current?.click();
            }}
            disabled={isProcessing}
            className="mt-3 sm:mt-4 px-4 sm:px-5 py-2.5 bg-neutral-950 text-white text-xs font-mono font-bold rounded-lg hover:bg-neutral-800 active:scale-95 transition shadow-xs flex items-center gap-2 uppercase tracking-wide cursor-pointer"
          >
            <span>BROWSE FILES</span>
          </button>
        </div>

        {/* Technical Chips Strip at Bottom */}
        <div className="mt-5 sm:mt-6 pt-3 sm:pt-4 border-t border-neutral-200/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-neutral-600">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 border border-neutral-200 bg-white text-neutral-700 rounded font-medium">
              FORMAT: {acceptLabel}
            </span>
          </div>
          <span className="font-bold text-orange-600">
            {files.length} {files.length === 1 ? 'FILE READY' : 'FILES READY'}
          </span>
        </div>
      </div>

      {/* Selected Files List */}
      {files.length > 0 && (
        <div className="bg-neutral-50/80 border border-neutral-200/90 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between pb-2 mb-2 sm:mb-3 border-b border-neutral-200/80">
            <span className="text-xs font-mono font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>QUEUE MANIFEST</span>
              <span className="text-orange-600">({files.length})</span>
            </span>
            {files.length > 1 && (
              <span className="text-[11px] font-mono text-neutral-500 hidden sm:inline">
                Drag or use arrows to change sequence order
              </span>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {files.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2.5 p-2 sm:p-2.5 bg-white border border-neutral-200 hover:border-neutral-300 rounded-lg transition text-xs font-mono shadow-xs"
              >
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                  <span className="w-4 sm:w-5 text-orange-600 font-bold text-[10px]">
                    #{index + 1}
                  </span>
                  <div className="w-8 h-8 shrink-0 bg-neutral-100 border border-neutral-200 rounded flex items-center justify-center overflow-hidden">
                    {item.previewUrl ? (
                      <img
                        src={item.previewUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <File className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-neutral-900">{item.name}</p>
                    <p className="text-[10px] text-neutral-500">
                      {formatBytes(item.size)}
                      {item.pageCount ? ` • ${item.pageCount} pages` : ''}
                    </p>
                  </div>
                </div>

                {/* Actions: Reorder & Delete */}
                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                  {onReorderFiles && files.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          onReorderFiles(index, index - 1);
                        }}
                        disabled={index === 0 || isProcessing}
                        className="p-2 text-neutral-500 hover:text-black active:scale-90 disabled:opacity-30 cursor-pointer rounded hover:bg-neutral-100 min-w-[36px] min-h-[36px] flex items-center justify-center"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          onReorderFiles(index, index + 1);
                        }}
                        disabled={index === files.length - 1 || isProcessing}
                        className="p-2 text-neutral-500 hover:text-black active:scale-90 disabled:opacity-30 cursor-pointer rounded hover:bg-neutral-100 min-w-[36px] min-h-[36px] flex items-center justify-center"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      haptic.light();
                      onRemoveFile(item.id);
                    }}
                    disabled={isProcessing}
                    className="p-2 text-neutral-400 hover:text-red-600 active:scale-90 disabled:opacity-30 ml-0.5 cursor-pointer rounded hover:bg-red-50 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
                    title="Remove File"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
