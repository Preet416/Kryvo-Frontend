import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function CompletedByEmployee({ managerId }) {
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!managerId) return;

    const fetchCompleted = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status, assigned_to, updated_at")
        .eq("manager_id", managerId)
        .or("status.eq.Completed,status.eq.Pending Review")
        .order("updated_at", { ascending: false });

      console.log("fetched tasks for manager", managerId, data, error);

      if (error) {
        console.error("Error fetching completed tasks:", error);
      } else {
        setCompletedTasks(data || []);
      }

      setLoading(false);
    };

    fetchCompleted();

    const channel = supabase
      .channel(`public:tasks:completed:${managerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `manager_id=eq.${managerId}`,
        },
        () => fetchCompleted()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [managerId]);

  
  const handleApprove = async (taskId) => {
    const { error } = await supabase
      .from("tasks")
      .update({ status: "Verified" })
      .eq("id", taskId);

    if (error) {
      console.error("❌ Error approving task:", error);
      alert("Failed to approve task. Please try again.");
    } else {
      alert("Task approved successfully!");
    }
  };

  if (loading)
    return <div className="text-gray-300">Loading completed tasks...</div>;
  if (completedTasks.length === 0)
    return <div className="text-gray-400">No completed tasks yet.</div>;

  return (
    <div className="space-y-3">
      {completedTasks.map((t) => (
        <div key={t.id} className="bg-gray-800 p-3 rounded shadow">
          <div className="flex justify-between items-center">
            <h3 className="text-indigo-300 font-semibold">{t.title}</h3>
            <span
              className={`text-xs px-2 py-1 rounded ${
                t.status === "Verified"
                  ? "bg-green-600"
                  : t.status === "Pending Review"
                  ? "bg-yellow-600"
                  : "bg-blue-600"
              }`}
            >
              {t.status}
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Assigned to: {t.assigned_to || "Unknown"}
          </p>
          <p className="text-gray-500 text-xs">
            Updated at: {new Date(t.updated_at).toLocaleString()}
          </p>

          
          {t.status === "Pending Review" && (
            <button
              onClick={() => handleApprove(t.id)}
              className="mt-2 bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded"
            >
              Approve
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
