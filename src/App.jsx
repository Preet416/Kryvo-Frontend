import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import { supabase } from "./supabaseClient";
import LandingPage from "./LandingPage";
import Auth from "./Auth";
import Dashboard from "./Dashboard";
import ResetPassword from "./ResetPassword";

function DashboardWrapper({ currentUser, onLogout }) {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("room") || "project-room-1";

  const normalizedUser = currentUser
    ? {
        email: currentUser.email,
        name: currentUser.user_metadata?.full_name || currentUser.email,
      }
    : { email: "guest@local", name: "Guest" };

  const isHost = true;
  return <Dashboard currentUser={normalizedUser} isHost={isHost} onLogout={onLogout} roomId={roomId} />;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        setIsAuthenticated(true);
      }
    };
    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        setIsAuthenticated(true);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setShowAuth(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const handleShowAuth = () => setShowAuth(true);
  const handleCloseAuth = () => setShowAuth(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage onShowAuth={handleShowAuth} />
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <DashboardWrapper currentUser={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showAuth && <Auth onLogin={handleLogin} onClose={handleCloseAuth} />}
    </BrowserRouter>
  );
}
