import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DocsEditor from "./DocsEditor";
import Whiteboard from "./Whiteboard";
import TasksBoard from "./TasksBoard";
import Chat from "./Chat";
import MeetingRoom from "./MeetingRoom";
import JoinManager from "./JoinManager";
import ManagerAssignedTasks from "./ManagerAssignedTasks";
import CompletedTaskHistory from "./CompletedTaskHistory"; 
import ApprovedTasks from "./ApprovedTasks"; 
import { Menu, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export default function Dashboard({ onLogout, currentUser, isHost: initialIsHost, roomId: initialRoomId }) {
  const [activeTab, setActiveTab] = useState("docs");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomFromURL = searchParams.get("room") || initialRoomId || null;

  const isHostFromURL = searchParams.get("isHost") === "true" || initialIsHost || false;

  const createMeeting = () => {
    const newRoomId = uuidv4();
    navigate(`/dashboard?room=${newRoomId}&isHost=true`);
    setActiveTab("meeting");
  };

  const joinMeeting = () => {
    const roomInput = prompt("Enter Meeting ID to join:");
    if (roomInput) {
      navigate(`/dashboard?room=${roomInput}&isHost=false`);
      setActiveTab("meeting");
    }
  };

  
  const tabs = [
    { key: "docs", label: "Docs" },
    { key: "whiteboard", label: "Whiteboard" },
    { key: "tasks", label: "Tasks" },
    { key: "managerTasks", label: "Manager Tasks" },
    { key: "completedHistory", label: "Completed History" }, 
    { key: "approvedTasks", label: "Approved Tasks" }, 
    { key: "chat", label: "Chat" },
    { key: "meeting", label: "Meeting" },
    { key: "joinmanager", label: "Join Manager" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "whiteboard":
        return <Whiteboard />;
      case "tasks":
        return <TasksBoard currentUser={currentUser} />;
      case "managerTasks":
        return <ManagerAssignedTasks currentUser={currentUser} />;
      case "completedHistory": 
        return <CompletedTaskHistory currentUser={currentUser} />;
      case "approvedTasks": 
        return <ApprovedTasks currentUser={currentUser} />;
      case "chat":
        return (
          <Chat
            username={currentUser.name || currentUser.email}
            room="team-room"
          />
        );
      case "meeting":
       
        if (!roomFromURL) {
          return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <button
                onClick={createMeeting}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create Meeting
              </button>
              <button
                onClick={joinMeeting}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Join Meeting
              </button>
            </div>
          );
        }
        return (
          <MeetingRoom
            roomId={roomFromURL}
            currentUser={currentUser}
            isHost={isHostFromURL}
          />
        );
      case "joinmanager":
        return <JoinManager currentUser={currentUser} />;
      default:
        return <DocsEditor />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-gray-100 relative overflow-hidden">
      
      <aside
        className={`fixed md:relative z-20 bg-gray-800 h-full w-64 transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-indigo-400">Remote Suite</h1>
          <button
            className="md:hidden text-gray-300 hover:text-indigo-400"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex flex-col space-y-2 p-4 h-[calc(100%-4rem)]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSidebarOpen(false);
              }}
              className={`px-4 py-2 text-left rounded-lg font-medium transition-all transform
                ${
                  activeTab === tab.key
                    ? "bg-indigo-600 text-white scale-105 shadow-lg"
                    : "bg-gray-700 text-gray-200 hover:bg-indigo-500/40 hover:text-white hover:scale-105"
                }`}
            >
              {tab.label}
            </button>
          ))}

         
          <button
            onClick={onLogout}
            className="mt-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md transition-all"
          >
            🚪 Logout
          </button>
        </nav>
      </aside>

    
      <div className="md:hidden absolute top-4 left-4 z-30">
        <button
          className="bg-indigo-600 text-white p-2 rounded-lg shadow-md hover:bg-indigo-700 transition"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={22} />
        </button>
      </div>

      <main className="flex-1 flex flex-col h-full w-full p-6 bg-gray-900 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
}
