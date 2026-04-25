import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './Styles/index.css'
import App from './App.jsx'
import router from './router.jsx'
import { RouterProvider } from 'react-router-dom'
createRoot(document.getElementById('root')).render(

  <RouterProvider router={router} />

)
