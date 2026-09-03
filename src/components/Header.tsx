import React, { useState } from 'react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';
import { ToolMode } from '../types';
import { Eye, Shield, Download, Wifi, WifiOff, FileText, Image, Layers, Lock, Cpu } from 'lucide-react';

interface HeaderProps {
  currentMode: ToolMode;
  onSelectMode: (mode: ToolMode) => void;
  onOpenSpecs?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const tools: { id: ToolMode; label: string; tag: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'image-to-pdf', label: 'IMAGE TO PDF', tag: '01', icon: Image },
    { id: 'merge-split', label: 'MERGE & SPLIT', tag: '02', icon: Layers },
    { id: 'protect-unlock', label: 'PROTECT & UNLOCK', tag: '03', icon: Lock },
    { id: 'compress-pdf', label: 'COMPRESS PDF', tag: '04', icon: Cpu },
  ];

  return (
    <header className="border-b border-neutral-200 bg-white sticky top-0 z-40 shadow-xs">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3 sm:gap-4">
          <img
            src="/logo.png"
            alt="BlackEYE Brand Logo"
            className="w-9 h-9 sm:w-10 sm:h-10 object-contain shrink-0"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-black font-mono">
                BlackEYE <span className="text-orange-600 font-semibold text-xs sm:text-sm">// PDF CONVERTER</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Right Actions: Clean and Minimal */}
        <div className="flex items-center gap-3">
          {/* Privacy Badge (Green) */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="hidden sm:inline">100% Client-Side Private</span>
            <span className="sm:hidden">Private</span>
          </div>

          {/* Offline indicator if disconnected */}
          {!isOnline && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
              <span>Offline Mode</span>
            </div>
          )}

          {/* PWA Install Button (Orange) */}
          {isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-orange-600 text-white hover:bg-orange-700 transition shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>INSTALL</span>
            </button>
          )}

          {isIOS && !isInstalled && (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="px-2.5 py-1 text-xs font-mono border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-800 hover:bg-neutral-100"
            >
              INSTALL ON iOS
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tool Strip (Responsive Mobile & Tablet quick switcher) */}
      <div className="border-t border-neutral-200 bg-neutral-50 lg:hidden">
        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto no-scrollbar">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = currentMode === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => onSelectMode(tool.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono font-semibold transition border-r border-neutral-200 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-orange-600 text-white font-bold'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-black'
                }`}
              >
                <span className={`text-[10px] ${isActive ? 'text-white/80' : 'text-neutral-400'}`}>
                  [{tool.tag}]
                </span>
                <Icon className="w-3.5 h-3.5" />
                <span>{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* iOS Install Guide Dialog */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-xl p-6 shadow-xl text-neutral-900">
            <h3 className="text-base font-bold font-mono text-black uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-600"></span>
              Install on iOS Safari
            </h3>
            <p className="mt-3 text-xs text-neutral-600 font-mono leading-relaxed">
              1. Tap the <strong className="text-black">Share</strong> button on the Safari bottom bar.<br />
              2. Scroll down and choose <strong className="text-orange-600">Add to Home Screen</strong>.<br />
              3. The app executes 100% locally with zero server calls.
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full py-2 bg-black text-white text-xs font-mono font-bold rounded-lg hover:bg-neutral-800 transition cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
