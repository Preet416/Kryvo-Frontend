import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DocsEditor from "./DocsEditor";
import Whiteboard from "./Whiteboard";
import TasksBoard from "./TasksBoard";
import MeetingRoom from "./MeetingRoom";
import Chat from "./Chat";
import { Menu, X } from "lucide-react";

export default function Dashboard({ onLogout, currentUser, isHost, roomId }) {
  const [activeTab, setActiveTab] = useState("docs");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [searchParams] = useSearchParams();
  const roomFromURL = searchParams.get("room") || roomId || "project-room-1";

  const renderContent = () => {
    switch (activeTab) {
      case "docs":
        return <DocsEditor />;
      case "whiteboard":
        return <Whiteboard />;
      case "tasks":
      return <TasksBoard currentUser={currentUser} />;
      case "chat":
        return <Chat username={currentUser.name || currentUser.email || "User"} room="team-room" />;
      case "meeting":
        return (
          <MeetingRoom
            roomId={roomFromURL}
            currentUser={{
              email: currentUser.email || currentUser,
              name: currentUser.name || currentUser,
            }}
            isHost={isHost}
          />
        );
      default:
        return <DocsEditor />;
    }
  };

  const tabs = [
    { key: "docs", label: " Docs" },
    { key: "whiteboard", label: "Whiteboard" },
    { key: "tasks", label: "Tasks" },
    { key: "chat", label: "Chat" },
    { key: "meeting", label: "Meeting" },
  ];

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed md:relative z-20 bg-gray-800 text-gray-100 shadow-lg h-full w-64 transform
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300 ease-in-out`}
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
                ${activeTab === tab.key
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
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden absolute top-4 left-4 z-30">
        <button
          className="bg-indigo-600 text-white p-2 rounded-lg shadow-md hover:bg-indigo-700 transition"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col h-full w-full transition-all duration-300 ${sidebarOpen ? "md:ml-64" : "md:ml-0"} p-6 bg-gray-900`}
      >
        <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
