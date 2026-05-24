import React from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Register from "./Pages/Register";
import Login from "./Pages/Login";
import NotFound from "./Pages/errorsPages/NotFound";
import Dashboard from "./Pages/Dashboard";
import OAuth2RedirectHandler from "./Pages/OAuth2RedirectHandler";
import Profile from "./Pages/Profile";
import Lobby from "./Pages/Lobby";
import CharacterSelection from "./Pages/CharacterSelection";
import Game from "./Pages/Game";
const router = createBrowserRouter([
    { path: "/", element: <App /> },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/dashboard", element: <Dashboard /> },
    { path: "/oauth2/redirect", element: <OAuth2RedirectHandler /> },
    { path: "*", element: <NotFound /> },
    { path: "/profile", element: <Profile /> },
    { path: "/lobby", element: <Lobby /> },
    { path: "/character-selection", element: <CharacterSelection /> },
    { path: "/game", element: <Game /> }
]);

export default router;