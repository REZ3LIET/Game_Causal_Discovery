import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Home from './pages/Home'
import Game from './pages/Game'
import Builder from './pages/Builder'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/level/:id" element={<Game />} />
        <Route path="/admin" element={<Builder />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
