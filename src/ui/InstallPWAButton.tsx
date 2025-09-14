import React, { useEffect, useState } from 'react';

// Simple floating install button that appears when beforeinstallprompt fired.
export const InstallPWAButton: React.FC = () => {
  const [available, setAvailable] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onAvail = () => setAvailable(true);
    const onInstalled = () => { setInstalled(true); setAvailable(false); };
    document.addEventListener('pwa-install-available', onAvail);
    document.addEventListener('pwa-installed', onInstalled);

    // If event fired before component mounted and prompt saved
    if ((window as any).deferredPWAInstallPrompt) setAvailable(true);

    return () => {
      document.removeEventListener('pwa-install-available', onAvail);
      document.removeEventListener('pwa-installed', onInstalled);
    };
  }, []);

  const install = async () => {
    const promptEvt: any = (window as any).deferredPWAInstallPrompt;
    if (!promptEvt) return;
    promptEvt.prompt();
    const choice = await promptEvt.userChoice.catch(()=>null);
    if (choice && choice.outcome === 'accepted') {
      (window as any).deferredPWAInstallPrompt = null;
      setAvailable(false);
    }
  };

  if (!available || installed) return null;

  return (
    <button
      onClick={install}
      style={{
        position:'fixed',
        right:12,
        bottom:72, // above nav bar
        background:'#2563eb',
        color:'#fff',
        border:'none',
        borderRadius:24,
        padding:'10px 16px',
        fontSize:'.85rem',
        boxShadow:'0 4px 10px rgba(0,0,0,.35)',
        cursor:'pointer',
        zIndex:1000
      }}
      aria-label="Install app"
    >Install App</button>
  );
};
