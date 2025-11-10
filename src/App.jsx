
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import LandingPage from "./LandingPage";
import Auth from "./Auth";
import Dashboard from "./Dashboard";
import ManagerDashboard from "./ManagerDashboard";
import AssignTask from "./AssignTask";
import ResetPassword from "./ResetPassword";

function DashboardWrapper({ currentUser, onLogout }) {
  const [role, setRole] = useState("employee");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const userId = currentUser.id || currentUser.user?.id;
       
        const { data: mgrData, error: mgrErr } = await supabase
          .from("managers")
          .select("user_id")
          .eq("user_id", userId)
          .maybeSingle();

    if (mgrData && !mgrErr) setRole("manager");
        else setRole("employee");
     } catch (err) {
        console.error("Role check failed", err);
        setRole("employee");
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, [currentUser]);

  if (loading) return <div className="p-8 text-gray-200">Loading...</div>;

  if (role === "manager")
    return <ManagerDashboard currentUser={currentUser} onLogout={onLogout} />;
  return <Dashboard currentUser={currentUser} onLogout={onLogout} />;
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

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated
              ? <Navigate to="/dashboard" replace />
              : <LandingPage onShowAuth={() => setShowAuth(true)} />
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated
              ? <DashboardWrapper currentUser={currentUser} onLogout={handleLogout} />
              : <Navigate to="/" replace />
          }
        />
        <Route
          path="/manager"
          element={
            isAuthenticated
              ? <ManagerDashboard currentUser={currentUser} onLogout={handleLogout} />
              : <Navigate to="/" replace />
          }
        />
        <Route
          path="/manager/assign"
          element={
            isAuthenticated
              ? <AssignTask currentUser={currentUser} />
              : <Navigate to="/" replace />
          }
        />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showAuth && <Auth onLogin={handleLogin} onClose={() => setShowAuth(false)} />}
    </BrowserRouter>
  );
}
