import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Pages/Login';
import Dashboard from './Pages/Dashboard';
import Store from './Pages/Store';
import Lobby from './Pages/Lobby';
import OAuth2RedirectHandler from './Pages/OAuth2RedirectHandler';
import NotFound from './Pages/errorsPages/NotFound';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/store" element={<Store />} />
                <Route path="/lobby" element={<Lobby />} />
                <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;