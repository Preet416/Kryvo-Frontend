import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";

const SOCKET_SERVER_URL = "http://localhost:5000";

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
  const alreadyJoinedPeers = useRef(new Set());

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const userInfo = currentUser || { email: "guest@local", name: "Guest" };

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);

    if (isHost) {
      hostFlow();
    } else {
      joinerFlow();
    }

    // ✅ UPDATED: Wrap socket listeners and ensure handlers use the same peerData shape
    const handleWaitingUser = ({ socketId, userInfo }) => {
      setWaitingUsers((prev) => {
        if (prev.find((u) => u.socketId === socketId)) return prev;
        return [...prev, { socketId, ...userInfo }];
      });
    };

    const handleApprovedToJoin = async ({ approvedUsers }) => {
      if (!approvedUsers) return;
      if (!streamRef.current) await initMediaStream();
      setJoined(true);
      // Ensure we setup add-peer (non-initiator) for each approved peer
      await setupPeersAfterApproval(approvedUsers);
    };

    const handleExistingPeers = async (existingPeers) => {
      if (!streamRef.current) await initMediaStream();
      for (const peer of existingPeers) {
        if (!alreadyJoinedPeers.current.has(peer.socketId)) {
          const p = await addPeer(null, peer.socketId, streamRef.current);
          if (p) {
            peersRef.current.push({ peerID: peer.socketId, peer: p, userInfo: peer.userInfo });
            alreadyJoinedPeers.current.add(peer.socketId);
            setPeers([...peersRef.current]);
          }
        }
      }
    };

    const handleNewUserApproved = async ({ socketId, userInfo }) => {
      // Hosts / existing approved users create initiator peer to the new user
      if (!streamRef.current) await initMediaStream();
      if (alreadyJoinedPeers.current.has(socketId)) return;
      const p = await createPeer(socketId, socketRef.current.id, streamRef.current);
      if (p) {
        peersRef.current.push({ peerID: socketId, peer: p, userInfo });
        alreadyJoinedPeers.current.add(socketId);
        setPeers([...peersRef.current]);
      }
    };

    const handleSignal = ({ from, signal }) => {
      const item = peersRef.current.find((p) => p.peerID === from);
      if (item) item.peer.signal(signal);
      // if no peer exists for that id we do nothing — host/new-userApproved flow creates the peer objects first
    };

    const handleUserDisconnected = (userId) => {
      const item = peersRef.current.find((p) => p.peerID === userId);
      if (item) {
        try { item.peer.destroy(); } catch (e) {}
      }
      peersRef.current = peersRef.current.filter((p) => p.peerID !== userId);
      alreadyJoinedPeers.current.delete(userId);
      setPeers([...peersRef.current]);
    };

    socketRef.current.on("waiting-user", handleWaitingUser);

    // only attach these when socket exists; handlers themselves wait for stream where required
    socketRef.current.on("approved-to-join", handleApprovedToJoin);
    socketRef.current.on("existing-peers", handleExistingPeers);
    socketRef.current.on("new-user-approved", handleNewUserApproved);
    socketRef.current.on("signal", handleSignal);
    socketRef.current.on("user-disconnected", handleUserDisconnected);

    return () => {
      if (!socketRef.current) return;
      socketRef.current.off("waiting-user", handleWaitingUser);
      socketRef.current.off("approved-to-join", handleApprovedToJoin);
      socketRef.current.off("existing-peers", handleExistingPeers);
      socketRef.current.off("new-user-approved", handleNewUserApproved);
      socketRef.current.off("signal", handleSignal);
      socketRef.current.off("user-disconnected", handleUserDisconnected);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------- FLOW FUNCTIONS -------------------
  const hostFlow = async () => {
    await initMediaStream();
    setJoined(true);
    socketRef.current.emit("join-room-request", { roomId, userInfo });
  };

  const joinerFlow = () => {
    // Joiner can emit join request immediately; when approved we'll initialize media & peers
    socketRef.current.emit("join-room-request", { roomId, userInfo });
  };

  // Robust media init (video -> audio fallback) and ensure video plays
  const initMediaStream = async () => {
    try {
      console.log("🎥 Trying to access camera and mic...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
        // calling play may be required in some browsers
        userVideo.current.play().catch(() => {});
      }
      console.log("✅ Video+Audio stream ready");
    } catch (err) {
      console.warn("⚠️ Camera not available, trying audio only:", err);
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = audioOnlyStream;
        if (userVideo.current) {
          userVideo.current.srcObject = audioOnlyStream;
          userVideo.current.play().catch(() => {});
        }
        alert("Video not available. Joining with audio only.");
        console.log("✅ Audio-only stream ready");
      } catch (err2) {
        console.error("❌ Cannot access camera/mic:", err2);
        alert("Cannot access camera/microphone. Check permissions and devices.");
      }
    }
  };


  async function waitForStreamReady() {
    if (streamRef.current) return streamRef.current;
    try {
      await initMediaStream();
      return streamRef.current;
    } catch (err) {
      console.error("Failed to get media stream", err);
      return null;
    }
  }


  const setupPeersAfterApproval = async (approvedUsers) => {
    if (!approvedUsers || !Array.isArray(approvedUsers)) return;
    
    const s = await waitForStreamReady();
    if (!s) {
      console.warn("No media stream available after approval");
      return;
    }

    for (const user of approvedUsers) {
      if (user.socketId === socketRef.current.id) continue;
      if (alreadyJoinedPeers.current.has(user.socketId)) continue;

      const peer = await addPeer(null, user.socketId, s);
      if (peer) {
        peersRef.current.push({ peerID: user.socketId, peer, userInfo: user.userInfo });
        alreadyJoinedPeers.current.add(user.socketId);
        setPeers([...peersRef.current]);
      }
    }

    
    socketRef.current.emit("new-user-joined", { roomId, userInfo });
  };

  const approveUser = (socketId) => {
    socketRef.current.emit("approve-user", { roomId, socketIdToApprove: socketId });
    setWaitingUsers((prev) => prev.filter((u) => u.socketId !== socketId));
  };

  async function createPeer(userToSignal, callerID, stream) {
    let s = stream;
    if (!s) s = await waitForStreamReady();
    if (!s) {
      console.warn("createPeer: no stream available");
      return null;
    }

    const peer = new Peer({ initiator: true, trickle: false, stream: s });

    peer.on("signal", (signal) => {
      socketRef.current.emit("signal", { to: userToSignal, from: callerID, signal });
    });

    peer.on("error", (err) => {
      console.warn("Peer (initiator) error:", err);
    });

    return peer;
  }

  async function addPeer(incomingSignal, callerID, stream) {
    let s = stream;
    if (!s) s = await waitForStreamReady();
    if (!s) {
      console.warn("addPeer: no stream available");
      return null;
    }

    const peer = new Peer({ initiator: false, trickle: false, stream: s });

    peer.on("signal", (signal) => {
      socketRef.current.emit("signal", { to: callerID, from: socketRef.current.id, signal });
    });

    if (incomingSignal) {
      try {
        peer.signal(incomingSignal);
      } catch (err) {
        console.warn("Error while signaling incomingSignal:", err);
      }
    }

    peer.on("error", (err) => {
      console.warn("Peer (receiver) error:", err);
    });

    return peer;
  }

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      if (audioTracks && audioTracks[0]) {
        audioTracks[0].enabled = !micOn;
        setMicOn(!micOn);
      }
    }
  };

  const toggleCam = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      if (videoTracks && videoTracks[0]) {
        videoTracks[0].enabled = !camOn;
        setCamOn(!camOn);
      }
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
            userVideo={userVideo}
          />
        )}

        {peers.map((peerData) => (
          <PeerBox key={peerData.peerID} peerData={peerData} />
        ))}
      </div>
    </div>
  );
}


function VideoBox({ stream, micOn, camOn, toggleMic, toggleCam, name, userVideo }) {
  const ref = userVideo || useRef();
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
    if (!peer) return;
    peer.on("stream", (stream) => {
      if (ref.current) ref.current.srcObject = stream;
    });
    
    return () => {
      try { peer.removeAllListeners && peer.removeAllListeners("stream"); } catch (e) {}
    };
  }, [peer]);

  const toggleMic = () => {
    if (ref.current && ref.current.srcObject) {
      const track = ref.current.srcObject.getAudioTracks()[0];
      if (track) {
        track.enabled = !micOn;
        setMicOn(!micOn);
      }
    }
  };

  const toggleCam = () => {
    if (ref.current && ref.current.srcObject) {
      const track = ref.current.srcObject.getVideoTracks()[0];
      if (track) {
        track.enabled = !camOn;
        setCamOn(!camOn);
      }
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
        {formatName(userInfo?.name || userInfo?.email)}
      </div>
    </div>
  );
}
