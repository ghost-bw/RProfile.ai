import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { FileProvider } from './context/FileContext'
import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="630838710480-k4u2o9s7rmojhqnm824t21fsc03thtr5.apps.googleusercontent.com">
      <FileProvider>
        <App />
      </FileProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
