import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
const NotFound = () => {
    const location = useLocation();
    useEffect(() => {
        console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }, [location.pathname]);
    return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-muted", children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "mb-4 text-4xl font-bold", children: "404" }), _jsx("p", { className: "mb-4 text-xl text-muted-foreground", children: "Oops! Page not found" }), _jsx("a", { href: "/", className: "text-primary underline hover:text-primary/90", children: "Return to Home" })] }) }));
};
export default NotFound;
