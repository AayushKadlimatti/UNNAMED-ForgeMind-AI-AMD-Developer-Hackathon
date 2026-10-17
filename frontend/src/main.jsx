import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './master/master.css'
import App from './ConnectedApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
