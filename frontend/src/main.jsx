import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { FileProvider } from './context/FileContext'
import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="1019757969099-9sdeijdtgjkc0pkqovki3l2fkgoqhbrf.apps.googleusercontent.com">
      <FileProvider>
        <App />
      </FileProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
