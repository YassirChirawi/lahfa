import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Critical Auth/Initialization Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          textAlign: 'center',
          fontFamily: 'sans-serif',
          background: '#fff5f5'
        }}>
          <h1 style={{ color: '#e53e3e' }}>Désolé, une erreur est survenue au chargement 😢</h1>
          <p style={{ color: '#718096', maxWidth: '400px' }}>
            L'application n'a pas pu démarrer correctement sur votre appareil.
            Essayez de rafraîchir la page ou d'utiliser un navigateur standard (Safari/Chrome).
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Réessayer
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre style={{ marginTop: '20px', textAlign: 'left', fontSize: '10px', background: '#eee', padding: '10px' }}>
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

console.log("🚀 Lahfa Dash Initializing...");

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
