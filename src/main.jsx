import { createRoot } from "react-dom/client";
import ErrorBoundary from "./components/ui/error-boundary";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
);
