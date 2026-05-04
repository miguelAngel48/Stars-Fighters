import React from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Register from "./Pages/Register";
import Login from "./Pages/Login";
// import Dashboard from "./Pages/Dashboard";
import NotFound from "./Pages/errorsPages/NotFound";
import Dashboard from "./Pages/Dashboard";
import OAuth2RedirectHandler from "./Pages/OAuth2RedirectHandler";
// import ProtectedRoute from "./Components/ProtectedRoute";

const router = createBrowserRouter([
    { path: "/", element: <App /> },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/dashboard", element: <Dashboard /> },
    { path: "/oauth2/redirect", element: <OAuth2RedirectHandler /> },
    { path: "*", element: <NotFound /> }
]);

export default router;