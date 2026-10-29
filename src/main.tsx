import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { startLiveUpdates } from './liveUpdate'
import './index.css'

startLiveUpdates()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
