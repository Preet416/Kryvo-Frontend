import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function ManagerAssignedTasks({ currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState({});

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
    return () => (mounted = false);
  }, [currentUser]);

  useEffect(() => {
    let channel = null;
    let mounted = true;

    const fetchAssignedTasks = async (assignedToValue) => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("assigned_to", assignedToValue)
        .not("manager_id", "is", null)
        .neq("status", "Pending Review");
      if (!error && mounted) setTasks(data || []);
    };

    const authUserId = getAuthUserId();
    const authEmail = getAuthEmail();
    const assignedToValue = employeeId || authUserId || authEmail;
    if (!assignedToValue) return;

    fetchAssignedTasks(assignedToValue);

    channel = supabase
      .channel(`public:tasks:assigned_to=${assignedToValue}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `assigned_to=eq.${assignedToValue}`,
        },
        () => fetchAssignedTasks(assignedToValue)
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
      mounted = false;
    };
  }, [employeeId]);

  const updateTaskStatus = async (taskId, newStatus) => {
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", taskId);

    if (error) {
      console.error("Failed to update task status:", error);
      alert("Error updating status. Try again.");
    } else {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    }
  };

  // 🟢 handle file selection
  const handleFileChange = (taskId, file) => {
    setSelectedFiles((prev) => ({ ...prev, [taskId]: file }));
  };

  // 🟢 DEBUG CHECK BEFORE SUBMITTING
  const verifyAuthContext = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    console.log("🟡 Supabase Auth User:", user ? user.id : "No user session");
    console.log("🟢 Resolved Employee ID:", employeeId);
    if (error) console.error("Auth fetch error:", error);
  };

  // 🧠 UPDATED SUBMIT FUNCTION (this is the only change)
  const submitTaskForReview = async (taskId) => {
    const file = selectedFiles[taskId];
    if (!file) {
      alert("Please attach your work file before submitting.");
      return;
    }

    try {
      await verifyAuthContext();

      setUploading(true);
      const filePath = `task-uploads/${taskId}/${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("task-uploads")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("task-uploads")
        .getPublicUrl(filePath);

      const fileUrl = publicUrlData?.publicUrl;
      if (!fileUrl) throw new Error("Public URL not generated for uploaded file");

      // 🧩 Safer update with select + log
      const { data: updatedTask, error: dbError } = await supabase
        .from("tasks")
        .update({
          status: "Pending Review",
          attachment_url: fileUrl,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", taskId)
        .select("id, assigned_to")
        .single();

      console.log("🟢 Updated Task Result:", updatedTask);
      if (dbError) throw dbError;

      alert("✅ Task submitted for review successfully!");
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error("Error submitting task:", err.message);
      alert("Error submitting. Try again.");
    } finally {
      setUploading(false);
    }
  };

  if (loading)
    return <div className="text-gray-300">Loading manager tasks...</div>;
  if (error) return <div className="text-red-400">{error}</div>;
  if (!tasks?.length)
    return (
      <div className="text-gray-400">No tasks assigned by your manager.</div>
    );

  const statusOptions = ["In Progress", "Blocked", "Completed"];

  return (
    <div className="flex flex-col gap-4">
      {tasks.map((task) => (
        <div key={task.id} className="bg-gray-800 p-4 rounded shadow">
          <h3 className="text-indigo-300 font-semibold">{task.title}</h3>
          {task.description && (
            <p className="text-gray-300 mt-1">{task.description}</p>
          )}

          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-gray-500">Status: {task.status}</p>
            <select
              className="bg-gray-700 text-gray-200 text-sm p-1 rounded"
              value={task.status || ""}
              onChange={(e) => updateTaskStatus(task.id, e.target.value)}
            >
              <option value="">--Select--</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {task.status === "Completed" && (
            <div className="mt-3 space-y-2">
              <input
                type="file"
                onChange={(e) => handleFileChange(task.id, e.target.files[0])}
                className="text-sm text-gray-200"
              />
              <button
                disabled={uploading}
                onClick={() => submitTaskForReview(task.id)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Submit for Review"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
