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
import { stompService } from "../config/stompService.clean";
import { motion, AnimatePresence } from "framer-motion";
import { Portal } from "@chakra-ui/react";

// STOMP will be used instead of socket.io. Keep a shim for legacy checks.
let globalSocket = null;

// ── Modern Minimal White Luxury Ambient VFX Background Component (ChatPage) ──
function AmbientVFXBackground() {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        background: '#F8FAFC'
      }}
    >
      {/* Top Left Golden Ambient Glow */}
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
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.18) 0%, rgba(245, 158, 11, 0.05) 55%, transparent 75%)',
          filter: 'blur(50px)'
        }}
      />
      {/* Bottom Right Champagne Soft Radial */}
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
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(212, 175, 55, 0.04) 60%, transparent 80%)',
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
      shim.on = (event, cb) => {
        try {
          if (event === 'connected') {
            // Hook into STOMP connect status
            stompService.addConnectionListener((connected) => {
              if (connected) cb();
            });
            // If already connected, call immediately
            if (stompService.isConnected()) cb();
          }
          // Other events (call-user, end-call, chat-request-*) are not auto-shimmed here.
        } catch (e) {}
        return shim;
      };

      shim.off = (event) => {
        // No-op but chainable
        return shim;
      };

      globalSocket = shim;
      window.__auraSocket = globalSocket;
    } else {
      window.__auraSocket = globalSocket;
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
    globalSocket.off("call-user").on("call-user", (data) => {
      const myId = userInfo._id || userInfo.id;
      if (data) {
        if (data.fromUserId && String(data.fromUserId) === String(myId)) {
          return; // Ignore calls initiated by self
        }
        if (data.targetUserId && String(data.targetUserId) !== String(myId)) {
          return; // Ignore calls targeted for someone else
        }
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

    return () => {
      globalSocket?.off("call-user");
      globalSocket?.off("end-call");
      globalSocket?.off("chat-request-received");
      globalSocket?.off("chat-request-accepted-received");
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
    <div style={{
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
      {(user || localStorage.getItem("userInfo")) && <SideBar onOpenDrawer={onOpenDrawer} />}

      <Box
        d="flex" 
        justifyContent="space-between" 
        w="100%" 
        flex="1"
        h="0"
        minH="0"
        p={{ base: "4px", sm: "10px", md: "16px" }}
        gap={{ base: "4px", sm: "10px", md: "16px" }}
        overflow="hidden"
        style={{ boxSizing: "border-box" }}
      >
        {(user || localStorage.getItem("userInfo")) && <MyChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} onOpenDrawer={onOpenDrawer} />}
        {(user || localStorage.getItem("userInfo")) && <ChatBox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} onOpenDrawer={onOpenDrawer} />}
      </Box>

      {/* ── Global Incoming Call Modal — shows even without any chat open ──── */}
      <AnimatePresence>
        {incomingCall && (
          <Portal>
            <div style={{
              position: "fixed", inset: 0, zIndex: 99999,
              background: "rgba(255,255,255,0.86)",
              backdropFilter: "blur(8px) saturate(120%)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <MotionBox
                initial={{ scale: 0.7, opacity: 0, y: 60 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.7, opacity: 0, y: 60 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                style={{
                  background: "linear-gradient(180deg, #FFFFFF 0%, #FBFBFD 100%)",
                  borderRadius: "20px",
                  padding: "36px 28px 28px",
                  width: "92%",
                  maxWidth: "420px",
                  textAlign: "center",
                  border: "1px solid rgba(15, 23, 42, 0.06)",
                  boxShadow: "0 12px 36px rgba(15,23,42,0.08)"
                }}
              >
                {/* Pulsing rings */}
                <div style={{ position: "relative", width: 110, height: 110, margin: "0 auto 24px" }}>
                  {[1, 2, 3].map(i => (
                    <motion.div key={i}
                  animate={{ scale: [1, 1.6 + i * 0.25], opacity: [0.45, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.28 }}
                      style={{
                        position: "absolute", inset: 0,
                        borderRadius: "50%",
                    border: "2px solid rgba(212,175,55,0.28)",
                    margin: "auto",
                    boxShadow: "0 8px 30px rgba(212,175,55,0.12)"
                  }}
                    />
                  ))}
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    style={{ position: "relative", zIndex: 1 }}
                  >
                    <Avatar
                      size="xl"
                      name={incomingCall?.fromUser || "User"}
                      src={incomingCall?.fromAvatar || ""}
                      style={{
                        border: "4px solid rgba(212,175,55,0.95)",
                        boxShadow: "0 8px 36px rgba(212,175,55,0.18)"
                      }}
                    />
                  </motion.div>
                </div>

                <Text style={{ color: "#0F172A", fontSize: "22px", fontWeight: 800, marginBottom: "6px" }}>
                  {incomingCall?.fromUser || "Someone"}
                </Text>
                <Text style={{ color: "#475569", fontSize: "15px", marginBottom: "24px" }}>
                  {incomingCall?.callType === "voice" ? "📞 Incoming Voice Call..." : "📹 Incoming Video Call..."}
                </Text>

                <Flex gap={4} justify="center">
                  <motion.button
                    whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                    onClick={declineCall}
                    style={{
                      width: 62, height: 62, borderRadius: "50%",
                      background: "#F4F4F5",
                      border: "1px solid rgba(15,23,42,0.06)",
                      color: "#374151",
                      cursor: "pointer",
                      fontSize: "22px",
                      boxShadow: "0 6px 18px rgba(2,6,23,0.06)"
                    }}
                  >✕</motion.button>

                  <motion.button
                    whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                    onClick={acceptCall}
                    style={{
                      width: 62, height: 62, borderRadius: "50%",
                      background: "linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)",
                      border: "none", cursor: "pointer", fontSize: "22px",
                      boxShadow: "0 8px 24px rgba(212,175,55,0.24)",
                      color: "#08121A"
                    }}
                  >📞</motion.button>
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