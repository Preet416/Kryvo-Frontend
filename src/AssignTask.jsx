import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AssignTask({ currentUser }) {
  const [manager, setManager] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [assignee, setAssignee] = useState("");
  const [status, setStatus] = useState("Do Today");
  const [custom, setCustom] = useState("");
  const [customSections, setCustomSections] = useState([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const userId = currentUser?.id || currentUser?.user?.id;
      const { data: mgr } = await supabase
        .from("managers")
        .select("*")
        .eq("user_id", userId)
        .single();
      setManager(mgr);
      if (mgr) {
        const { data: emps } = await supabase
          .from("employees")
          .select("*")
          .eq("manager_id", mgr.id);
        setEmployees(emps || []);
      }
    };
    load();
  }, [currentUser]);

  const handleAddCustom = () => {
    if (!custom) return;
    setCustomSections((s) => [...s, custom]);
    setStatus(custom);
    setCustom("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !assignee) {
      setMessage("Title and assignee required");
      return;
    }

    const payload = {
      title,
      description: desc,
      assigned_to: assignee,
      manager_id: manager.id,
      status,
      custom_section: STATUS_IS_CUSTOM(status) ? status : null,
    };

    const { data, error } = await supabase
      .from("tasks")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error(error);
      setMessage("Error creating task");
    } else {
      // ✅ Send email notification via backend API instead of Supabase function
      try {
        await fetch("http://localhost:5000/api/tasks", {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        title,
        description: desc,
        assignedTo: assignee,
        status,
        managerId: manager?.id, // include manager id for backend
       }),
      });
      } catch (emailErr) {
        console.error("Email notification failed", emailErr);
      }

      setMessage("Task assigned!");
      setTitle("");
      setDesc("");
      setAssignee("");
      setStatus("Do Today");
      navigate("/manager");
    }
  };

  function STATUS_IS_CUSTOM(s) {
    return !["Do Today", "Do Next Week", "Do Later"].includes(s);
  }

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-gray-100">
      <div className="fixed z-20 bg-gray-800 text-gray-100 shadow-lg h-full w-72 p-6">
        <h1 className="text-xl font-bold text-indigo-400">Assign Task</h1>
      </div>
      <div className="flex-1 ml-72 p-6">
        <div className="bg-gray-800 rounded p-6 max-w-2xl">
          <h2 className="text-lg text-white mb-4">New Task</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task Title"
              className="w-full p-3 rounded bg-gray-700"
            />
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full p-3 rounded bg-gray-700"
            />
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full p-3 rounded bg-gray-700"
            >
              <option value="">Select employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name || emp.email}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="p-3 rounded bg-gray-700 flex-1"
              >
                <option>Do Today</option>
                <option>Do Next Week</option>
                <option>Do Later</option>
                {customSections.map((cs) => (
                  <option key={cs}>{cs}</option>
                ))}
              </select>
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Add custom section"
                className="p-3 rounded bg-gray-700"
              />
              <button
                type="button"
                onClick={handleAddCustom}
                className="px-4 rounded bg-indigo-600"
              >
                Add
              </button>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-green-500 rounded">
                Assign
              </button>
              <button
                type="button"
                onClick={() => navigate("/manager")}
                className="px-4 py-2 bg-gray-700 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
          {message && <div className="mt-4 text-sm text-gray-300">{message}</div>}
        </div>
      </div>
    </div>
  );
}
