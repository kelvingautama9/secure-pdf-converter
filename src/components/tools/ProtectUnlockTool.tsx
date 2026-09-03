import React, { useState } from 'react';
import { DropZone } from '../DropZone';
import { FileItem, ProtectUnlockOptions, ProgressState } from '../../types';
import {
  protectPdf,
  unlockPdf,
  downloadBlob,
  formatBytes,
  checkPdfIsEncrypted,
} from '../../utils/pdfServices';
import {
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  Download,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';

export const ProtectUnlockTool: React.FC = () => {
  const [mode, setMode] = useState<'protect' | 'unlock'>('protect');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [password, setPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDetectedEncrypted, setIsDetectedEncrypted] = useState<boolean | null>(null);

  // Permissions
  const [allowPrinting, setAllowPrinting] = useState(true);
  const [allowCopying, setAllowCopying] = useState(false);
  const [allowModifying, setAllowModifying] = useState(false);

  const [progress, setProgress] = useState<ProgressState>({
    isProcessing: false,
    progress: 0,
    stage: '',
    error: null,
    resultBlob: null,
    resultFileName: '',
  });

  const handleFilesAdded = async (newFiles: File[]) => {
    const valid = newFiles.filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );
    if (valid.length === 0) return;

    const targetFile = valid[0];
    const isEnc = await checkPdfIsEncrypted(targetFile);
    setIsDetectedEncrypted(isEnc);

    // If file is encrypted and user was in protect mode, suggest switching to unlock
    if (isEnc && mode === 'protect') {
      setMode('unlock');
    }

    setFiles([
      {
        id: Math.random().toString(36).substring(2, 9),
        file: targetFile,
        name: targetFile.name,
        size: targetFile.size,
        type: targetFile.type,
      },
    ]);

    setProgress((p) => ({ ...p, resultBlob: null, error: null }));
  };

  const handleRemoveFile = () => {
    setFiles([]);
    setIsDetectedEncrypted(null);
    setProgress((p) => ({ ...p, resultBlob: null, error: null }));
  };

  const handleExecute = async () => {
    if (files.length === 0) return;
    const targetFile = files[0].file;

    if (!password && (mode === 'protect' || isDetectedEncrypted)) {
      setProgress((p) => ({
        ...p,
        error: 'Please enter a password to proceed.',
      }));
      return;
    }

    setProgress({
      isProcessing: true,
      progress: 0,
      stage: 'Initializing cryptographic engine...',
      error: null,
      resultBlob: null,
      resultFileName: '',
    });

    try {
      if (mode === 'protect') {
        const encryptedBytes = await protectPdf(
          targetFile,
          {
            mode: 'protect',
            password,
            ownerPassword: ownerPassword || undefined,
            allowPrinting,
            allowCopying,
            allowModifying,
          },
          (pct, msg) => {
            setProgress((prev) => ({ ...prev, progress: pct, stage: msg }));
          }
        );

        const blob = new Blob([encryptedBytes], { type: 'application/pdf' });
        const outName = targetFile.name.replace(/\.pdf$/i, '_protected.pdf');

        setProgress((prev) => ({
          ...prev,
          isProcessing: false,
          progress: 100,
          stage: 'PDF successfully protected!',
          resultBlob: blob,
          resultFileName: outName,
          resultSize: blob.size,
        }));
      } else {
        // Unlock
        const decryptedBytes = await unlockPdf(targetFile, password, (pct, msg) => {
          setProgress((prev) => ({ ...prev, progress: pct, stage: msg }));
        });

        const blob = new Blob([decryptedBytes], { type: 'application/pdf' });
        const outName = targetFile.name.replace(/\.pdf$/i, '_unlocked.pdf');

        setProgress((prev) => ({
          ...prev,
          isProcessing: false,
          progress: 100,
          stage: 'PDF unlocked & restrictions removed!',
          resultBlob: blob,
          resultFileName: outName,
          resultSize: blob.size,
        }));
      }
    } catch (err: unknown) {
      setProgress((prev) => ({
        ...prev,
        isProcessing: false,
        error: (err as Error).message || 'Cryptographic operation failed.',
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
            setMode('protect');
            setProgress((p) => ({ ...p, resultBlob: null, error: null }));
          }}
          className={`flex-1 py-2 text-xs font-mono font-bold flex items-center justify-center gap-2 rounded-lg transition cursor-pointer ${
            mode === 'protect'
              ? 'bg-white text-black shadow-xs'
              : 'text-neutral-600 hover:text-black'
          }`}
        >
          <Lock className={`w-3.5 h-3.5 ${mode === 'protect' ? 'text-orange-600' : ''}`} />
          <span>PROTECT PDF (ENCRYPT)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('unlock');
            setProgress((p) => ({ ...p, resultBlob: null, error: null }));
          }}
          className={`flex-1 py-2 text-xs font-mono font-bold flex items-center justify-center gap-2 rounded-lg transition cursor-pointer ${
            mode === 'unlock'
              ? 'bg-white text-black shadow-xs'
              : 'text-neutral-600 hover:text-black'
          }`}
        >
          <Unlock className={`w-3.5 h-3.5 ${mode === 'unlock' ? 'text-orange-600' : ''}`} />
          <span>UNLOCK PDF (DECRYPT)</span>
        </button>
      </div>

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

      {/* Cryptographic Controls Panel */}
      {files.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between pb-2 mb-4 border-b border-neutral-100 text-xs font-mono">
            <span className="font-bold uppercase text-black flex items-center gap-1.5">
              <Key className="w-4 h-4 text-orange-600" />
              {mode === 'protect'
                ? 'AES-256 ENCRYPTION CREDENTIALS'
                : 'DOCUMENT UNLOCK PASSPHRASE'}
            </span>
            {isDetectedEncrypted !== null && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  isDetectedEncrypted
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-green-50 text-green-800 border-green-200'
                }`}
              >
                {isDetectedEncrypted ? 'ENCRYPTED DETECTED' : 'STANDARD PDF'}
              </span>
            )}
          </div>

          <div className="space-y-4 text-xs font-mono">
            {/* Primary Password Input */}
            <div>
              <label className="block text-neutral-700 font-semibold mb-1">
                {mode === 'protect'
                  ? 'USER OPEN PASSWORD (REQUIRED TO VIEW DOCUMENT)'
                  : 'ENTER DECRYPTION PASSWORD'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  disabled={progress.isProcessing}
                  className="w-full bg-white border border-neutral-300 text-neutral-900 rounded-lg p-2.5 pr-10 font-mono text-xs focus:border-orange-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Protect Mode Advanced Permissions */}
            {mode === 'protect' && (
              <>
                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">
                    OWNER / PERMISSIONS PASSWORD (OPTIONAL)
                  </label>
                  <input
                    type="password"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    placeholder="Leave empty to use user password"
                    disabled={progress.isProcessing}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 rounded-lg p-2 font-mono text-xs focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 border-t border-neutral-100">
                  <label className="block text-neutral-700 font-semibold mb-2">
                    CLIENT ACCESS PERMISSIONS:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className="flex items-center gap-2 p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg cursor-pointer text-neutral-800 hover:border-neutral-300 transition">
                      <input
                        type="checkbox"
                        checked={allowPrinting}
                        onChange={(e) => setAllowPrinting(e.target.checked)}
                        className="accent-orange-600"
                      />
                      <span>Allow Printing</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg cursor-pointer text-neutral-800 hover:border-neutral-300 transition">
                      <input
                        type="checkbox"
                        checked={allowCopying}
                        onChange={(e) => setAllowCopying(e.target.checked)}
                        className="accent-orange-600"
                      />
                      <span>Allow Text Copy</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg cursor-pointer text-neutral-800 hover:border-neutral-300 transition">
                      <input
                        type="checkbox"
                        checked={allowModifying}
                        onChange={(e) => setAllowModifying(e.target.checked)}
                        className="accent-orange-600"
                      />
                      <span>Allow Modifying</span>
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Action Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="text-xs font-mono text-neutral-500">
          {files.length > 0
            ? mode === 'protect'
              ? 'Ready to encrypt with AES-256'
              : 'Ready to unlock document'
            : 'Select a PDF file to begin'}
        </div>

        <button
          type="button"
          onClick={handleExecute}
          disabled={files.length === 0 || progress.isProcessing}
          className="px-6 py-2.5 bg-orange-600 text-white text-xs font-mono font-bold rounded-lg hover:bg-orange-700 active:translate-y-0.5 disabled:opacity-40 disabled:pointer-events-none transition shadow-xs flex items-center gap-2 uppercase tracking-wide cursor-pointer"
        >
          {progress.isProcessing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>COMPUTING CIPHER...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{mode === 'protect' ? 'APPLY ENCRYPTION' : 'UNLOCK DOCUMENT'}</span>
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
            <p className="font-bold uppercase tracking-wider text-red-900">Cryptographic Operation Error</p>
            <p className="mt-1 text-red-700">{progress.error}</p>
          </div>
        </div>
      )}

      {/* Result Download (Green) */}
      {progress.resultBlob && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 shadow-xs text-green-900 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
              <div>
                <h4 className="text-sm font-bold uppercase text-black">
                  {mode === 'protect' ? 'PDF Successfully Encrypted' : 'PDF Decrypted & Sanitized'}
                </h4>
                <p className="text-xs text-neutral-600 mt-0.5">
                  Output: <span className="text-black font-semibold">{progress.resultFileName}</span> • Size: <span className="text-green-700 font-bold">{formatBytes(progress.resultSize || 0)}</span>
                </p>
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
              <span>DOWNLOAD PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
