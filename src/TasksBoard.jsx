import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import axios from "axios";
import { v4 as uuidv4 } from "uuid"; 
import { supabase } from "./supabaseClient";

export default function TasksBoard({ currentUser, role }) {
  const userRole = role || currentUser?.user_metadata?.role || "employee";

  const [columns, setColumns] = useState({
    todo: { name: "To Do", items: [] },
    inprogress: { name: "In Progress", items: [] },
    review: { name: "Review", items: [] },
    done: { name: "Done", items: [] },
  });

  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    status: "todo",
  });

  const [unsavedTasks, setUnsavedTasks] = useState({}); 

  
  const normalizeTask = (t) => {
    return {
      ...t,
      
      assignedTo: t.assignedTo || t.assigned_to || null,
      managerId: t.managerId || t.manager_id || null,
      status: t.status || "todo",
    };
  };

 
  const fetchTasks = async () => {
    if (!currentUser?.email || !userRole) return;
    try {
      const res = await axios.get("http://localhost:5000/api/tasks", {
        params: { email: currentUser.email, role: userRole },
      });
      let tasks = res.data || [];

      
      tasks = tasks.map(normalizeTask);

      const newColumns = {
        todo: { name: "To Do", items: [] },
        inprogress: { name: "In Progress", items: [] },
        review: { name: "Review", items: [] },
        done: { name: "Done", items: [] },
      };
      tasks.forEach((task) => {
        if (!task.id) task.id = uuidv4();
        if (!newColumns[task.status]) {
          newColumns[task.status] = { name: task.status, items: [] };
        }
        newColumns[task.status].items.push(task);
      });
      setColumns(newColumns);
      setUnsavedTasks({});
    } catch (err) {
      console.error("Failed to fetch tasks", err);
      alert("Failed to fetch tasks");
    }
  };

  useEffect(() => {
    fetchTasks();
    
  }, [currentUser?.email, userRole]);

  const handleAddTask = async () => {
    if (!taskData.title.trim()) return alert("Enter task title!");
    const newTask = {
      ...taskData,
      assignedTo: taskData.assignedTo || currentUser.email,
      id: uuidv4(),
    };

    
    const payload = {
      ...newTask,
      assigned_to: newTask.assignedTo,
      manager_id: newTask.managerId || null,
    };

    try {
      const res = await axios.post("http://localhost:5000/api/tasks", payload, {
        headers: { "Content-Type": "application/json" },
      });
      let addedTask = res.data || newTask;
      if (!addedTask.id) addedTask.id = newTask.id;

      
      addedTask = normalizeTask(addedTask);

      setColumns((prev) => {
        const updated = { ...prev };
        const exists = updated.todo.items.find((item) => item.id === addedTask.id);
        if (!exists) updated.todo.items.push(addedTask);
        return updated;
      });

      
      try {
        
        const employeeIdOrEmail = addedTask.assignedTo;
        await supabase.functions.invoke("send-task-email", {
          employee_id_or_email: employeeIdOrEmail,
          task_title: addedTask.title,
          task_description: addedTask.description,
          manager_name: currentUser?.user_metadata?.full_name || currentUser?.name || currentUser?.email,
        });
      } catch (emailErr) {
        console.error("Email notification failed", emailErr);
      }

      setTaskData({ title: "", description: "", assignedTo: "", status: "todo" });
    } catch (err) {
      console.error("Failed to add task", err);
      alert("Failed to add task");
    }
  };


  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`);
      setColumns((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((col) => {
          updated[col].items = updated[col].items.filter((item) => item.id !== taskId);
        });
        return updated;
      });
    } catch (err) {
      console.error("Failed to delete task", err);
      alert("Failed to delete task");
    }
  };


  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;
    const sourceCol = columns[source.droppableId];
    const destCol = columns[destination.droppableId];
    const [movedItem] = sourceCol.items.splice(source.index, 1);
    movedItem.status = destination.droppableId;
    destCol.items.splice(destination.index, 0, movedItem);
    setColumns({ ...columns });

    // track unsaved
    setUnsavedTasks((prev) => ({ ...prev, [movedItem.id]: movedItem }));
  };

 
  const handleSave = async () => {
    const tasksToSave = Object.values(unsavedTasks);
    if (tasksToSave.length === 0) return alert("No changes to save!");

    try {
      await Promise.all(
        tasksToSave.map((task) =>
          axios.put(`http://localhost:5000/api/tasks/${task.id}`, {
            ...task,
          
            assigned_to: task.assignedTo,
            manager_id: task.managerId || null,
          }, {
            headers: { "Content-Type": "application/json" },
          })
        )
      );

   
      for (const task of tasksToSave) {
        try {
          await supabase.functions.invoke("send-task-email", {
            employee_id_or_email: task.assignedTo,
            task_title: task.title,
            task_description: task.description,
            manager_name: currentUser?.user_metadata?.full_name || currentUser?.name || currentUser?.email,
          });
        } catch (emailErr) {
          console.error("Email notification failed", emailErr);
        }
      }

      alert("Tasks saved successfully!");
      setUnsavedTasks({});
    } catch (err) {
      console.error("Failed to save tasks", err);
      alert("Failed to save tasks");
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full bg-gray-900 p-4 overflow-hidden text-gray-100">
      <h1 className="text-2xl font-bold text-indigo-400 mb-4">Tasks Board</h1>

      <div className="bg-gray-800 shadow-md p-4 rounded-lg mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <input
          type="text"
          placeholder="Task title..."
          value={taskData.title}
          onChange={(e) => setTaskData((prev) => ({ ...prev, title: e.target.value }))}
          className="border rounded-lg px-3 py-2 flex-1 bg-gray-700 text-gray-100 border-gray-600"
        />
        <input
          type="text"
          placeholder="Assigned to..."
          value={taskData.assignedTo}
          onChange={(e) => setTaskData((prev) => ({ ...prev, assignedTo: e.target.value }))}
          className="border rounded-lg px-3 py-2 flex-1 bg-gray-700 text-gray-100 border-gray-600"
        />
        <textarea
          placeholder="Description..."
          value={taskData.description}
          onChange={(e) => setTaskData((prev) => ({ ...prev, description: e.target.value }))}
          className="border rounded-lg px-3 py-2 flex-1 bg-gray-700 text-gray-100 border-gray-600"
        />
        <button
          onClick={handleAddTask}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Add Task
        </button>
        <button
          onClick={handleSave}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          Save Changes
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 h-full">
            {Object.entries(columns).map(([id, column]) => (
              <Droppable key={id} droppableId={id}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="bg-gray-800 rounded-xl shadow p-4 flex flex-col h-full"
                  >
                    <h2 className="text-xl font-semibold text-indigo-300 mb-3">{column.name}</h2>
                    <div className="flex-1 overflow-y-auto">
                      {column.items.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided) => (
                            <div
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              ref={provided.innerRef}
                              className="bg-gray-700 rounded-lg p-3 mb-3 shadow hover:bg-gray-600 transition cursor-pointer flex justify-between items-start"
                            >
                              <div>
                                <h3 className="font-semibold text-gray-100">{item.title}</h3>
                                {item.assignedTo && <p className="text-sm text-gray-300">👤 {item.assignedTo}</p>}
                                {item.description && <p className="text-xs text-gray-400 mt-1">{item.description}</p>}
                              </div>
                              <button
                                onClick={() => handleDeleteTask(item.id)}
                                className="text-red-400 hover:text-red-600 font-bold ml-2"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
