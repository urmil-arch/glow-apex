import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App'
import GlowApexApp from './glowapex/App'
import { PricingProvider } from './context/PricingContext'
import './index.css'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

const isGlowApex =
  window.location.hostname === 'glowapex.com' ||
  window.location.hostname === 'www.glowapex.com' ||
  window.location.port === '3001'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      {isGlowApex ? (
        <GlowApexApp />
      ) : (
        <GoogleOAuthProvider clientId={googleClientId}>
          <PricingProvider>
            <App />
          </PricingProvider>
        </GoogleOAuthProvider>
      )}
    </BrowserRouter>
  </React.StrictMode>
)
