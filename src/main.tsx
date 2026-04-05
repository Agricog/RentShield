import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter } from 'react-router-dom';
import { initSentry } from './lib/sentry';
import { loadCachedLanguage } from './lib/dynamic-i18n';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { App } from './App';

// Initialise i18n — must import before any component that uses useTranslation
import './lib/i18n';

import './index.css';

// ── Sentry — initialise before anything else ────────────────
initSentry();

// ── Load cached dynamic language (if user previously selected one) ─
loadCachedLanguage();

// ── Validate required env vars ──────────────────────────────
const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_KEY) {
  throw new Error('VITE_CLERK_PUBLISHABLE_KEY is required');
}

// ── Render ───────────────────────────────────────────────────
const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <ClerkProvider publishableKey={CLERK_KEY}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClerkProvider>
    </ErrorBoundary>
  </StrictMode>
);
