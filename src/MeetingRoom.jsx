import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";

const SOCKET_SERVER_URL = "http://localhost:5000";

// Capitalize helper
const formatName = (nameOrEmail) => {
  if (!nameOrEmail) return "Guest";
  return nameOrEmail
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

export default function MeetingRoom({ roomId, currentUser, isHost }) {
  const [peers, setPeers] = useState([]);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [joined, setJoined] = useState(false);

  const socketRef = useRef();
  const userVideo = useRef();
  const peersRef = useRef([]);
  const streamRef = useRef();

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const userInfo = currentUser || { email: "guest@local", name: "Guest" };

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);

    if (isHost) {
      initMediaStream();
      setJoined(true);
      socketRef.current.emit("join-room-request", { roomId, userInfo });
    } else {
      socketRef.current.emit("join-room-request", { roomId, userInfo });
    }

    socketRef.current.on("waiting-user", ({ socketId, userInfo }) => {
      setWaitingUsers((prev) => [...prev, { socketId, ...userInfo }]);
    });

    socketRef.current.on("approved-to-join", () => {
      setJoined(true);
      initMediaStream();
    });

    socketRef.current.on("new-user-approved", ({ socketId, userInfo }) => {
      const peer = createPeer(socketId, socketRef.current.id, streamRef.current);
      peersRef.current.push({ peerID: socketId, peer, userInfo });
      setPeers((prev) => [...prev, peer]);
    });

    socketRef.current.on("signal", ({ from, signal }) => {
      const item = peersRef.current.find((p) => p.peerID === from);
      if (item) item.peer.signal(signal);
      else if (joined) {
        const peer = addPeer(signal, from, streamRef.current);
        peersRef.current.push({ peerID: from, peer });
        setPeers((prev) => [...prev, peer]);
      }
    });

    socketRef.current.on("user-disconnected", (userId) => {
      const item = peersRef.current.find((p) => p.peerID === userId);
      if (item) item.peer.destroy();
      peersRef.current = peersRef.current.filter((p) => p.peerID !== userId);
      setPeers(peersRef.current.map((p) => p.peer));
    });
  }, []);

  const initMediaStream = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        streamRef.current = stream;
        if (userVideo.current) userVideo.current.srcObject = stream;
      })
      .catch((err) => console.error("Media error:", err));
  };

  const approveUser = (socketId) => {
    socketRef.current.emit("approve-user", { roomId, socketIdToApprove: socketId });
    setWaitingUsers(waitingUsers.filter((u) => u.socketId !== socketId));
  };

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on("signal", (signal) => {
      socketRef.current.emit("signal", { to: userToSignal, from: callerID, signal });
    });
    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on("signal", (signal) => {
      socketRef.current.emit("signal", { to: callerID, from: socketRef.current.id, signal });
    });
    peer.signal(incomingSignal);
    return peer;
  }

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks()[0].enabled = !micOn;
      setMicOn(!micOn);
    }
  };

  const toggleCam = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks()[0].enabled = !camOn;
      setCamOn(!camOn);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-900 p-4 gap-4 overflow-auto">
      <h1 className="text-indigo-400 text-2xl mb-4">Meeting Room: {roomId}</h1>

      {isHost && waitingUsers.length > 0 && (
        <div className="mb-4 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-lg text-indigo-300 mb-2">Waiting for approval:</h2>
          {waitingUsers.map((user) => (
            <div key={user.socketId} className="flex justify-between items-center mb-2">
              <span>{formatName(user.name || user.email)}</span>
              <button
                className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                onClick={() => approveUser(user.socketId)}
              >
                Approve
              </button>
            </div>
          ))}
        </div>
      )}

      {!joined && !isHost && <p className="text-gray-400">Waiting for host approval...</p>}

      <div className="flex gap-4 flex-wrap">
        {joined && (
          <VideoBox
            stream={streamRef.current}
            micOn={micOn}
            camOn={camOn}
            toggleMic={toggleMic}
            toggleCam={toggleCam}
            name={formatName(userInfo.name || userInfo.email)}
          />
        )}

        {peers.map((peerData, index) => (
          <PeerBox key={index} peerData={peerData} />
        ))}
      </div>
    </div>
  );
}

// VideoBox and PeerBox components remain same but use formatName()
function VideoBox({ stream, micOn, camOn, toggleMic, toggleCam, name }) {
  const ref = useRef();
  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="relative w-64 h-48 bg-gray-800 rounded-lg overflow-hidden">
      <video ref={ref} autoPlay muted playsInline className="w-full h-full object-cover rounded-lg" />
      <div className="absolute bottom-2 left-2 flex gap-2">
        <button onClick={toggleMic} className="bg-gray-700 p-1 rounded-full">
          {micOn ? <Mic size={16} /> : <MicOff size={16} />}
        </button>
        <button onClick={toggleCam} className="bg-gray-700 p-1 rounded-full">
          {camOn ? <Video size={16} /> : <VideoOff size={16} />}
        </button>
      </div>
      <div className="absolute bottom-2 right-2 bg-gray-700 px-1 rounded text-white text-sm">{name}</div>
    </div>
  );
}

function PeerBox({ peerData }) {
  const { peer, userInfo } = peerData;
  const ref = useRef();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    peer.on("stream", (stream) => {
      if (ref.current) ref.current.srcObject = stream;
    });
  }, [peer]);

  const toggleMic = () => {
    if (ref.current && ref.current.srcObject) {
      const track = ref.current.srcObject.getAudioTracks()[0];
      track.enabled = !micOn;
      setMicOn(!micOn);
    }
  };

  const toggleCam = () => {
    if (ref.current && ref.current.srcObject) {
      const track = ref.current.srcObject.getVideoTracks()[0];
      track.enabled = !camOn;
      setCamOn(!camOn);
    }
  };

  return (
    <div className="relative w-64 h-48 bg-gray-800 rounded-lg overflow-hidden">
      <video ref={ref} autoPlay playsInline className="w-full h-full object-cover rounded-lg" />
      <div className="absolute bottom-2 left-2 flex gap-2">
        <button onClick={toggleMic} className="bg-gray-700 p-1 rounded-full">
          {micOn ? <Mic size={16} /> : <MicOff size={16} />}
        </button>
        <button onClick={toggleCam} className="bg-gray-700 p-1 rounded-full">
          {camOn ? <Video size={16} /> : <VideoOff size={16} />}
        </button>
      </div>
      <div className="absolute bottom-2 right-2 bg-gray-700 px-1 rounded text-white text-sm">
        {formatName(userInfo.name || userInfo.email)}
      </div>
    </div>
  );
}
