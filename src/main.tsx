import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import 'leaflet/dist/leaflet.css';

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
  componentDidCatch(error: unknown) {
    console.error('Second Chance failed to render:', error);
  }
  render() {
    if (this.state.error) {
      return <main style={{ minHeight: '100vh', padding: '2rem', background: '#f4efe4', color: '#111', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>SECOND CHANCE</h1>
        <section style={{ maxWidth: 680, marginTop: '2rem', padding: '1.5rem', border: '2px solid #111', background: '#CCFF00' }}>
          <h2 style={{ fontWeight: 800 }}>Приложение не смогло загрузиться</h2>
          <p style={{ marginTop: '0.75rem' }}>Ошибка отображения перехвачена. Попробуйте обновить страницу. Если проблема повторится, сообщите нам этот текст:</p>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', marginTop: '1rem' }}>{this.state.error}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', border: '2px solid #111', padding: '0.75rem', background: '#fff', fontWeight: 700 }}>ОБНОВИТЬ</button>
        </section>
      </main>;
    }
    return this.props.children;
  }
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root is missing from index.html');
createRoot(root).render(<React.StrictMode><AppErrorBoundary><App /></AppErrorBoundary></React.StrictMode>);
