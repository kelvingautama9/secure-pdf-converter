import React from 'react';
import { ShieldCheck, Cpu, WifiOff, Activity } from 'lucide-react';

export const BottomFeatureCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 font-mono">
      {/* Metric Card 1: Memory Load */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 flex flex-col justify-between h-28 hover:border-[#3a3a3a] transition shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#666] uppercase tracking-wider">Memory Load</span>
          <span className="text-[10px] text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> RAM SAFE
          </span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <span className="text-xl font-bold text-white tracking-tight">0.04 <span className="text-xs font-normal text-[#555]">GB</span></span>
            <p className="text-[10px] text-[#777] mt-0.5">Heap ceiling: 2.0 GB V8</p>
          </div>
          <div className="flex gap-1 h-5 items-end">
            <div className="w-1.5 h-full bg-green-500/70 rounded-xs"></div>
            <div className="w-1.5 h-1/2 bg-green-500/50 rounded-xs"></div>
            <div className="w-1.5 h-2/3 bg-green-500/60 rounded-xs"></div>
            <div className="w-1.5 h-1/3 bg-green-500/40 rounded-xs"></div>
          </div>
        </div>
      </div>

      {/* Metric Card 2: Network In/Out (100% Client-Side zero telemetry) */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 flex flex-col justify-between h-28 hover:border-[#3a3a3a] transition shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#666] uppercase tracking-wider">Network In/Out</span>
          <span className="text-[10px] text-green-500 font-bold tracking-wider">100% SECURE</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <span className="text-xl font-bold text-green-400 tracking-tight">0.00 <span className="text-xs font-normal text-green-500/60">KB/s</span></span>
            <p className="text-[10px] text-[#777] mt-0.5">Zero server uploads</p>
          </div>
          <div className="px-2 py-1 bg-green-950/40 border border-green-900/50 rounded text-[10px] text-green-400 font-semibold">
            FIREWALL OK
          </div>
        </div>
      </div>

      {/* Metric Card 3: PWA Cache & WASM */}
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 flex flex-col justify-between h-28 hover:border-[#3a3a3a] transition shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#666] uppercase tracking-wider">PWA Cache & WASM</span>
          <span className="text-[10px] text-yellow-400 font-bold tracking-wider">STABLE</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <span className="text-xl font-bold text-white tracking-tight">V2.0.4</span>
            <p className="text-[10px] text-[#777] mt-0.5">Offline ServiceWorker Active</p>
          </div>
          <div className="px-2 py-1 bg-yellow-400/10 border border-yellow-400/20 rounded text-[10px] text-yellow-400 font-semibold">
            OFFLINE READY
          </div>
        </div>
      </div>
    </div>
  );
};
