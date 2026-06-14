import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'  // Add this

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>  {/* Wrap App with ErrorBoundary */}
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
