import React from 'react';
import { X, Shield, Terminal, HardDrive, Globe, CheckCircle, Cpu } from 'lucide-react';

interface EngineSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EngineSpecsModal: React.FC<EngineSpecsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs font-mono">
      <div className="bg-[#141414] border border-[#262626] rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl text-[#e5e5e5] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#1a1a1a] text-white border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              BLACKEYE ENGINE ARCHITECTURE & SECURITY SPECIFICATION
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#262626] text-[#888] hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-[#ccc]">
          {/* Section 1: 100% Client-Side Guarantee */}
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-4">
            <div className="flex items-center gap-2 text-white font-bold uppercase mb-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span>100% Client-Side Privacy Isolation</span>
            </div>
            <p className="leading-relaxed text-[#999]">
              Unlike commercial PDF services that upload your private documents to third-party cloud servers, 
              <strong className="text-white"> BlackEYE executes 100% of processing in your browser RAM</strong>. Open DevTools (F12 → Network tab) 
              during any operation: you will observe zero data packets leaving your machine.
            </p>
          </div>

          {/* Section 2: GitHub Pages & PWA Hosting Setup */}
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-4">
            <div className="flex items-center gap-2 text-white font-bold uppercase mb-2">
              <Globe className="w-4 h-4 text-yellow-400" />
              <span>GitHub Pages & PWA Static Deployment</span>
            </div>
            <p className="leading-relaxed text-[#999] mb-3">
              This repository is pre-configured for static deployment on GitHub Pages without server-side routing failures:
            </p>
            <ul className="space-y-1.5 text-[11px] text-[#888] list-disc list-inside">
              <li>
                <strong className="text-white">Base URL:</strong> Configured via <code className="bg-[#111] px-1 py-0.5 rounded border border-[#333] text-yellow-400">process.env.VITE_BASE_URL || './'</code> so assets resolve correctly in any subfolder path (e.g. <code className="bg-[#111] px-1 py-0.5 rounded border border-[#333] text-yellow-400">/blackeye-pdf/</code>).
              </li>
              <li>
                <strong className="text-white">HashRouter:</strong> URL routes are hashed (<code className="bg-[#111] px-1 py-0.5 rounded border border-[#333] text-yellow-400">#/tool</code>), completely immune to 404 page refreshes on static hosts.
              </li>
              <li>
                <strong className="text-white">Service Worker (Workbox):</strong> Pre-caches all scripts, styles, HTML, and icons for full offline support.
              </li>
              <li>
                <strong className="text-white">GitHub Actions:</strong> Run <code className="bg-[#111] px-1 py-0.5 rounded border border-[#333] text-yellow-400">npm run build</code> and publish the generated <code className="bg-[#111] px-1 py-0.5 rounded border border-[#333] text-yellow-400">dist/</code> folder directly to <code className="bg-[#111] px-1 py-0.5 rounded border border-[#333] text-yellow-400">gh-pages</code>.
              </li>
            </ul>
          </div>

          {/* Section 3: Browser RAM & Large File Safeguards */}
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg p-4">
            <div className="flex items-center gap-2 text-white font-bold uppercase mb-2">
              <HardDrive className="w-4 h-4 text-yellow-400" />
              <span>Browser Memory & Heap Safeguards</span>
            </div>
            <p className="leading-relaxed text-[#999] mb-2">
              Browsers impose a strict V8 heap memory ceiling (~1.5GB to 2GB per tab). To prevent crashes:
            </p>
            <ul className="space-y-1 text-[11px] text-[#888] list-disc list-inside">
              <li>Single file guard: Recommended safe ceiling of 150MB per batch.</li>
              <li>Async yield slicing: PDF manipulation loops yield execution back to the browser event loop (<code className="bg-[#111] px-1 py-0.5 rounded border border-[#333] text-yellow-400">yieldToMain</code>) to prevent UI thread lockups.</li>
              <li>Memory cleanup: Object URLs are automatically revoked post-download to trigger garbage collection.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#1a1a1a] border-t border-[#262626] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-yellow-400 text-black text-xs font-bold rounded hover:bg-yellow-300 transition cursor-pointer"
          >
            CLOSE SPECIFICATIONS
          </button>
        </div>
      </div>
    </div>
  );
};
