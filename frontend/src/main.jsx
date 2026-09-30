import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import 'leaflet/dist/leaflet.css'
import './index.css'
import { LanguageProvider } from './contexts/LanguageContext'
import ErrorBoundary from './components/ErrorBoundary'
import NewVersionBanner from './components/NewVersionBanner'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
        <NewVersionBanner />
      </BrowserRouter>
    </LanguageProvider>
  </StrictMode>,
)

// Service Worker solo para notificaciones push (no cachea nada). Las versiones nuevas
// del frontend las detecta NewVersionBanner.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('No se pudo registrar el Service Worker (notificaciones push):', err);
    });
  });
}