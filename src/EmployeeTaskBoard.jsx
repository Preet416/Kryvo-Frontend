
import React from "react";

const STATUS_ORDER = ["Do Today", "Do Next Week", "Do Later"];

export default function EmployeeTaskBoard({ employeeName, tasks = [] }) {
 
  const groups = {};
  tasks.forEach((t) => {
    const key = t.status || "Do Later";
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });


  const allKeys = [...STATUS_ORDER.filter(k => groups[k]), ...Object.keys(groups).filter(k => !STATUS_ORDER.includes(k))];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">{employeeName}</h3>
        <div className="text-sm text-gray-400">{tasks.length} tasks</div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {allKeys.length === 0 && <div className="text-gray-400">No tasks</div>}
        {allKeys.map((status) => (
          <div key={status} className="min-w-[260px] bg-gray-700 rounded p-3">
            <div className="text-sm font-semibold text-indigo-300 mb-2">{status}</div>
            <div className="space-y-2">
              {groups[status].map((task) => (
                <div key={task.id} className="bg-gray-800 p-2 rounded shadow-sm flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{task.title}</div>
                    {task.custom_section && <div className="text-xs text-gray-400">{task.custom_section}</div>}
                  </div>
                  <div className="text-xs text-gray-400">{new Date(task.updated_at || task.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
