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
import Store from "./Pages/Store";
import CharacterSelection from "./Pages/CharacterSelection";
import Game from "./Pages/Game";
import FriendProfile from "./Pages/FriendProfile";
import RootLayout from "./Components/RootLayout";
import GameSummary from "./Pages/GameSummary";
import Champions from "./Pages/Champions";

const router = createBrowserRouter([
    { path: "/", element: <App /> },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/oauth2/redirect", element: <OAuth2RedirectHandler /> },
    { path: "*", element: <NotFound /> },
    {
        element: <RootLayout />,
        children: [
            { path: "/resumen", element: <GameSummary /> },
            { path: "/campeones", element: <Champions /> },
            { path: "/dashboard", element: <Dashboard /> },
            { path: "/profile", element: <Profile /> },
            { path: "/lobby", element: <Lobby /> },
            { path: "/character-selection", element: <CharacterSelection /> },
            { path: "/game", element: <Game /> },
            { path: "/store", element: <Store /> },
            { path: "/friend-profile/:username", element: <FriendProfile /> }
        ]
    }
]);

export default router;