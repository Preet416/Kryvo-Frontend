import React, { useState } from "react";
import { supabase } from "./supabaseClient";

export default function JoinManager({ currentUser }) {
  const [managerCode, setManagerCode] = useState("");
  const [status, setStatus] = useState("");

  const handleJoin = async () => {
    if (!managerCode.trim()) {
      setStatus("Please enter your manager’s code.");
      return;
    }

    try {
      const { data: managerData, error: managerError } = await supabase
        .from("managers")
        .select("id")
        .eq("unique_code", managerCode)
        .maybeSingle();

      if (managerError || !managerData) {
        setStatus("Invalid manager code.");
        return;
      }

      const { error: updateError } = await supabase
        .from("employees")
        .update({ manager_id: managerData.id })
        .eq("user_id", currentUser.id);

      if (updateError) throw updateError;

      setStatus("✅ Successfully connected to manager!");
    } catch (err) {
      console.error(err);
      setStatus("❌ Error connecting to manager.");
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-md mx-auto text-center">
      <h2 className="text-xl font-semibold text-indigo-400 mb-4">
        Join Your Manager
      </h2>
      <input
        type="text"
        value={managerCode}
        onChange={(e) => setManagerCode(e.target.value)}
        placeholder="Enter Manager Code"
        className="w-full px-3 py-2 mb-4 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        onClick={handleJoin}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg"
      >
        Connect
      </button>
      {status && <p className="mt-3 text-sm text-gray-300">{status}</p>}
    </div>
  );
}
