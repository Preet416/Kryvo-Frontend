import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function ApprovedTasks({ currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [employeeId, setEmployeeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAuthUserId = () =>
    currentUser?.id || currentUser?.user?.id || currentUser?.sub || null;

  const getAuthEmail = () =>
    currentUser?.email ||
    currentUser?.user?.email ||
    currentUser?.user_metadata?.email ||
    null;

  useEffect(() => {
    let mounted = true;

    const resolveEmployeeId = async () => {
      try {
        const authUserId = getAuthUserId();
        const authEmail = getAuthEmail();

        let emp = null;
        if (authUserId) {
          const { data } = await supabase
            .from("employees")
            .select("id")
            .eq("user_id", authUserId)
            .single();
          if (data) emp = data;
        }
        if (!emp && authEmail) {
          const { data } = await supabase
            .from("employees")
            .select("id")
            .eq("email", authEmail)
            .single();
          if (data) emp = data;
        }

        if (mounted) setEmployeeId(emp?.id || null);
      } catch (err) {
        console.error("Failed to resolve employee id", err);
        if (mounted) setError("Failed to locate employee record.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    resolveEmployeeId();
    return () => {
      mounted = false;
    };
  }, [currentUser]);


  useEffect(() => {
    if (!employeeId) return;

    const fetchApprovedTasks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, description, updated_at, manager_id")
        .eq("assigned_to", employeeId)
        .eq("status", "Verified")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching approved tasks:", error);
        setTasks([]);
      } else {
        setTasks(data || []);
      }

      setLoading(false);
    };

    fetchApprovedTasks();

    const channel = supabase
      .channel(`public:tasks:approved:${employeeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `assigned_to=eq.${employeeId}`,
        },
        () => fetchApprovedTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [employeeId]);

  if (loading) return <div className="text-gray-300">Loading approved tasks...</div>;
  if (error) return <div className="text-red-400">{error}</div>;
  if (!tasks.length)
    return <div className="text-gray-400">No approved tasks yet.</div>;

  return (
    <div className="space-y-3">
      {tasks.map((t) => (
        <div key={t.id} className="bg-gray-800 p-4 rounded shadow">
          <div className="flex justify-between items-center">
            <h3 className="text-indigo-300 font-semibold">{t.title}</h3>
            <span className="text-xs px-2 py-1 rounded bg-green-600 text-white">
              Approved
            </span>
          </div>
          {t.description && (
            <p className="text-gray-400 text-sm mt-1">{t.description}</p>
          )}
          <p className="text-gray-500 text-xs">
            Updated: {new Date(t.updated_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
