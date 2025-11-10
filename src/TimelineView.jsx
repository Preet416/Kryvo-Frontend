import React, { useMemo } from "react";
import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  Line,
} from "recharts";

export default function TimelineView({ employees }) {
  const data = useMemo(() => {
    return employees.map((emp) => {
      const tasks = emp.tasks || [];

      const done = tasks.filter((t) => t.status === "Completed" || t.status === "Verified").length;
      const pending = tasks.filter((t) => t.status === "Pending" || t.status === "Pending Review").length;
      const current = tasks.find((t) => t.status === "In Progress");

      const totalDays = tasks.reduce((acc, t) => {
        if (!t.start_date || !t.due_date) return acc + 1;
        const s = new Date(t.start_date);
        const e = new Date(t.due_date);
        const diffDays = (e - s) / (1000 * 60 * 60 * 24);
        return acc + (isNaN(diffDays) ? 1 : Math.max(1, diffDays));
      }, 0);

      return {
        name: emp.name || emp.email || "Unnamed",
        workload: totalDays,
        done,
        pending,
        currentTask: current ? current.title : "—",
      };
    });
  }, [employees]);

  if (!data.length)
    return <div className="text-gray-400">No data to display.</div>;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const emp = payload[0].payload;
      return (
        <div className="bg-gray-900 text-gray-100 p-3 rounded shadow-lg border border-gray-700 text-sm">
          <p className="font-semibold text-indigo-400 mb-1">{emp.name}</p>
          <p>✅ Tasks Done: {emp.done}</p>
          <p>🕐 Tasks Pending: {emp.pending}</p>
          <p>🚧 Current Task: {emp.currentTask}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-800 rounded p-4 shadow">
      <h3 className="text-lg text-indigo-300 mb-2">Timeline View</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart layout="vertical" data={data} margin={{ left: 60 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#444" />
            <XAxis type="number" stroke="#aaa" hide />
            <YAxis dataKey="name" type="category" stroke="#aaa" />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
           
            <Bar dataKey="workload" fill="#818cf8" barSize={8} radius={[10, 10, 10, 10]} />
           
            <Line type="monotone" dataKey="workload" stroke="#a5b4fc" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
