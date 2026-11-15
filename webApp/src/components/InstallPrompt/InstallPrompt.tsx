import React, { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallPrompt: React.FC<{
  onInstallStateChange?: (canInstall: boolean) => void;
}> = ({ onInstallStateChange }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is running in standalone PWA mode
    const checkStandalone = () => {
      const matchDisplayMode = window.matchMedia('(display-mode: standalone)').matches;
      const navStandalone = (navigator as unknown as { standalone?: boolean }).standalone;
      return matchDisplayMode || Boolean(navStandalone);
    };

    if (checkStandalone()) {
      setIsStandalone(true);
      if (onInstallStateChange) onInstallStateChange(false);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      if (onInstallStateChange) onInstallStateChange(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [onInstallStateChange]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      console.log('User installed the PWA app');
      setDeferredPrompt(null);
      if (onInstallStateChange) onInstallStateChange(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (isStandalone || !deferredPrompt || dismissed) {
    return null;
  }

  return (
    <div className="no-print fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md bg-gradient-to-r from-brand-900 via-brand-800 to-blue-900 text-white p-4 rounded-2xl shadow-2xl border border-blue-400/30 z-50 animate-fade-in flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center text-blue-300 font-bold border border-blue-400/40">
            <span class="material-icons text-xl">get_app</span>
          </div>
          <div>
            <h3 className="text-sm font-bold leading-tight">Install Xondhan Billing App</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Install for instant offline desktop & mobile access without browser bars!
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          title="Dismiss banner"
        >
          <span className="material-icons text-base">close</span>
        </button>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/10">
        <button
          onClick={handleDismiss}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition"
        >
          Not Now
        </button>
        <button
          onClick={handleInstallClick}
          className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md flex items-center gap-1.5 transition transform active:scale-95"
        >
          <span className="material-icons text-sm">download</span>
          Install App
        </button>
      </div>
    </div>
  );
};
