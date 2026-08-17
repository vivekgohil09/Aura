import { autoPermissions } from '../config/autoPermissions';
import React, { useEffect, useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import SideBar from "../components/SideBar";
import { getJwtToken } from "../config/getJwt";
import MyChat from "../components/MyChat";
import ChatBox from "../components/ChatBox";
import { Box, Modal, ModalOverlay, ModalContent, ModalBody, Avatar, Text, Flex, Button } from "@chakra-ui/react";
import { useSelector, useDispatch } from "react-redux";
import { setUserDetails, setNotification, updateUserStatus, setSelectedChat, setChats } from "../redux/actions";
import axios from 'axios';
import { useDisclosure } from '@chakra-ui/hooks';
import { stompService } from "../config/stompService2";
import { motion, AnimatePresence } from "framer-motion";
import { Portal } from "@chakra-ui/react";

// STOMP will be used instead of socket.io. Keep a shim for legacy checks.
let globalSocket = null;

// ── Living Conversations Ambient VFX Background (ChatPage) ──
function AmbientVFXBackground() {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        background: 'var(--aura-ivory, #FCFBF7)'
      }}
    >
      {/* Top Left Aura Indigo Ambient Glow */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.35, 0.55, 0.35],
          x: [0, 20, 0],
          y: [0, -15, 0]
        }}
        transition={{ repeat: Infinity, duration: 9, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '-120px',
          left: '-80px',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(91, 95, 239, 0.12) 0%, rgba(128, 103, 232, 0.04) 55%, transparent 75%)',
          filter: 'blur(50px)'
        }}
      />
      {/* Bottom Right Violet Soft Radial */}
      <motion.div
        animate={{
          scale: [1, 1.18, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, -25, 0],
          y: [0, 20, 0]
        }}
        transition={{ repeat: Infinity, duration: 11, ease: 'easeInOut', delay: 1 }}
        style={{
          position: 'absolute',
          bottom: '-140px',
          right: '-100px',
          width: '580px',
          height: '580px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(109, 140, 255, 0.1) 0%, rgba(91, 95, 239, 0.03) 60%, transparent 80%)',
          filter: 'blur(60px)'
        }}
      />
    </Box>
  );
}

const MotionBox = motion(Box);

const ChatPage = () => {
  const [fetchAgain, setFetchAgain] = useState(false);
  const user = useSelector(state => state.user);
  const selectedChat = useSelector(state => state.selectedChats);
  const history = useHistory();
  const { isOpen: isDrawerOpen, onOpen: onOpenDrawer, onClose: onCloseDrawer } = useDisclosure();
  const dispatch = useDispatch();
  const [incomingCall, setIncomingCall] = useState(null);
  const localVideoRef = useRef(null);

  // ── Initialize global socket and call listeners on page mount ─────────────
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    const jwtToken = localStorage.getItem("jwt") || getJwtToken();
    if (!userInfo) return;

    if (!globalSocket) {
      // Connect STOMP service and provide a lightweight shim at window.__auraSocket for legacy emits/listeners.
      stompService.connect(() => console.log('STOMP connected'), (err) => console.error('STOMP connect error', err));
      // Shim: provide minimal API used elsewhere. Emits will be no-ops for events handled via REST or STOMP subscriptions.
      // Minimal shim to satisfy existing socket.io usage patterns in the UI.
      const shim = {};
      shim.emit = (event, payload) => {
        try {
          if (event === 'leave-app') {
            stompService.disconnect();
          }
          // No-op for other legacy emits; REST or STOMP topics should handle actual actions.
        } catch (e) { }
        return shim;
      };

      // on/off are chainable in socket.io; preserve that by returning shim.
      shim._stompSubs = new Map();
      shim.on = (event, cb) => {
        try {
          if (event === 'connected') {
            // Hook into STOMP connect status
            stompService.addConnectionListener((connected) => {
              if (connected) cb();
            });
            // If already connected, call immediately
            if (stompService.isConnected()) cb();
            return shim;
          }

          // Legacy global call events: subscribe to a global STOMP announcement topic
          if (event === 'call-user' || event === 'end-call' || event === 'accept-call' || event === 'call-accepted') {
            // Avoid duplicate subscription
            if (shim._stompSubs.has(event)) return shim;
            const unsub = stompService.subscribeToTopic('/topic/call-global', (msg) => {
              try {
                // STOMP message may be the CallSignalDto or a wrapped object
                const data = msg && msg.body ? msg.body : msg;
                // If the message type matches the event or is a general call offer, invoke callback
                if (data && (data.type === event || (event === 'call-user' && data.type === 'call-user') || event === 'end-call' && data.type === 'end-call')) {
                  cb(data);
                } else if (data && !data.type && event === 'call-user') {
                  // fallback: many callers expect raw payload
                  cb(data);
                }
              } catch (e) {
                console.error('call-global handler error', e);
              }
            });
            shim._stompSubs.set(event, unsub);
            return shim;
          }

          // Other events (chat-request-*) are left as no-ops — add as needed
        } catch (e) { console.error(e); }
        return shim;
      };

      shim.off = (event) => {
        try {
          const unsub = shim._stompSubs.get(event);
          if (unsub) {
            try { unsub(); } catch (e) {}
            shim._stompSubs.delete(event);
          }
        } catch (e) { }
        return shim;
      };

      // Mark this object so components can prefer STOMP subscriptions
      shim.__isStompShim = true;

      globalSocket = shim;
      window.__auraSocket = globalSocket;
      // Expose stompService for components that prefer direct STOMP helpers
      window.stompService = stompService;
    } else {
      window.__auraSocket = globalSocket;
      window.stompService = stompService;
    }

    // Load stored pending chat requests into Redux on mount
    try {
      const myId = userInfo._id || userInfo.id;
      const storageKey = myId ? `aura_received_requests_${myId}` : "aura_received_requests";
      const storedNotifs = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (storedNotifs && storedNotifs.length > 0) {
        dispatch(setNotification(storedNotifs));
      }
    } catch (e) {}

    // Incoming call & chat requests — always listen globally
    globalSocket.off("call-user").on("call-user", async (data) => {
      const myId = userInfo._id || userInfo.id;
      if (data) {
        if (data.fromUserId && String(data.fromUserId) === String(myId)) {
          return; // Ignore calls initiated by self
        }
        if (data.targetUserId && String(data.targetUserId) !== String(myId)) {
          return; // Ignore calls targeted for someone else
        }

        // Auto-open the chat so callee sees full calling screen immediately
        try {
          const chatId = data.chatId || data.chat?.id || data.chat?._id;
          if (chatId) {
            const chatsList = window.__auraChats || [];
            let chatToOpen = chatsList.find(c => String(c._id || c.id) === String(chatId));
            if (!chatToOpen) {
              // fetch chat from backend
              try {
                const config = { headers: { Authorization: "Bearer " + getJwtToken() } };
                const { data: fetched } = await axios.get(`/api/chat/${chatId}`, config);
                if (fetched) {
                  chatToOpen = fetched;
                  const existing = window.__auraChats || [];
                  window.__auraChats = [fetched, ...existing.filter(c => String(c._id || c.id) !== String(fetched._id || fetched.id))];
                  dispatch(setChats(window.__auraChats));
                }
              } catch (e) {
                // ignore fetch errors — still show incoming call modal
              }
            }

            if (chatToOpen) {
              dispatch(setSelectedChat(chatToOpen));
            }
          }
        } catch (e) {}

        setIncomingCall(data);
      }
    });

    globalSocket.off("end-call").on("end-call", () => {
      setIncomingCall(null);
    });

    globalSocket.off("chat-request-received").on("chat-request-received", (data) => {
      if (data && data.sender) {
        const targetUserId = data.targetUserId;
        const myId = userInfo._id || userInfo.id;
        if (targetUserId && myId && String(targetUserId) !== String(myId)) {
          return; // Ignore requests meant for other users
        }

        const senderId = data.sender._id || data.sender.id;
        const notifItem = {
          _id: "req_" + senderId,
          isChatRequest: true,
          senderId: senderId,
          senderName: data.sender.name || "User",
          senderUsername: data.sender.username || data.sender.name,
          senderPic: data.sender.pic || ""
        };

        // Load stored requests from local storage
        try {
          const storageKey = myId ? `aura_received_requests_${myId}` : "aura_received_requests";
          const storedNotifs = JSON.parse(localStorage.getItem(storageKey) || "[]");
          if (storedNotifs && storedNotifs.length > 0) {
            dispatch(setNotification(storedNotifs));
          }
        } catch (e) {}

        try {
          const storageKey = myId ? `aura_received_requests_${myId}` : "aura_received_requests";
          const storedNotifs = JSON.parse(localStorage.getItem(storageKey) || "[]");
          if (!storedNotifs.some(n => String(n.senderId) === String(senderId))) {
            localStorage.setItem(storageKey, JSON.stringify([notifItem, ...storedNotifs]));
          }
        } catch (e) {}

        dispatch(setNotification([notifItem, ...(window.__auraNotifs || [])]));

        toast.info(`📩 New Chat Request from @${notifItem.senderUsername || notifItem.senderName}!`, {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: true
        });
      }
    });

    globalSocket.off("chat-request-accepted-received").on("chat-request-accepted-received", (data) => {
      if (data && data.chat) {
        const senderId = data.senderId;
        const myId = userInfo._id || userInfo.id;
        if (senderId && myId && String(senderId) !== String(myId)) {
          return; // Ignore acceptances meant for other senders
        }

        const fullChat = data.chat;
        const chatsList = window.__auraChats || [];
        const fullChatId = fullChat._id || fullChat.id;
        if (!chatsList.some(c => (c._id || c.id) === fullChatId)) {
          dispatch(setChats([fullChat, ...chatsList]));
        }
      }
    });

    // Subscribe to presence topic (STOMP)
    let unsubPresence = null;
    try {
      unsubPresence = stompService.subscribeToTopic('/topic/presence', (data) => {
        try {
          if (data && data.userId) {
            dispatch(updateUserStatus(data.userId, Boolean(data.isOnline), data.lastSeen));
          }
        } catch (e) {}
      });
    } catch (e) {}

    return () => {
      globalSocket?.off("call-user");
      globalSocket?.off("end-call");
      globalSocket?.off("chat-request-received");
      globalSocket?.off("chat-request-accepted-received");
      try { if (unsubPresence) unsubPresence(); } catch (e) {}
    };
  }, [dispatch]);

  // Play audio ringtone when an incoming call is active
  useEffect(() => {
    let stopRinging = null;
    if (incomingCall) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const playRingTone = () => {
          if (audioCtx.state === "suspended") {
            audioCtx.resume();
          }
          const osc1 = audioCtx.createOscillator();
          const osc2 = audioCtx.createOscillator();
          const gain = audioCtx.createGain();

          osc1.type = "sine";
          osc2.type = "sine";
          osc1.frequency.setValueAtTime(440, audioCtx.currentTime);
          osc2.frequency.setValueAtTime(480, audioCtx.currentTime);

          gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(audioCtx.destination);

          osc1.start();
          osc2.start();
          osc1.stop(audioCtx.currentTime + 1.2);
          osc2.stop(audioCtx.currentTime + 1.2);
        };
        playRingTone();
        const interval = setInterval(playRingTone, 2000);
        stopRinging = () => {
          clearInterval(interval);
          try { audioCtx.close(); } catch(e) {}
        };
      } catch (e) {}
    }
    return () => {
      if (stopRinging) stopRinging();
    };
  }, [incomingCall]);

  const notification = useSelector(state => state.notification) || [];
  const chatsList = useSelector(state => state.chats) || [];

  useEffect(() => {
    window.__auraNotifs = notification;
  }, [notification]);

  useEffect(() => {
    const fetchPendingNotifications = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
        const myId = userInfo._id || userInfo.id;
        const storageKey = myId ? `aura_received_requests_${myId}` : "aura_received_requests";
        const storedLocal = JSON.parse(localStorage.getItem(storageKey) || "[]");

        // Option A: Fetch from Backend Database
        let dbNotifs = [];
        try {
          const config = { headers: { Authorization: "Bearer " + getJwtToken() } };
          const { data } = await axios.get("/api/chat/requests/pending", config);
          if (Array.isArray(data)) {
            dbNotifs = data.map(req => ({
              senderId: req.sender.id || req.sender._id,
              senderName: req.sender.name,
              senderPic: req.sender.pic,
              senderUsername: req.sender.username,
              requestId: req.id,
              isRequest: true,
              timestamp: req.createdAt
            }));
          }
        } catch (dbErr) {}

        // Combine DB pending requests with Option B LocalSync fallback
        const combined = [...dbNotifs];
        storedLocal.forEach(localNotif => {
          if (!combined.some(c => String(c.senderId) === String(localNotif.senderId))) {
            combined.push(localNotif);
          }
        });

        if (combined.length > 0) {
          const existingNotifs = window.__auraNotifs || [];
          const merged = [...combined, ...existingNotifs.filter(n => !combined.some(s => s.senderId === n.senderId))];
          dispatch(setNotification(merged));
        }
      } catch (e) {}
    };

    fetchPendingNotifications();
  }, [dispatch]);

  const chats = useSelector(state => state.chats) || [];

  // ── Expose globalSocket & notifications & chats so components can reuse ───────
  useEffect(() => {
    window.__auraSocket = globalSocket;
    window.__auraNotifs = notification;
    window.__auraChats = chats;
  }, [globalSocket, notification, chats]);

  const acceptCall = async () => {
    if (incomingCall?.chatId) {
      const chatToOpen = chats.find(c => String(c._id || c.id) === String(incomingCall.chatId));
      if (chatToOpen) {
        dispatch(setSelectedChat(chatToOpen));
      } else {
        // If the chat isn't in the local list yet, fetch it immediately so conversation opens without delay
        try {
          const config = { headers: { Authorization: "Bearer " + getJwtToken() } };
          const { data } = await axios.get(`/api/chat/${incomingCall.chatId}`, config);
          if (data) {
            // add to global list and open it
            const existing = window.__auraChats || [];
            window.__auraChats = [data, ...existing.filter(c => String(c._id || c.id) !== String(data._id || data.id))];
            dispatch(setChats(window.__auraChats));
            dispatch(setSelectedChat(data));
          }
        } catch (e) {
          console.error('Failed to fetch chat on accept:', e?.message || e);
        }
      }
      // Mark call to accept in the chat component
      window.__auraCallToAccept = incomingCall;
      setIncomingCall(null);
    }
  };

  const declineCall = () => {
    if (globalSocket && incomingCall?.chatId) {
      globalSocket.emit("end-call", { chatId: incomingCall.chatId });
    }
    setIncomingCall(null);
  };

  useEffect(() => {
    document.title = "Aura | Home";
    const usersData = JSON.parse(localStorage.getItem("userInfo"));
    if (!usersData) {
      history.push("/login");
    } else if (!user) {
      dispatch(setUserDetails(usersData));
    }
  }, [user, history, dispatch]);

  return (
    <div className="chat-layout" style={{
      width: "100%",
      height: "100dvh",
      maxHeight: "100dvh",
      overflow: "hidden",
      background: "#F8FAFC",
      color: "#0F172A",
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      inset: 0
    }}>
      <AmbientVFXBackground />
      {(user || localStorage.getItem("userInfo")) && (
        <Box display={{ base: selectedChat ? "none" : "block", md: "block" }}>
          <SideBar onOpenDrawer={onOpenDrawer} />
        </Box>
      )}

      <Box
        d="flex" 
        justifyContent="space-between" 
        w="100%" 
        flex="1"
        h="0"
        minH="0"
        p={{ base: "0px", sm: "6px", md: "16px" }}
        gap={{ base: "0px", sm: "6px", md: "16px" }}
        overflow="hidden"
        style={{ boxSizing: "border-box" }}
      >
        {(user || localStorage.getItem("userInfo")) && <MyChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} onOpenDrawer={onOpenDrawer} />}
        {(user || localStorage.getItem("userInfo")) && <ChatBox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} onOpenDrawer={onOpenDrawer} />}
      </Box>

      {/* ── Ultra-Luxury Global Incoming Call Space ──── */}
      <AnimatePresence>
        {incomingCall && (
          <Portal>
            <div style={{
              position: "fixed",
              inset: 0,
              zIndex: 99999,
              background: "rgba(10, 11, 20, 0.78)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px"
            }}>
              <MotionBox
                initial={{ scale: 0.85, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 40 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                style={{
                  background: "linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, #F8FAFC 100%)",
                  borderRadius: "32px",
                  padding: "40px 32px 32px",
                  width: "100%",
                  maxWidth: "420px",
                  textAlign: "center",
                  border: "1.5px solid rgba(91, 95, 239, 0.25)",
                  boxShadow: "0 25px 80px rgba(0, 0, 0, 0.35), 0 0 40px rgba(91, 95, 239, 0.15)",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                {/* Top Telemetry Beacon */}
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  borderRadius: "99px",
                  padding: "4px 12px",
                  marginBottom: "24px"
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981" }} />
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#059669", letterSpacing: "0.04em" }}>
                    256-BIT VAULT SECURE STREAM
                  </span>
                </div>

                {/* Pulsing Aura Rings */}
                <div style={{ position: "relative", width: 130, height: 130, margin: "0 auto 24px" }}>
                  {[1, 2, 3].map(i => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.5 + i * 0.25], opacity: [0.5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.35 }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "50%",
                        border: "2px solid rgba(91, 95, 239, 0.35)",
                        margin: "auto"
                      }}
                    />
                  ))}
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    style={{ position: "relative", zIndex: 2 }}
                  >
                    <Avatar
                      size="2xl"
                      name={incomingCall?.fromUser || "User"}
                      src={incomingCall?.fromAvatar || ""}
                      style={{
                        width: "120px",
                        height: "120px",
                        border: "4px solid #FFFFFF",
                        boxShadow: "0 12px 40px rgba(91, 95, 239, 0.3)"
                      }}
                    />
                  </motion.div>
                </div>

                <Text style={{
                  color: "#0F172A",
                  fontSize: "1.5rem",
                  fontWeight: 900,
                  marginBottom: "4px",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  letterSpacing: "-0.02em"
                }}>
                  {incomingCall?.fromUser || "Contact"}
                </Text>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  marginBottom: "32px"
                }}>
                  <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#5B5FEF" }}>
                    {incomingCall?.callType === "video" ? "📹 Incoming 4K Video Stream" : "📞 Incoming HD Voice Stream"}
                  </span>
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25 }}
                      style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#5B5FEF", display: "inline-block" }}
                    />
                  ))}
                </div>

                {/* Call Action Controls */}
                <Flex gap={5} justify="center" align="center">
                  {/* Decline Button */}
                  <motion.button
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={declineCall}
                    aria-label="Decline Call"
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                      border: "none",
                      color: "#FFFFFF",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 8px 24px rgba(239, 68, 68, 0.35)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </motion.button>

                  {/* Accept Button */}
                  <motion.button
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={acceptCall}
                    aria-label="Accept Call"
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                      border: "none",
                      color: "#FFFFFF",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 10px 30px rgba(16, 185, 129, 0.4)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </motion.button>
                </Flex>
              </MotionBox>
            </div>
          </Portal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPage;