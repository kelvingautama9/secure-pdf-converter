import React from 'react';
import { ToolMode, FileItem } from '../types';
import { ShieldCheck, HardDrive, Layers, Image, Lock, Cpu } from 'lucide-react';
import { formatBytes } from '../utils/pdfServices';

interface SidebarStatusProps {
  currentMode: ToolMode;
  onSelectMode?: (mode: ToolMode) => void;
  files?: FileItem[];
  isProcessing?: boolean;
}

export const SidebarStatus: React.FC<SidebarStatusProps> = ({
  currentMode,
  onSelectMode,
  files = [],
  isProcessing = false,
}) => {
  const totalQueueBytes = files.reduce((acc, f) => acc + f.size, 0);

  const tools: { id: ToolMode; label: string; tag: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'image-to-pdf', label: 'IMAGE TO PDF', tag: '01', icon: Image },
    { id: 'merge-split', label: 'MERGE & SPLIT', tag: '02', icon: Layers },
    { id: 'protect-unlock', label: 'PROTECT & UNLOCK', tag: '03', icon: Lock },
    { id: 'compress-pdf', label: 'COMPRESS PDF', tag: '04', icon: Cpu },
  ];

  return (
    <div className="space-y-4 font-mono">
      {/* Tool Navigation Menu */}
      <div className="bg-white border border-neutral-200 p-4 rounded-xl shadow-xs">
        <h2 className="text-xs font-bold text-neutral-400 uppercase mb-3 tracking-wider flex items-center justify-between">
          <span className="text-black">PDF TOOLS</span>
          <span className="text-[10px] text-green-600 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Client-Side
          </span>
        </h2>
        <div className="space-y-1.5">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = currentMode === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onSelectMode && onSelectMode(tool.id)}
                className={`w-full text-left p-3 rounded-lg text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-neutral-50 border border-neutral-200 text-neutral-800 hover:bg-neutral-100 hover:text-black'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                  <span>{tool.label}</span>
                </div>
                <span className={`text-[10px] ${isActive ? 'text-white/80' : 'text-neutral-400'}`}>
                  [{tool.tag}]
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Privacy Guarantee Card (Green Accent) */}
      <div className="bg-green-50/60 border border-green-200 p-4 rounded-xl text-neutral-900 shadow-xs">
        <div className="flex items-center gap-2 text-green-800 font-bold text-xs uppercase mb-2">
          <ShieldCheck className="w-4 h-4 text-green-600" />
          <span>Privacy Guarantee</span>
        </div>
        <p className="text-xs leading-relaxed text-neutral-600">
          All files are processed <strong className="text-neutral-900 font-semibold">100% locally</strong> inside your browser. No files are ever sent to any remote server or stored in the cloud.
        </p>
        <div className="mt-3 pt-2.5 border-t border-green-200/60 flex items-center justify-between text-[11px] text-green-700 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Zero Outbound Traffic
          </span>
          <span className="text-[10px] uppercase font-bold text-green-800">Secure</span>
        </div>
      </div>

      {/* Queue Summary (Only when files are loaded) */}
      {files.length > 0 && (
        <div className="bg-white border border-neutral-200 p-4 rounded-xl text-xs shadow-xs">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-neutral-100">
            <span className="text-neutral-700 font-bold flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-orange-600" />
              QUEUE SUMMARY
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-bold">
              {isProcessing ? 'PROCESSING' : 'READY'}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>Staged Files:</span>
              <span className="font-bold text-black">{files.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Size:</span>
              <span className="font-bold text-black">{formatBytes(totalQueueBytes)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
