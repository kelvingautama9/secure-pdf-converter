import React, { useState } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { SidebarStatus } from './components/SidebarStatus';
import { BottomFeatureCards } from './components/BottomFeatureCards';
import { EngineSpecsModal } from './components/EngineSpecsModal';
import { ImageToPdfTool } from './components/tools/ImageToPdfTool';
import { MergeSplitTool } from './components/tools/MergeSplitTool';
import { ProtectUnlockTool } from './components/tools/ProtectUnlockTool';
import { CompressPdfTool } from './components/tools/CompressPdfTool';
import { ToolMode, FileItem } from './types';
import { Eye, WifiOff } from 'lucide-react';
import { useOnlineStatus } from './hooks/usePWAInstall';
import logoUrl from './assets/logo.png';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnline = useOnlineStatus();
  const [footerLogoError, setFooterLogoError] = useState(false);

  // Map route to ToolMode
  const getModeFromPath = (path: string): ToolMode => {
    if (path.includes('merge-split')) return 'merge-split';
    if (path.includes('protect-unlock')) return 'protect-unlock';
    if (path.includes('compress-pdf')) return 'compress-pdf';
    return 'image-to-pdf';
  };

  const currentMode = getModeFromPath(location.pathname);

  const toolDetails: Record<ToolMode, { title: string; subtitle: string }> = {
    'image-to-pdf': {
      title: 'Image to PDF',
      subtitle: 'Convert JPG, PNG, WEBP images into clean PDF documents',
    },
    'merge-split': {
      title: 'Merge & Split',
      subtitle: 'Combine multiple PDFs or extract specific page ranges',
    },
    'protect-unlock': {
      title: 'Protect & Unlock',
      subtitle: 'Encrypt PDFs with passwords or decrypt password-protected files',
    },
    'compress-pdf': {
      title: 'Compress PDF',
      subtitle: 'Reduce document size while preserving readability',
    },
  };

  const handleSelectMode = (mode: ToolMode) => {
    navigate(`/${mode}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-neutral-900 font-mono selection:bg-orange-500 selection:text-white">
      {/* Offline Toast Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-white px-4 py-2 text-xs font-mono font-bold text-center flex items-center justify-center gap-2 shadow-xs">
          <WifiOff className="w-3.5 h-3.5" />
          <span>OFFLINE MODE: All PDF tools continue working 100% locally without internet.</span>
        </div>
      )}

      {/* Header */}
      <Header
        currentMode={currentMode}
        onSelectMode={handleSelectMode}
      />

      {/* Main Workspace Area (Clean 12-Col Grid) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Tools & Privacy (Desktop Only - hidden on mobile so uploads are immediately accessible) */}
          <div className="hidden lg:block lg:col-span-3">
            <SidebarStatus
              currentMode={currentMode}
              onSelectMode={handleSelectMode}
              files={[]}
              isProcessing={false}
            />
          </div>

          {/* Main Column: Active Tool Workspace (Full width on mobile, Cols 4 to 12 on desktop) */}
          <div className="w-full lg:col-span-9 flex flex-col gap-5">
            {/* Main Workspace Container */}
            <div className="bg-white border border-neutral-200/90 rounded-2xl flex flex-col overflow-hidden shadow-xs">
              {/* Workspace Header Strip */}
              <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-neutral-100 bg-white">
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-neutral-950 font-mono flex items-center gap-1.5 truncate">
                    <span>Tool:</span>
                    <span className="text-orange-600 font-extrabold">{toolDetails[currentMode].title}</span>
                  </h2>
                  <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5 truncate hidden sm:block">
                    {toolDetails[currentMode].subtitle}
                  </p>
                </div>
              </div>

              {/* Active Tool View */}
              <div className="p-3 sm:p-6 bg-white">
                <Routes>
                  <Route path="/" element={<ImageToPdfTool />} />
                  <Route path="/image-to-pdf" element={<ImageToPdfTool />} />
                  <Route path="/merge-split" element={<MergeSplitTool />} />
                  <Route path="/protect-unlock" element={<ProtectUnlockTool />} />
                  <Route path="/compress-pdf" element={<CompressPdfTool />} />
                  <Route path="*" element={<ImageToPdfTool />} />
                </Routes>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-neutral-200 bg-white mt-auto py-5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-neutral-500">
          <div className="flex items-center gap-2.5">
            {!footerLogoError ? (
              <img
                src={logoUrl}
                alt="BlackEYE Brand Logo"
                className="w-6 h-6 object-contain shrink-0"
                referrerPolicy="no-referrer"
                onError={() => setFooterLogoError(true)}
              />
            ) : (
              <Eye className="w-5 h-5 text-orange-500 shrink-0" />
            )}
            <span className="font-bold text-black">BlackEYE</span>
            <span>//</span>
            <span>PDF Converter Suite</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-neutral-600">
            <span className="flex items-center gap-1.5 text-green-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              100% Client-Side
            </span>
            <span>•</span>
            <span>Zero Server Uploads</span>
            <span>•</span>
            <span>Private & Offline Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <HashRouter>
      <MainLayout />
    </HashRouter>
  );
}
