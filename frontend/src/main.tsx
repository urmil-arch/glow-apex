import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App'
import { PricingProvider } from './context/PricingContext'
import './index.css'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        <PricingProvider>
          <App />
        </PricingProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
)
