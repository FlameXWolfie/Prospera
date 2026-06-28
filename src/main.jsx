import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './lib/auth/AuthContext'
import { ThemeProvider } from './lib/theme/ThemeContext'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

const tree = (
  <ThemeProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ThemeProvider>
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      {googleClientId
        ? <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider>
        : tree}
    </BrowserRouter>
  </StrictMode>,
)
