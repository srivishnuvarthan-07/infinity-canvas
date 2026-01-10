import { jsx as _jsx } from "react/jsx-runtime";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
    _jsx(ErrorBoundary, { children: _jsx(App, {}) })
);
