import React, { useState } from 'react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';
import { ToolMode } from '../types';
import { Eye, Download, WifiOff, Image, Layers, Lock, Cpu } from 'lucide-react';
import logoUrl from '../assets/logo.png';
import { haptic } from '../utils/haptics';

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
  const [logoError, setLogoError] = useState(false);

  const tools: { id: ToolMode; label: string; shortLabel: string; tag: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'image-to-pdf', label: 'IMAGE TO PDF', shortLabel: 'Image → PDF', tag: '01', icon: Image },
    { id: 'merge-split', label: 'MERGE & SPLIT', shortLabel: 'Merge & Split', tag: '02', icon: Layers },
    { id: 'protect-unlock', label: 'PROTECT & UNLOCK', shortLabel: 'Protect', tag: '03', icon: Lock },
    { id: 'compress-pdf', label: 'COMPRESS PDF', shortLabel: 'Compress', tag: '04', icon: Cpu },
  ];

  return (
    <header className="border-b border-neutral-200/80 bg-white sticky top-0 z-40 shadow-xs">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Brand & Clean Mobile Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {!logoError ? (
            <img
              src={logoUrl}
              alt="BlackEYE Brand Logo"
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain shrink-0"
              referrerPolicy="no-referrer"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-neutral-950 rounded-lg flex items-center justify-center shrink-0 shadow-xs border border-neutral-800">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-base sm:text-lg font-black tracking-tight text-neutral-950 font-mono">
                BlackEYE
              </span>
              <span className="text-neutral-300 font-mono text-xs">/</span>
              <span className="text-[11px] sm:text-xs font-bold text-orange-600 font-mono tracking-wide">
                PDF CONVERTER
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions: Compact and Minimal */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Offline indicator if disconnected */}
          {!isOnline && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium">
              <WifiOff className="w-3 h-3 text-amber-600" />
              <span className="hidden sm:inline">Offline</span>
            </div>
          )}

          {/* PWA Install Button (Orange) */}
          {isInstallable && (
            <button
              onClick={() => {
                haptic.light();
                install();
              }}
              className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] font-mono font-bold bg-orange-600 text-white hover:bg-orange-700 active:scale-95 transition shadow-xs cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>INSTALL</span>
            </button>
          )}

          {isIOS && !isInstalled && (
            <button
              onClick={() => {
                haptic.light();
                setShowIOSGuide(true);
              }}
              className="px-2 py-1 text-[11px] font-mono border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-800 hover:bg-neutral-100 cursor-pointer"
            >
              + iOS
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tool Strip (Ultra-Clean Mobile Segmented Switcher) */}
      <div className="border-t border-neutral-200/80 bg-neutral-50/90 backdrop-blur-xs lg:hidden overflow-hidden">
        <div className="max-w-7xl mx-auto px-2.5 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = currentMode === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  haptic.selection();
                  onSelectMode(tool.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200/70 hover:bg-neutral-100/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-orange-500' : 'text-neutral-400'}`} />
                <span>{tool.shortLabel}</span>
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
              onClick={() => {
                haptic.light();
                setShowIOSGuide(false);
              }}
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
