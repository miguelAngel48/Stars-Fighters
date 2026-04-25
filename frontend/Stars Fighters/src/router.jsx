import React from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Register from "./Pages/Register";
import Login from "./Pages/Login";
import NotFound from "./Pages/errorsPages/NotFound";


const router = createBrowserRouter([
    {
        path: "/",
        element: <App />
    },
    {
        path: "/login",
        element: <Login />
    }, {
        path: "/register",
        element: <Register />
    },
    {
        path: "*",
        element: <NotFound />
    }
])


export default router;