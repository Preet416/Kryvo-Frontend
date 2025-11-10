import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function CompletedTaskHistory({ currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState(null);
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
    let mounted = true;
    let channel = null;

    const fetchCompletedTasks = async (assignedToValue) => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("assigned_to", assignedToValue)
        
          .in("status", ["Completed", "Pending Review", "Verified"])
          .order("updated_at", { ascending: false });

        if (error) {
          console.error("Error fetching completed tasks:", error);
          if (mounted) setTasks([]);
        } else {
          if (mounted) setTasks(data || []);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        if (mounted) setTasks([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (!employeeId) return;
    fetchCompletedTasks(employeeId);

   
    channel = supabase
      .channel(`public:tasks:completed:${employeeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `assigned_to=eq.${employeeId}`,
        },
        () => fetchCompletedTasks(employeeId)
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
      mounted = false;
    };
  }, [employeeId]);

  if (loading) return <div className="text-gray-300">Loading completed tasks...</div>;
  if (error) return <div className="text-red-400">{error}</div>;
  if (!tasks.length)
    return <div className="text-gray-400">No completed tasks yet.</div>;

  return (
    <div className="flex flex-col gap-4">
      {tasks.map((task) => (
        <div key={task.id} className="bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-indigo-300 font-semibold">{task.title}</h3>
            <span
              className={`text-xs px-2 py-1 rounded ${
                task.status === "Verified"
                  ? "bg-green-600 text-white"
                  : task.status === "Pending Review"
                  ? "bg-yellow-600 text-white"
                  : "bg-blue-600 text-white"
              }`}
            >
              {task.status}
            </span>
          </div>

          {task.description && (
            <p className="text-gray-300 mb-2">{task.description}</p>
          )}

          {task.deadline && (
            <p className="text-sm text-gray-400">
              Deadline:{" "}
              {new Date(task.deadline).toLocaleDateString(undefined, {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
