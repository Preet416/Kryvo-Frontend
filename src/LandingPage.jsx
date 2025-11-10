import React from "react";

export default function LandingPage({ onShowAuth }) {
  return (
    <div className="w-screen min-h-screen font-sans bg-gray-900 text-gray-100">

      {/* 🌐 Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-gray-900/95 backdrop-blur-md shadow-md py-4 px-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-indigo-400">
          Kryvo
        </h1>
        <div className="space-x-4">
          <button
            className="text-gray-300 hover:text-indigo-400 font-medium transition"
            onClick={onShowAuth}
          >
            Sign In
          </button>
          {/*<button
            className="bg-indigo-500 text-white px-5 py-2 rounded-lg hover:bg-indigo-600 transition"
            onClick={onShowAuth}
          >
            Sign Up
          </button> */}
        </div>
      </nav>

     
      <section className="w-screen min-h-[120vh] flex flex-col justify-center items-center text-center px-6 md:px-20 pt-32 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <h1 className="text-6xl md:text-7xl font-extrabold mb-6 tracking-tight text-indigo-400">
          AI Remote Work Suite 
        </h1>
        <p className="text-2xl md:text-3xl mb-6 max-w-3xl mx-auto text-gray-300">
          Powered by AI Assistant — Collaborate, Communicate, and Create Seamlessly from Anywhere.
        </p>
        <p className="text-lg md:text-xl mb-12 max-w-4xl mx-auto text-gray-400">
          Chat, manage tasks, create documents, whiteboards, and AI-powered insights — all in one place.
        </p>

        
       <div className="w-full max-w-5xl h-[28rem] bg-gray-700 rounded-xl mb-12 flex items-center justify-center overflow-hidden">
        <img
         src="/banner1.jpeg"
         alt="Hero Image"
         className="w-full h-full object-cover rounded-xl"
  />
</div>


        <button
          className="bg-indigo-500 text-white font-bold px-10 py-4 rounded-xl hover:bg-indigo-600 transition text-lg shadow-lg"
          onClick={onShowAuth}
        >
          Get Started
        </button>
      </section>

     
      <section className="w-full py-32 px-6 md:px-20 bg-gray-800">
        <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center text-indigo-400">
          AI-Powered Productivity
        </h2>

        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
       
          <div className="bg-gray-900 rounded-xl p-8 shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2 hover:scale-105 flex flex-col items-center">
            <div className="w-full h-40 bg-gray-700 rounded mb-6 flex items-center justify-center text-gray-400">
               <img
                 src="/ai-illustration.png"
                 alt="AI Illustration"
                 className="w-full h-full object-cover rounded"
              />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-indigo-300">Smart Task Management</h3>
            <p className="text-gray-400 text-center">
              Let AI prioritize your tasks and suggest actionable next steps to maximize productivity.
            </p>
          </div>

          
          <div className="bg-gray-900 rounded-xl p-8 shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2 hover:scale-105 flex flex-col items-center">
            <div className="w-full h-40 bg-gray-700 rounded mb-6 flex items-center justify-center text-gray-400">
                <img
                 src="/AiDoc.png"
                 alt="AI Illustration"
                 className="w-full h-full object-cover rounded"
               />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-indigo-300">AI Document Assistance</h3>
            <p className="text-gray-400 text-center">
              Draft, summarize, and edit documents with AI-powered suggestions in real-time.
            </p>
          </div>

          <div className="bg-gray-900 rounded-xl p-8 shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2 hover:scale-105 flex flex-col items-center">
            <div className="w-full h-40 bg-gray-700 rounded mb-6 flex items-center justify-center text-gray-400">
              <img
                 src="/team.png"
                 alt="AI Illustration"
                 className="w-full h-full object-cover rounded"
             />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-indigo-300">Team Insights</h3>
            <p className="text-gray-400 text-center">
              Get AI-powered analytics and insights on team performance, progress, and collaboration trends.
            </p>
          </div>
        </div>
      </section>

    
      <section className="w-full py-32 px-6 md:px-20 bg-gray-900">
        <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center text-indigo-400">
          Why Choose RemoteWork AI
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { title: "All-in-One Suite", desc: "Docs, chat, tasks, whiteboards all integrated." },
            { title: "AI-Powered", desc: "Automate and optimize your workflow seamlessly." },
            { title: "Secure & Reliable", desc: "Enterprise-grade security for your remote team." },
            { title: "Collaborate in Real-Time", desc: "See changes instantly, communicate instantly." },
            { title: "Customizable", desc: "Tailor the workspace for your team needs." },
            { title: "Cross-Platform", desc: "Access anywhere, anytime, on any device." },
          ].map((item, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-2xl transition transform hover:-translate-y-3 hover:scale-105 cursor-pointer"
            >
              <h3 className="text-2xl font-semibold mb-4 text-indigo-300">{item.title}</h3>
              <p className="text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      
      <footer className="w-full py-12 px-6 md:px-20 bg-gray-900 text-gray-400 flex flex-col md:flex-row justify-between items-center border-t border-gray-700">
        <p className="mb-4 md:mb-0">© 2025 RemoteWork AI. All rights reserved.</p>
        <div className="space-x-4">
          <a href="#" className="hover:text-indigo-400 transition">
            Privacy
          </a>
          <a href="#" className="hover:text-indigo-400 transition">
            Terms
          </a>
          <a href="#" className="hover:text-indigo-400 transition">
            Contact
          </a>
        </div>
      </footer>
    </div>
  );
}
