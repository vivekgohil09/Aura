import React, { useEffect, useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import SideBar from "../components/SideBar";
import MyChat from "../components/MyChat";
import ChatBox from "../components/ChatBox";
import { Box, Modal, ModalOverlay, ModalContent, ModalBody, Avatar, Text, Flex, Button } from "@chakra-ui/react";
import { useSelector, useDispatch } from "react-redux";
import { setUserDetails } from "../redux/actions";
import { useDisclosure } from '@chakra-ui/hooks';
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { Portal } from "@chakra-ui/react";

const ENDPOINT = window.location.protocol + "//" + window.location.hostname + ":9092";
let globalSocket = null;

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
    if (!userInfo) return;

    if (!globalSocket) {
      globalSocket = io(ENDPOINT, { transports: ["websocket", "polling"] });
      globalSocket.emit("setup", userInfo);
      globalSocket.on("connected", () => console.log("Global socket connected"));
      globalSocket.on("connect_error", err => console.error("Socket error:", err.message));
    }

    // Incoming call — always listen globally
    globalSocket.off("call-user").on("call-user", (data) => {
      setIncomingCall(data);
    });

    return () => {
      globalSocket?.off("call-user");
    };
  }, []);

  // ── Expose globalSocket so SingleChat can reuse it ─────────────────────────
  useEffect(() => {
    window.__auraSocket = globalSocket;
  }, [globalSocket]);

  const acceptCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      if (globalSocket && incomingCall?.chatId) {
        globalSocket.emit("accept-call", { chatId: incomingCall.chatId });
      }
      setIncomingCall(null);
    } catch {
      alert("Camera/Microphone permission required to accept call.");
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
      height: "100vh",
      maxHeight: "100vh",
      overflow: "hidden",
      background: "#FAFAF9",
      color: "#18181B",
      display: "flex",
      flexDirection: "column"
    }}>
      {(user || localStorage.getItem("userInfo")) && <SideBar onOpenDrawer={onOpenDrawer} />}

      <Box
        d="flex" 
        justifyContent="space-between" 
        w="100%" 
        h="calc(100vh - 64px)"
        p={{ base: "8px", sm: "12px", md: "16px" }}
        gap={{ base: "8px", sm: "12px", md: "16px" }}
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
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(18px)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <MotionBox
                initial={{ scale: 0.7, opacity: 0, y: 60 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.7, opacity: 0, y: 60 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                style={{
                  background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                  borderRadius: "28px",
                  padding: "48px 40px 40px",
                  width: "340px",
                  textAlign: "center",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 0 60px rgba(220,20,60,0.4), 0 30px 80px rgba(0,0,0,0.8)"
                }}
              >
                {/* Pulsing rings */}
                <div style={{ position: "relative", width: 110, height: 110, margin: "0 auto 24px" }}>
                  {[1, 2, 3].map(i => (
                    <motion.div key={i}
                      animate={{ scale: [1, 1.8 + i * 0.3], opacity: [0.5, 0] }}
                      transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3 }}
                      style={{
                        position: "absolute", inset: 0,
                        borderRadius: "50%",
                        border: "2px solid rgba(220,20,60,0.6)",
                        margin: "auto"
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
                        border: "4px solid #DC143C",
                        boxShadow: "0 0 30px rgba(220,20,60,0.8)"
                      }}
                    />
                  </motion.div>
                </div>

                <Text style={{ color: "#fff", fontSize: "22px", fontWeight: 700, marginBottom: "6px" }}>
                  {incomingCall?.fromUser || "Someone"}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", marginBottom: "36px" }}>
                  {incomingCall?.callType === "voice" ? "📞 Incoming Voice Call..." : "📹 Incoming Video Call..."}
                </Text>

                <Flex gap={4} justify="center">
                  <motion.button
                    whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                    onClick={declineCall}
                    style={{
                      width: 64, height: 64, borderRadius: "50%",
                      background: "linear-gradient(135deg, #dc2626, #991b1b)",
                      border: "none", cursor: "pointer", fontSize: "26px",
                      boxShadow: "0 4px 20px rgba(220,38,38,0.5)"
                    }}
                  >📵</motion.button>

                  <motion.button
                    whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                    onClick={acceptCall}
                    style={{
                      width: 64, height: 64, borderRadius: "50%",
                      background: "linear-gradient(135deg, #16a34a, #15803d)",
                      border: "none", cursor: "pointer", fontSize: "26px",
                      boxShadow: "0 4px 20px rgba(22,163,74,0.5)"
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