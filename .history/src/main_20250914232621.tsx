import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './pages/App';
// Register service worker & expose a custom event for install prompt
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW reg failed', err));
	});
}

// Capture beforeinstallprompt so we can show our own button
declare global {
	interface Window { deferredPWAInstallPrompt?: any; }
}
window.addEventListener('beforeinstallprompt', (e: any) => {
	e.preventDefault();
	window.deferredPWAInstallPrompt = e;
	document.dispatchEvent(new CustomEvent('pwa-install-available'));
});

window.addEventListener('appinstalled', ()=>{
	window.deferredPWAInstallPrompt = null;
	document.dispatchEvent(new CustomEvent('pwa-installed'));
});
import './styles.css';

createRoot(document.getElementById('root')!).render(<App />);
