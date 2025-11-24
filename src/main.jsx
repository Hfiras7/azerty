import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppV4 from './AppV4.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppV4 />
  </StrictMode>,
)
