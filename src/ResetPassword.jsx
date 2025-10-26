import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) setUser(data.user);
    };
    fetchUser();
  }, []);

  const handleReset = async () => {
    if (!user) {
      setMessage("⚠️ Invalid or expired reset link.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("✅ Password reset successful! Redirecting to login...");
    setTimeout(() => navigate("/"), 3000);
  };

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-white">Reset Password</h2>
        <input
          type="password"
          placeholder="New password"
          className="w-full p-2 mb-4 rounded border border-gray-600 text-gray-900 placeholder-gray-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={handleReset}
          className="w-full bg-indigo-600 p-2 rounded hover:bg-indigo-700 text-white"
        >
          Reset Password
        </button>
        {message && <p className="mt-4 text-sm text-white">{message}</p>}
      </div>
    </div>
  );
}
