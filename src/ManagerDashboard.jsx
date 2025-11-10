import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import EmployeeTaskBoard from "./EmployeeTaskBoard";
import { Link } from "react-router-dom";
import TimelineView from "./TimelineView";
import CompletedByEmployee from "./CompletedByEmployees";

export default function ManagerDashboard({ currentUser, onLogout }) {
  const [manager, setManager] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("timeline"); // timeline | employees | completed

  useEffect(() => {
    const fetchManager = async () => {
      setLoading(true);
      const userId = currentUser?.id || currentUser?.user?.id || currentUser?.sub;

      const { data: mgr, error: mgrErr } = await supabase
        .from("managers")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (mgrErr || !mgr) {
        const { data: created, error: createErr } = await supabase
          .from("managers")
          .insert([
            {
              user_id: userId,
              name:
                currentUser?.user_metadata?.full_name ||
                currentUser?.name ||
                currentUser?.email,
              email: currentUser?.email,
              unique_code: generateCode(6),
            },
          ])
          .select()
          .single();

        if (createErr) console.error("create manager err", createErr);
        else setManager(created);
      } else {
        setManager(mgr);
      }
      setLoading(false);
    };
    fetchManager();
  }, [currentUser]);

  useEffect(() => {
    if (!manager) return;

    const fetchEmployees = async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*, tasks:tasks(*)")
        .eq("manager_id", manager.id);

      if (error) console.error(error);
      else
        setEmployees(
          (data || []).map((e) => ({
            ...e,
            tasks: e.tasks || [],
          }))
        );
    };

    fetchEmployees();

    const tasksSub = supabase
      .channel(`public:tasks:manager=${manager?.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `manager_id=eq.${manager.id}`,
        },
        () => fetchEmployees()
      )
      .subscribe();

    return () => {
      if (tasksSub) supabase.removeChannel(tasksSub);
    };
  }, [manager]);

  function generateCode(len = 6) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  if (loading) return <div className="p-8 text-gray-200">Loading manager...</div>;

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-gray-100 overflow-hidden">
      {/* =======================
          SIDEBAR
         ======================= */}
      <div className="fixed md:relative z-20 bg-gray-800 text-gray-100 shadow-lg h-full w-64 p-4">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-indigo-400">
            Remote Suite — Manager
          </h1>
          <p className="text-sm text-gray-300 mt-1">{manager?.name}</p>
          <p className="text-xs text-gray-400">
            Code:{" "}
            <span className="font-mono text-indigo-300">
              {manager?.unique_code}
            </span>
          </p>
        </div>

        <nav className="flex flex-col space-y-2 h-[calc(100%-6rem)]">
          <Link
            to="/manager/assign"
            className="px-4 py-2 bg-indigo-600 rounded text-white"
          >
            Assign Task
          </Link>

          <button
            onClick={() => setActiveTab("timeline")}
            className={`mt-4 px-4 py-2 rounded ${
              activeTab === "timeline" ? "bg-indigo-600" : "bg-gray-700"
            }`}
          >
            Timeline View
          </button>

          <button
            onClick={() => setActiveTab("employees")}
            className={`px-4 py-2 rounded ${
              activeTab === "employees" ? "bg-indigo-600" : "bg-gray-700"
            }`}
          >
            Employees
          </button>

          {/* ✅ New Completed Tab */}
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-4 py-2 rounded ${
              activeTab === "completed" ? "bg-indigo-600" : "bg-gray-700"
            }`}
          >
            Completed by Employees
          </button>

          <button
            onClick={onLogout}
            className="mt-auto px-4 py-2 bg-red-600 rounded text-white"
          >
            Logout
          </button>
        </nav>
      </div>

      {/* =======================
          MAIN CONTENT
         ======================= */}
      <div className="flex-1 ml-[16rem] p-4 overflow-auto space-y-6 transition-all duration-300 max-w-full">
        {/* ===== Timeline Tab ===== */}
        {activeTab === "timeline" && (
          <>
            <h2 className="text-2xl text-white mb-2">Team Overview</h2>

            {employees.length > 0 && (
              <div className="bg-gray-800 p-3 rounded shadow">
                <h3 className="text-lg font-semibold text-indigo-300 mb-2">
                  Timeline View
                </h3>
                <TimelineView employees={employees} />
              </div>
            )}

            <div className="grid gap-4">
              {/* quick stats row */}
              <div className="flex gap-2 items-start">
                <div className="bg-gray-800 p-3 rounded shadow w-44">
                  <div className="text-sm text-gray-400">Employees</div>
                  <div className="text-2xl font-bold text-indigo-300">
                    {employees.length}
                  </div>
                </div>
                <div className="bg-gray-800 p-3 rounded shadow w-44">
                  <div className="text-sm text-gray-400">Open Tasks</div>
                  <div className="text-2xl font-bold text-indigo-300">
                    {employees.reduce(
                      (acc, e) =>
                        acc + (Array.isArray(e.tasks) ? e.tasks.length : 0),
                      0
                    )}
                  </div>
                </div>
              </div>

              {/* employee task boards */}
              <div className="space-y-3">
                {employees.length === 0 && (
                  <div className="text-gray-400">
                    No employees yet. Share your manager code{" "}
                    <span className="font-mono text-indigo-300">
                      {manager?.unique_code}
                    </span>{" "}
                    with your team for them to join.
                  </div>
                )}
                {employees.map((emp) => (
                  <div key={emp.id} className="bg-gray-800 rounded p-3">
                    <EmployeeTaskBoard
                      employeeName={emp.name || emp.email}
                      tasks={emp.tasks || []}
                      employeeId={emp.id}
                      managerId={manager.id}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ===== Employees Tab ===== */}
        {activeTab === "employees" && (
          <div className="bg-gray-800 p-4 rounded shadow">
            <h2 className="text-2xl text-indigo-300 mb-4">Employees List</h2>
            {employees.length === 0 && (
              <p className="text-gray-400">No employees connected yet.</p>
            )}
            {employees.length > 0 && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-4 py-2 text-gray-300">Name</th>
                    <th className="px-4 py-2 text-gray-300">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-gray-700">
                      <td className="px-4 py-2">{emp.name || emp.email}</td>
                      <td className="px-4 py-2">{emp.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ===== ✅ Completed Tab ===== */}
        {activeTab === "completed" && (
          <div className="bg-gray-800 p-4 rounded shadow">
            <h2 className="text-2xl text-indigo-300 mb-4">
              Completed Tasks by Employees
            </h2>
            <CompletedByEmployee managerId={manager.id} />
          </div>
        )}
      </div>
    </div>
  );
}
