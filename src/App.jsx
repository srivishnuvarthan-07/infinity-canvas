import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import React, { Suspense, lazy } from "react";
import { LoadingScreen } from "./components/ui/LoadingScreen";

const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const BoardPage = lazy(() => import("./pages/BoardPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const SignupPage = lazy(() => import("./pages/auth/SignupPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

const OverviewView = lazy(() => import("./components/dashboard/views/OverviewView"));
const LibraryView = lazy(() => import("./components/dashboard/views/LibraryView"));

import { AuthProvider, useAuth } from "@/hooks/useAuth";

const queryClient = new QueryClient();

const RequireAuth = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="h-screen w-full bg-neutral-950 flex items-center justify-center text-white">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    return children;
};

const App = () => (
    <HelmetProvider>
        <QueryClientProvider client={queryClient}>
            <TooltipProvider delayDuration={200}>
                <AuthProvider>
                    <Toaster />
                    <Sonner position="bottom-center" />
                    <BrowserRouter>
                        <Suspense fallback={<LoadingScreen />}>
                            <Routes>
                                <Route path="/" element={<Index />} />
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/signup" element={<SignupPage />} />

                                {/* Public Access for Local First */}
                                <Route path="/dashboard" element={<Dashboard />}>
                                    <Route path="overview" element={<OverviewView />} />
                                    <Route path="library" element={<LibraryView />} />
                                </Route>
                                <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
                                <Route path="/board/:boardId" element={<BoardPage />} />

                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </Suspense>
                    </BrowserRouter>
                </AuthProvider>
            </TooltipProvider>
        </QueryClientProvider>
    </HelmetProvider>
);

export default App;
