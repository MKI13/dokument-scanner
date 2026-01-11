import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Debug Logging
console.log('🚀 APP GESTARTET');
window.addEventListener('error', (e) => {
  console.error('❌ GLOBALER FEHLER:', e);
});
