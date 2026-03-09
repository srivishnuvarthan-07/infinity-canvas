import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Workspace from "./pages/Workspace";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import ProfilePage from "./pages/ProfilePage";

import OverviewView from "./components/dashboard/views/OverviewView";
import AllBoardsView from "./components/dashboard/views/AllBoardsView";
import TeamView from "./components/dashboard/views/TeamView";
import LibraryView from "./components/dashboard/views/LibraryView";
import SettingsView from "./components/dashboard/views/SettingsView";
import SharedBoardsView from "./components/dashboard/views/SharedBoardsView";

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
                        <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/signup" element={<SignupPage />} />

                            {/* Public Access for Local First */}
                            <Route path="/dashboard" element={<Dashboard />}>
                                <Route path="overview" element={<OverviewView />} />
                                <Route path="boards" element={<AllBoardsView />} />
                                <Route path="team" element={<TeamView />} />
                                <Route path="library" element={<LibraryView />} />
                                <Route path="settings" element={<SettingsView />} />
                                <Route path="shared" element={<SharedBoardsView />} />
                            </Route>
                            <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
                            <Route path="/board/:boardId" element={<Workspace />} />

                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </BrowserRouter>
                </AuthProvider>
            </TooltipProvider>
        </QueryClientProvider>
    </HelmetProvider>
);

export default App;
