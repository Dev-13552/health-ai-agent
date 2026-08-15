import React, { useState } from 'react';
import Home from './pages/Home';
import Call from './pages/Call';

/**
 * App Component: Orchestrates simple page-routing/view switching between Home and Call page.
 */
export default function App() {
  const [view, setView] = useState('home');

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="brand">
          <span className="brand-logo">🛡️</span>
          <span className="brand-name">HealthScreener AI</span>
        </div>
      </header>

      <main className="app-main">
        {view === 'home' ? (
          <Home onStartCall={() => setView('call')} />
        ) : (
          <Call onBackToHome={() => setView('home')} />
        )}
      </main>
    </div>
  );
}
