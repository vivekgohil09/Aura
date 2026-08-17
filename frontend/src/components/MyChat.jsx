import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory, Link } from 'react-router-dom';
import { getJwtToken, handleAuthError } from '../config/getJwt';
import { setChats, setSelectedChat, delSelectedChat, logout, setNotification } from '../redux/actions';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Box, Text, Stack } from "@chakra-ui/layout";
import { Button } from "@chakra-ui/button";
import ChatLoading from "./ChatLoading";
import { getSender, getPicture, getSenderUser } from '../config/ChatsLogic';
import { Avatar, Tooltip, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, FormControl, Input, Progress, Spinner, Menu, MenuButton, MenuList, MenuItem, MenuDivider, Badge, Portal } from '@chakra-ui/react';
import AddIcon from '@mui/icons-material/Add';
import { Search, MoreVertical, Trash2, Pin, VolumeX, Sparkles, Lock, ShieldCheck, Users, UserMinus } from 'lucide-react';
import UserListItem from './UserListItem';
import UserBadgeItem from './UserBadgeItem';
import axios from 'axios';
import { decompressData } from '../config/dataCompressor';

const DecryptedLatestMessage = ({ msg }) => {
  const [text, setText] = useState('...');
  
  useEffect(() => {
    let isMounted = true;
    if (!msg || !msg.content) {
      if (isMounted) setText('No messages yet');
      return;
    }
    let content = msg.content;
    if (content.startsWith('[view-once]')) {
      if (isMounted) setText('👁 View-once message');
      return;
    }
    if (content.startsWith('[call] ')) {
      const callText = content.replace('[call] ', '').toLowerCase();
      const isVideo = callText.includes('video');
      if (callText.includes('cancelled') || callText.includes('missed') || callText.includes('declined')) {
        if (isMounted) setText(isVideo ? '📵 Missed video call' : '📵 Missed call');
      } else if (callText.includes('ended')) {
        if (isMounted) setText(isVideo ? '🎥 Video call' : '📞 Voice call');
      } else {
        if (isMounted) setText(isVideo ? '🎥 Video call' : '📞 Voice call');
      }
      return;
    }
    if (content.startsWith('[gz]') || content.startsWith('[enc]')) {
      decompressData(content).then(res => {
        if (!isMounted) return;
        if (res.startsWith('[call] ')) {
          const callText = res.replace('[call] ', '').toLowerCase();
          const isVideo = callText.includes('video');
          if (callText.includes('cancelled') || callText.includes('missed') || callText.includes('declined')) {
            setText(isVideo ? '📵 Missed video call' : '📵 Missed call');
          } else if (callText.includes('ended')) {
            setText(isVideo ? '🎥 Video call' : '📞 Voice call');
          } else {
            setText(isVideo ? '🎥 Video call' : '📞 Voice call');
          }
        }
        else if (res.startsWith('data:image')) setText('📷 Photo');
        else if (res.startsWith('data:video') || res.includes('video/mp4') || res.includes('.mp4')) setText('🎥 Video');
        else if (res.startsWith('data:audio') || res.includes('audio/mp3') || res.includes('.mp3')) setText('🎙 Voice');
        else if (res.startsWith('data:application') || res.startsWith('data:text')) setText('📄 Document');
        else setText(res);
      }).catch(() => {
        if (isMounted) setText('🔒 Encrypted message');
      });
    } else {
      if (content.startsWith('data:video')) setText('🎥 Video message');
      else if (content.startsWith('data:image')) setText('📷 Photo message');
      else if (content.startsWith('data:audio')) setText('🎙 Voice message');
      else setText(content);
    }
    return () => { isMounted = false; };
  }, [msg]);

  return <>{text}</>;
};

const MyChat = ({ fetchAgain, setFetchAgain, onOpenDrawer }) => {
  const history = useHistory();
  const dispatch = useDispatch();

  const [loggedUser, setLoggedUser] = useState();
  const user = useSelector(state => state.user);
  const selectedChat = useSelector(state => state.selectedChats);
  const chats = useSelector(state => state.chats);
  const notification = useSelector(state => state.notification) || [];
  const userStatuses = useSelector(state => state.userStatuses) || {};
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [groupChatName, setGroupChatName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTwo, setLoadingTwo] = useState(false);

  const [navMode, setNavMode] = useState('chats'); // 'chats' | 'orbit' | 'memory'
  const [chatFilter, setChatFilter] = useState('all'); // 'all', 'friends', 'groups', 'unread'
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [pinnedChatIds, setPinnedChatIds] = useState([]);
  const [mutedChatIds, setMutedChatIds] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [deletedChatIds, setDeletedChatIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aura_deleted_chats") || "[]"); } catch { return []; }
  });

  const getFilteredChats = (chatList) => {
    return Array.isArray(chatList) ? chatList : [];
  };

  const handleDeleteChat = async (e, targetChat) => {
    e.stopPropagation();
    const targetId = String(targetChat.id || targetChat._id);

    let updatedDeleted = [];
    try {
      const stored = JSON.parse(localStorage.getItem("aura_deleted_chats") || "[]");
      updatedDeleted = Array.from(new Set([...stored, targetId]));
    } catch {
      updatedDeleted = [targetId];
    }
    localStorage.setItem("aura_deleted_chats", JSON.stringify(updatedDeleted));
    setDeletedChatIds(updatedDeleted);

    // Save clear timestamp so old messages are hidden
    try {
      const clearedChats = JSON.parse(localStorage.getItem("aura_cleared_chats") || "{}");
      clearedChats[targetId] = Date.now();
      localStorage.setItem("aura_cleared_chats", JSON.stringify(clearedChats));
    } catch (e) {
      localStorage.setItem("aura_cleared_chats", JSON.stringify({ [targetId]: Date.now() }));
    }

    // Do not remove from Redux so it stays in the 'Friends' tab
    // dispatch(setChats(updatedChats));

    const activeChatId = String(selectedChat?.id || selectedChat?._id);
    if (activeChatId === targetId) {
      dispatch(delSelectedChat());
    }

    try {
      if (targetChat.isGroupChat) {
        // Only delete group chats from backend (if you're admin) or just leave it locally deleted.
        // For 1-on-1 chats, we do NOT delete from backend, so they stay in 'Friends' list!
        const config = { headers: { Authorization: "Bearer " + getJwtToken() } };
        await axios.delete(`/api/chat/${targetId}`, config);
      }
    } catch (err) { }

    toast.success("Chat deleted!", {
      position: "top-right",
      autoClose: 3000,
      closeOnClick: true,
      theme: "colored"
    });
  };

  const handleUnfriend = async (e, targetChat) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(`Are you sure you want to unfriend ${getSender(user, targetChat.users)}?`)) return;

    const targetId = String(targetChat.id || targetChat._id);
    
    // Remove from Redux immediately so it disappears from Friends tab completely
    const updatedChats = (chats || []).filter(c => String(c.id || c._id) !== targetId);
    dispatch(setChats(updatedChats));

    const activeChatId = String(selectedChat?.id || selectedChat?._id);
    if (activeChatId === targetId) {
      dispatch(delSelectedChat());
    }

    try {
      const config = { headers: { Authorization: "Bearer " + getJwtToken() } };
      const otherUser = targetChat?.users?.find(u => String(u._id || u.id) !== String(user?._id || user?.id));
      if (otherUser && (otherUser._id || otherUser.id)) {
        try {
          await axios.delete(`/api/user/friends/${otherUser._id || otherUser.id}`, config);
        } catch (fErr) {}
      }
      await axios.delete(`/api/chat/${targetId}`, config);
      toast.success("Unfriended successfully", {
        position: "top-right",
        autoClose: 3000,
        closeOnClick: true,
        theme: "colored"
      });
    } catch (err) {
      toast.error("Failed to unfriend");
    }
  };

  const handleTogglePin = (e, chatId) => {
    e.stopPropagation();
    const idStr = String(chatId);
    const isPinned = pinnedChatIds.includes(idStr);
    if (isPinned) {
      setPinnedChatIds(pinnedChatIds.filter(id => id !== idStr));
      toast.info("Chat unpinned", { position: "top-right", autoClose: 3000, closeOnClick: true, theme: "colored" });
    } else {
      setPinnedChatIds([idStr, ...pinnedChatIds]);
      toast.success("📌 Chat pinned to top!", { position: "top-right", autoClose: 3000, closeOnClick: true, theme: "colored" });
    }
  };

  const handleToggleMute = (e, chatId) => {
    e.stopPropagation();
    const idStr = String(chatId);
    const isMuted = mutedChatIds.includes(idStr);
    if (isMuted) {
      setMutedChatIds(mutedChatIds.filter(id => id !== idStr));
      toast.info("Notifications unmuted", { position: "top-right", autoClose: 3000, closeOnClick: true, theme: "colored" });
    } else {
      setMutedChatIds([...mutedChatIds, idStr]);
      toast.info("🔕 Notifications muted", { position: "top-right", autoClose: 3000, closeOnClick: true, theme: "colored" });
    }
  };

  const fetchUnreadCounts = async (chatList) => {
    try {
      const ids = (chatList || []).map(c => c.id || c._id).filter(Boolean);
      if (ids.length === 0) return;
      const config = { headers: { Authorization: "Bearer " + getJwtToken() } };
      const { data } = await axios.get(`/api/message/unread-counts?chatIds=${ids.join(',')}`, config);
      setUnreadCounts(data || {});
    } catch (e) { }
  };

  useEffect(() => {
    const fetchChatsBackground = async () => {
      try {
        const config = {
          headers: {
            Authorization: "Bearer " + getJwtToken(),
          },
        };
        const { data } = await axios.get(`/api/chat`, config);
        dispatch(setChats(getFilteredChats(data)));

        // Fetch persistent unread counts from DB
        fetchUnreadCounts(data);

        // Polling Option A: Fetch Pending Chat Requests from DB
        try {
          const reqRes = await axios.get("/api/chat/requests/pending", config);
          if (Array.isArray(reqRes.data)) {
            const dbNotifs = reqRes.data.map(req => ({
              senderId: req.sender.id || req.sender._id,
              senderName: req.sender.name,
              senderPic: req.sender.pic,
              senderUsername: req.sender.username,
              requestId: req.id,
              isRequest: true,
              timestamp: req.createdAt
            }));

            const existingNotifs = window.__auraNotifs || [];
            const merged = [...dbNotifs];
            existingNotifs.forEach(n => {
              if (!merged.some(m => String(m.senderId) === String(n.senderId))) {
                merged.push(n);
              }
            });
            dispatch(setNotification(merged));
          }
        } catch (err) { }
      } catch (e) { }
    };

    setLoggedUser(JSON.parse(localStorage.getItem("userInfo") || "{}"));
    fetchChats();
    fetchChatsBackground();
    const interval = setInterval(() => {
      fetchChatsBackground();
    }, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [fetchAgain]);

  const [loadingGroupUsers, setLoadingGroupUsers] = useState(false);

  const fetchAllUsersForGroup = async (query = "") => {
    try {
      setLoadingGroupUsers(true);
      const config = {
        headers: {
          Authorization: "Bearer " + getJwtToken(),
        },
      };
      const { data } = await axios.get(`/api/user/all-users?search=${query}`, config);
      setLoadingGroupUsers(false);
      setSearchResult(data);
    } catch (error) {
      setLoadingGroupUsers(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAllUsersForGroup("");
    }
  }, [isOpen]);

  const handleSearch = async (query) => {
    setSearch(query);
    fetchAllUsersForGroup(query);
  };

  const accessChat = async (userId) => {
    try {
      setLoading(true);
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: "Bearer " + getJwtToken(),
        },
      };
      const { data } = await axios.post(`/api/chat`, { userId }, config);

      const dataChatId = data.id || data._id;
      const existingChats = chats || [];
      if (!existingChats.find((c) => String(c.id || c._id) === String(dataChatId))) {
        dispatch(setChats([data, ...existingChats.filter(c => String(c.id || c._id) !== String(dataChatId))]));
      }
      dispatch(setSelectedChat(data));
      setLoading(false);
      setSearch("");
      setSearchResult([]);
    } catch (error) {
      if (handleAuthError(error, history)) return;
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!groupChatName || !selectedUsers || selectedUsers.length === 0) {
      toast.error('Please fill all fields!', { position: "top-center", autoClose: 2000, hideProgressBar: true });
      return;
    }

    try {
      setLoadingTwo(true);
      const config = {
        headers: {
          Authorization: "Bearer " + getJwtToken(),
        },
      };
      const { data } = await axios.post(
        `/api/chat/group`,
        {
          name: groupChatName,
          users: selectedUsers.map((u) => u.id || u._id),
        },
        config
      );
      dispatch(setChats([data, ...(chats || [])]));
      onClose();
      toast.success('Group Chat created!', { position: "top-center", autoClose: 2000, hideProgressBar: true });
      setFetchAgain(!fetchAgain);
      setLoadingTwo(false);
    } catch (error) {
      if (handleAuthError(error, history)) return;
      setLoadingTwo(false);
    }
  };

  const handleDelete = (delUser) => {
    const delId = delUser.id || delUser._id;
    setSelectedUsers(selectedUsers.filter((sel) => (sel.id || sel._id) !== delId));
  };

  const handleGroup = (userToAdd) => {
    if (selectedUsers.some(u => (u.id || u._id) === (userToAdd.id || userToAdd._id))) {
      toast.error('User already added!', { position: "top-center", autoClose: 2000, hideProgressBar: true });
      return;
    }
    setSelectedUsers([...selectedUsers, userToAdd]);
  };

  const fetchChats = async () => {
    try {
      if (!chats || chats.length === 0) {
        setLoading(true);
      }
      const config = {
        headers: {
          Authorization: "Bearer " + getJwtToken(),
        },
      };

      const { data } = await axios.get(`/api/chat`, config);
      dispatch(setChats(getFilteredChats(data)));
      setLoading(false);
    } catch (error) {
      setLoading(false);
      if (handleAuthError(error, history)) return;
    }
  };

  const currentUserObj = user || loggedUser || {};

  return (
    <>
      {/* Create Group Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        {loadingTwo && <Progress size='xs' isIndeterminate colorScheme="purple" bg="rgba(91, 95, 239, 0.15)" style={{ height: "3px" }} />}
        <ModalOverlay style={{ backdropFilter: "blur(12px)", background: "rgba(23, 24, 39, 0.35)" }} />
        <ModalContent style={{
          background: "#FFFFFF",
          color: "#171827",
          borderRadius: "28px",
          border: "1px solid rgba(23, 24, 39, 0.08)",
          boxShadow: "0 25px 60px rgba(23, 24, 39, 0.12)"
        }}>
          <ModalHeader style={{ borderBottom: "1px solid rgba(23, 24, 39, 0.06)", padding: "20px 24px" }}>
            <Text fontWeight="900" fontSize="1.35rem" color="#171827" margin={0} fontFamily="'Plus Jakarta Sans', sans-serif">Create Group Chat</Text>
          </ModalHeader>
          <ModalCloseButton style={{ borderRadius: "50%", border: "1px solid rgba(23, 24, 39, 0.08)", top: "18px", right: "20px" }} />
          <ModalBody d="flex" flexDir="column" py={4} px={5}>
            <FormControl>
              <Input
                placeholder="Group Name (e.g. Design Team)"
                mb={3}
                value={groupChatName}
                onChange={(e) => setGroupChatName(e.target.value)}
                borderRadius="16px"
                bg="#FFFFFF"
                border="1.5px solid rgba(23, 24, 39, 0.08)"
                color="#171827"
                fontWeight="600"
                fontFamily="'Plus Jakarta Sans', sans-serif"
                _focus={{ borderColor: "#5B5FEF", boxShadow: "0 4px 14px rgba(91, 95, 239, 0.15)" }}
              />
            </FormControl>
            <FormControl>
              <Input
                placeholder="Add Users (e.g. Vicky, Ram)"
                mb={3}
                onChange={(e) => handleSearch(e.target.value)}
                borderRadius="16px"
                bg="#FFFFFF"
                border="1.5px solid rgba(23, 24, 39, 0.08)"
                color="#171827"
                fontWeight="600"
                fontFamily="'Plus Jakarta Sans', sans-serif"
                _focus={{ borderColor: "#5B5FEF", boxShadow: "0 4px 14px rgba(91, 95, 239, 0.15)" }}
              />
            </FormControl>
            <Box w="100%" d="flex" flexWrap="wrap" gap={1.5} mb={3}>
              {selectedUsers.map((u) => (
                <UserBadgeItem key={u.id || u._id} user={u} handleFunction={() => handleDelete(u)} />
              ))}
            </Box>
            {loadingGroupUsers ? <Spinner size="sm" color="#5B5FEF" /> : (
              searchResult?.slice(0, 4).map((u) => (
                <UserListItem key={u.id || u._id} user={u} handleFunction={() => handleGroup(u)} />
              ))
            )}
          </ModalBody>
          <ModalFooter style={{ borderTop: "1px solid rgba(23, 24, 39, 0.06)", padding: "16px 24px" }}>
            <Button
              style={{
                background: "linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "16px",
                padding: "12px 24px",
                fontWeight: 800,
                fontSize: "0.95rem",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                boxShadow: "0 8px 20px rgba(91, 95, 239, 0.25)",
                cursor: "pointer"
              }}
              onClick={handleSubmit}
              _hover={{ opacity: 0.92, transform: "translateY(-1px)" }}
            >
              Create Group
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── LEFT SIDEBAR PANEL ── */}
      <Box
        className="aura-chat-panel aura-chat-list-panel"
        d={{ base: selectedChat ? "none" : "flex", md: "flex" }}
        flexDir="column"
        bg="rgba(255, 255, 255, 0.95)"
        w={{ base: "100%", md: "32%" }}
        h="100%"
        borderRadius={{ base: "0px", md: "24px" }}
        style={{
          border: "1px solid rgba(23, 24, 39, 0.08)",
          boxShadow: "0 10px 40px rgba(23, 24, 39, 0.04), 0 0 20px rgba(91, 95, 239, 0.04)",
          backdropFilter: "blur(24px)"
        }}
        position="relative"
        overflow="hidden"
        zIndex={1}
      >
        {/* 1. Conversations Header & In-List Search & Filter Tabs */}
        <Box
          className="aura-chat-list-header"
          px={{ base: 3, md: 4 }}
          pt={{ base: 3, md: 3.5 }}
          pb={2.5}
          d="flex"
          flexDir="column"
          gap={2.5}
          flexShrink={0}
          position="sticky"
          top={0}
          zIndex={10}
          bg="rgba(255, 255, 255, 0.98)"
          style={{
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(23, 24, 39, 0.06)"
          }}
        >
          {/* Signature Living Tri-Modal Navigation */}
          <Box d="flex" alignItems="center" bg="#F4F3EF" p="3px" borderRadius="14px" gap="4px">
            {[
              { id: 'chats', label: 'CHATS', icon: '💬' },
              { id: 'orbit', label: 'ORBIT', icon: '🪐' },
              { id: 'memory', label: 'MEMORY', icon: '🧠' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setNavMode(tab.id)}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  borderRadius: '11px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  letterSpacing: '0.04em',
                  border: 'none',
                  background: navMode === tab.id ? '#FFFFFF' : 'transparent',
                  color: navMode === tab.id ? '#5B5FEF' : '#727486',
                  boxShadow: navMode === tab.id ? '0 2px 8px rgba(23, 24, 39, 0.06)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  transition: 'all 0.18s ease'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </Box>

          {/* Top Row: Title, Total Count & Group Action */}
          <Box d="flex" alignItems="center" justifyContent="space-between" gap={2}>
            <Box d="flex" alignItems="center" gap={2}>
              <Text fontWeight="900" fontSize={{ base: "1.12rem", sm: "1.2rem" }} color="#171827" margin={0} letterSpacing="-0.03em" fontFamily="'Plus Jakarta Sans', sans-serif">
                {navMode === 'orbit' ? 'Living Orbit' : navMode === 'memory' ? 'Memory Vault' : 'Conversations'}
              </Text>
              {chats && chats.length > 0 && navMode === 'chats' && (
                <Badge
                  bg="rgba(91, 95, 239, 0.12)"
                  color="#5B5FEF"
                  borderRadius="99px"
                  px={2}
                  py={0.5}
                  fontSize="0.7rem"
                  fontWeight="800"
                  fontFamily="'Plus Jakarta Sans', sans-serif"
                >
                  {chats.length}
                </Badge>
              )}
            </Box>
            
            <Box d="flex" alignItems="center" gap={1.5}>
              <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={onOpen}
                  size="sm"
                  leftIcon={<AddIcon style={{ fontSize: "13px", color: "#5B5FEF" }} />}
                  style={{
                    background: "rgba(91, 95, 239, 0.08)",
                    color: "#5B5FEF",
                    borderRadius: "99px",
                    padding: "0 11px",
                    height: "30px",
                    fontWeight: 800,
                    fontSize: "0.75rem",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    letterSpacing: "0.01em",
                    border: "1px solid rgba(91, 95, 239, 0.25)",
                    boxShadow: "0 2px 8px rgba(91, 95, 239, 0.08)",
                    WebkitTapHighlightColor: "transparent",
                    transition: "all 0.2s ease"
                  }}
                  _hover={{
                    background: "rgba(91, 95, 239, 0.16)",
                    borderColor: "#5B5FEF"
                  }}
                >
                  Group
                </Button>
              </motion.div>
            </Box>
          </Box>

          {/* Search inside Conversations (Only in chats mode) */}
          {navMode === 'chats' && (
            <>
              <Box position="relative" w="100%">
                <Search
                  size={15}
                  color="#94A3B8"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    zIndex: 2
                  }}
                />
                <Input
                  placeholder="Filter chats or messages..."
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  bg="#F4F3EF"
                  color="#171827"
                  pl="34px"
                  pr={chatSearchQuery ? "30px" : "12px"}
                  h="36px"
                  fontWeight="600"
                  fontSize="0.82rem"
                  fontFamily="'Plus Jakarta Sans', sans-serif"
                  borderRadius="12px"
                  border="1px solid rgba(23, 24, 39, 0.06)"
                  _focus={{
                    borderColor: "#5B5FEF",
                    bg: "#FFFFFF",
                    boxShadow: "0 0 0 2.5px rgba(91, 95, 239, 0.15)"
                  }}
                />
                {chatSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setChatSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'rgba(114, 116, 134, 0.15)',
                      color: '#727486',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      padding: 0
                    }}
                  >
                    ✕
                  </button>
                )}
              </Box>

              {/* Segmented Filter Pills */}
              <Box d="flex" alignItems="center" gap={1.5} overflowX="auto" pb={0.5} sx={{ '::-webkit-scrollbar': { display: 'none' } }}>
                {[
                  { id: 'all', label: '✦ All' },
                  { id: 'friends', label: '⭐ Friends' },
                  { id: 'groups', label: '👥 Groups' },
                  { id: 'unread', label: '⚡ Unread' }
                ].map(tab => {
                  const isActive = chatFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setChatFilter(tab.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '99px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        border: isActive ? 'none' : '1px solid rgba(23, 24, 39, 0.06)',
                        background: isActive ? 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)' : '#FFFFFF',
                        color: isActive ? '#FFFFFF' : '#727486',
                        cursor: 'pointer',
                        boxShadow: isActive ? '0 3px 10px rgba(91, 95, 239, 0.3)' : 'none',
                        transition: 'all 0.18s ease',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </Box>
            </>
          )}
        </Box>

        {/* 2. Mode Views: ORBIT, MEMORY, or CHATS */}
        {navMode === 'orbit' ? (
          <Box className="aura-orbit-viewport" p={3} position="relative" flex="1" minH={{ base: "440px", md: "500px" }}>
            {/* Top Orbit Telemetry Pill */}
            <Box
              position="absolute"
              top="14px"
              left="16px"
              zIndex={15}
              display="flex"
              alignItems="center"
              gap="6px"
              bg="rgba(255, 255, 255, 0.88)"
              backdropFilter="blur(12px)"
              px={3}
              py={1}
              borderRadius="99px"
              border="1px solid rgba(91, 95, 239, 0.2)"
              boxShadow="0 2px 10px rgba(91, 95, 239, 0.08)"
            >
              <motion.span
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981", display: "inline-block" }}
              />
              <Text fontSize="0.7rem" fontWeight="800" color="#5B5FEF" letterSpacing="0.04em" margin={0} fontFamily="'Plus Jakarta Sans', sans-serif">
                LIVE ORBIT MESH • {(chats || []).length} NODES
              </Text>
            </Box>

            {/* Rotating Radar Sweep Scanner Beam */}
            <div className="aura-radar-beam" />

            {/* Concentric Orbital Rings */}
            <div className="aura-orbit-ring-solid" style={{ width: 140, height: 140 }} />
            <div className="aura-orbit-ring-cosmic" style={{ width: 230, height: 230 }} />
            <div className="aura-orbit-ring-solid" style={{ width: 330, height: 330 }} />
            <div className="aura-orbit-ring-cosmic" style={{ width: 420, height: 420 }} />

            {/* Cardinal Radar Markers */}
            <span style={{ position: 'absolute', top: '16px', color: 'rgba(91, 95, 239, 0.4)', fontSize: '9px', fontWeight: 800 }}>N • 0°</span>
            <span style={{ position: 'absolute', bottom: '38px', color: 'rgba(91, 95, 239, 0.4)', fontSize: '9px', fontWeight: 800 }}>S • 180°</span>
            <span style={{ position: 'absolute', right: '16px', color: 'rgba(91, 95, 239, 0.4)', fontSize: '9px', fontWeight: 800 }}>E • 90°</span>
            <span style={{ position: 'absolute', left: '16px', color: 'rgba(91, 95, 239, 0.4)', fontSize: '9px', fontWeight: 800 }}>W • 270°</span>

            {/* ── CENTER CORE NODE: YOU (The Sun of the Orbit) ── */}
            <div className="aura-orbit-center-core">
              {/* Outer pulsing energy halo */}
              <motion.div
                animate={{ scale: [1, 1.45, 1], opacity: [0.4, 0.08, 0.4] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: 'absolute',
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(91, 95, 239, 0.35) 0%, transparent 70%)',
                  pointerEvents: 'none'
                }}
              />
              <motion.div
                whileHover={{ scale: 1.1 }}
                style={{
                  position: 'relative',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <Avatar
                  size="md"
                  name={user?.name || "You"}
                  src={user?.pic || user?.picture || ""}
                  style={{
                    width: "56px",
                    height: "56px",
                    border: "3px solid #FFFFFF",
                    boxShadow: "0 8px 25px rgba(91, 95, 239, 0.4), 0 0 0 2px #5B5FEF"
                  }}
                />
                <span style={{
                  marginTop: "6px",
                  fontSize: "0.68rem",
                  fontWeight: 900,
                  color: "#FFFFFF",
                  background: "linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)",
                  padding: "1px 8px",
                  borderRadius: "99px",
                  boxShadow: "0 2px 8px rgba(91, 95, 239, 0.3)",
                  letterSpacing: "0.04em"
                }}>
                  YOU
                </span>
              </motion.div>
            </div>

            {/* ── ORBITING CONTACT SATELLITES (Planets in Motion) ── */}
            {(!chats || chats.length === 0) ? (
              <Box position="absolute" bottom="18px" zIndex={15} textAlign="center">
                <Text fontSize="0.78rem" fontWeight="700" color="#64748B" margin={0}>
                  🌌 Your orbit is quiet. Start conversations to populate nodes!
                </Text>
              </Box>
            ) : (
              chats.slice(0, 10).map((c, i) => {
                const total = Math.min(chats.length, 10);
                const angle = (i / total) * Math.PI * 2;
                const radius = i % 3 === 0 ? 115 : (i % 3 === 1 ? 165 : 205);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                const cName = !c.isGroupChat ? getSender(user, c.users) : c.chatName;
                const cPic = !c.isGroupChat ? getPicture(user, c.users) : "";
                const isSelected = selectedChat && (selectedChat.id === c.id || selectedChat._id === c._id);

                return (
                  <motion.div
                    key={c.id || c._id}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.08, type: "spring", stiffness: 260, damping: 20 }}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      zIndex: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                    whileHover={{ scale: 1.25, zIndex: 30 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      dispatch(setSelectedChat(c));
                    }}
                  >
                    <Tooltip label={`Chat with ${cName}`} hasArrow placement="top">
                      <Box position="relative">
                        <Avatar
                          size="md"
                          name={cName}
                          src={cPic}
                          style={{
                            width: i % 3 === 0 ? "46px" : (i % 3 === 1 ? "42px" : "38px"),
                            height: i % 3 === 0 ? "46px" : (i % 3 === 1 ? "42px" : "38px"),
                            border: isSelected ? "3px solid #10B981" : "2.5px solid #FFFFFF",
                            boxShadow: isSelected
                              ? "0 0 20px rgba(16, 185, 129, 0.6), 0 4px 15px rgba(0, 0, 0, 0.15)"
                              : "0 6px 18px rgba(0, 0, 0, 0.1), 0 0 0 1.5px rgba(91, 95, 239, 0.3)"
                          }}
                        />
                        {/* Live Presence Beacon */}
                        <div style={{
                          position: 'absolute',
                          bottom: '0px',
                          right: '0px',
                          width: '11px',
                          height: '11px',
                          borderRadius: '50%',
                          background: '#10B981',
                          border: '2px solid #FFFFFF',
                          boxShadow: '0 0 6px #10B981'
                        }} />
                      </Box>
                    </Tooltip>

                    {/* Luxury Frosted Name Tag */}
                    <Box
                      mt={1}
                      px={2}
                      py={0.5}
                      bg="rgba(255, 255, 255, 0.92)"
                      backdropFilter="blur(8px)"
                      borderRadius="8px"
                      border="1px solid rgba(226, 232, 240, 0.8)"
                      boxShadow="0 2px 6px rgba(0, 0, 0, 0.04)"
                      maxW="85px"
                      textAlign="center"
                    >
                      <Text
                        fontSize="0.66rem"
                        fontWeight="800"
                        color="#0F172A"
                        isTruncated
                        margin={0}
                        fontFamily="'Plus Jakarta Sans', sans-serif"
                      >
                        {cName}
                      </Text>
                    </Box>
                  </motion.div>
                );
              })
            )}

            {/* Bottom Interaction Guide Pill */}
            <Box
              position="absolute"
              bottom="12px"
              zIndex={15}
              bg="rgba(255, 255, 255, 0.88)"
              backdropFilter="blur(12px)"
              px={3.5}
              py={1}
              borderRadius="99px"
              border="1px solid rgba(226, 232, 240, 0.9)"
              boxShadow="0 4px 15px rgba(0, 0, 0, 0.04)"
            >
              <Text fontSize="0.72rem" fontWeight="700" color="#64748B" margin={0} fontFamily="'Plus Jakarta Sans', sans-serif">
                ✦ Tap any planet node to engage in direct stream
              </Text>
            </Box>
          </Box>
        ) : navMode === 'memory' ? (
          <Box p={3.5} overflowY="auto" h="100%">
            <Box bg="#FFFFFF" p={4} borderRadius="20px" border="1px solid rgba(23, 24, 39, 0.06)" mb={3} boxShadow="0 4px 16px rgba(23, 24, 39, 0.02)">
              <Text fontSize="0.75rem" fontWeight="800" color="#5B5FEF" textTransform="uppercase" letterSpacing="0.08em" mb={1}>
                CONVERSATION MEMORY
              </Text>
              <Text fontSize="0.82rem" color="#727486" mb={3}>
                Context, shared media & important moments surfaced across your circle.
              </Text>
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2.5}>
                <Box bg="#F4F3EF" p={3} borderRadius="16px" textAlign="center">
                  <Text fontSize="1.3rem" fontWeight="900" color="#171827">14</Text>
                  <Text fontSize="0.72rem" fontWeight="700" color="#727486">Shared Images</Text>
                </Box>
                <Box bg="#F4F3EF" p={3} borderRadius="16px" textAlign="center">
                  <Text fontSize="1.3rem" fontWeight="900" color="#171827">6</Text>
                  <Text fontSize="0.72rem" fontWeight="700" color="#727486">Vault Files</Text>
                </Box>
                <Box bg="#F4F3EF" p={3} borderRadius="16px" textAlign="center">
                  <Text fontSize="1.3rem" fontWeight="900" color="#171827">8</Text>
                  <Text fontSize="0.72rem" fontWeight="700" color="#727486">Audio Notes</Text>
                </Box>
                <Box bg="#F4F3EF" p={3} borderRadius="16px" textAlign="center">
                  <Text fontSize="1.3rem" fontWeight="900" color="#171827">12ms</Text>
                  <Text fontSize="0.72rem" fontWeight="700" color="#36C98F">P2P Ping</Text>
                </Box>
              </Box>
            </Box>
          </Box>
        ) : (
          <Box flex="1" overflowY="auto" px={3} py={1}>
          {loading && (!chats || chats.length === 0) ? (
            <ChatLoading />
          ) : chats && chats.length > 0 ? (
            <Stack spacing={1.5}>
              {(() => {
                // Deduplicate chats by ID and target user ID
                const uniqueChats = [];
                const seenKeys = new Set();

                for (const c of chats) {
                  if (!c) continue;
                  const cId = String(c.id || c._id);
                  const targetU = !c.isGroupChat ? getSenderUser(user, c.users) : null;
                  const targetKey = targetU ? `user-${targetU.id || targetU._id || targetU.email}` : `chat-${cId}`;

                  if (!seenKeys.has(cId) && !seenKeys.has(targetKey)) {
                    seenKeys.add(cId);
                    seenKeys.add(targetKey);
                    uniqueChats.push(c);
                  }
                }

                // Filter by chatFilter and chatSearchQuery
                const filteredList = uniqueChats.filter(c => {
                  if (chatFilter === 'friends' && c.isGroupChat) return false;
                  if (chatFilter === 'groups' && !c.isGroupChat) return false;
                  
                  const cId = String(c.id || c._id);
                  const isDeletedLocally = deletedChatIds.includes(cId);

                  if (chatFilter === 'unread') {
                    const dbCount = unreadCounts[cId] || 0;
                    const unreadN = notification.filter(n => String(n.chat?.id || n.chat?._id || n.chatId) === cId).length;
                    if (dbCount <= 0 && unreadN <= 0) return false;
                  }
                  
                  // For 'all' filter, hide locally deleted chats UNLESS there's a new message
                  if (isDeletedLocally) {
                    try {
                      const clearedChats = JSON.parse(localStorage.getItem("aura_cleared_chats") || "{}");
                      const clearedAt = clearedChats[cId] || 0;
                      const latestMsgTime = c.latestMessage ? new Date(c.latestMessage.createdAt || c.latestMessage.timestamp).getTime() : 0;
                      
                      if (latestMsgTime > clearedAt) {
                         setTimeout(() => {
                           const newDeleted = deletedChatIds.filter(id => id !== cId);
                           localStorage.setItem("aura_deleted_chats", JSON.stringify(newDeleted));
                           setDeletedChatIds(newDeleted);
                         }, 0);
                         return true;
                      }
                    } catch (e) {}
                    return false;
                  }

                  // Search filter
                  if (chatSearchQuery && chatSearchQuery.trim()) {
                    const qLower = chatSearchQuery.trim().toLowerCase();
                    const name = (!c.isGroupChat ? getSender(user, c.users) : c.chatName) || '';
                    const senderU = !c.isGroupChat ? getSenderUser(user, c.users) : null;
                    const username = (senderU?.username || senderU?.email || '').toLowerCase();
                    const latestContent = (c.latestMessage?.content || '').toLowerCase();
                    if (!name.toLowerCase().includes(qLower) && !username.includes(qLower) && !latestContent.includes(qLower)) {
                      return false;
                    }
                  }
                  
                  return true;
                });

                if (filteredList.length === 0) {
                  return (
                    <Box d="flex" flexDir="column" alignItems="center" justifyContent="center" py={10} px={3} textAlign="center">
                      <Search size={28} color="#5B5FEF" style={{ marginBottom: "10px", opacity: 0.8 }} />
                      <Text fontWeight="800" fontSize="0.95rem" color="#171827" mb={1} fontFamily="'Plus Jakarta Sans', sans-serif">
                        {chatSearchQuery ? "No matches found" : "No chats in this tab"}
                      </Text>
                      <Text fontSize="0.78rem" color="#727486" maxW="200px" fontFamily="'Plus Jakarta Sans', sans-serif" mb={3}>
                        {chatSearchQuery ? `No chat matches "${chatSearchQuery}"` : "Discover people to start chatting!"}
                      </Text>
                      {onOpenDrawer && (
                        <Button
                          size="xs"
                          onClick={onOpenDrawer}
                          style={{
                            background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                            color: '#FFFFFF',
                            borderRadius: '99px',
                            fontWeight: 800,
                            padding: '0 14px',
                            height: '28px',
                            border: 'none',
                            boxShadow: '0 2px 8px rgba(91, 95, 239, 0.3)'
                          }}
                        >
                          + Find Friends
                        </Button>
                      )}
                    </Box>
                  );
                }

                const sortedChats = filteredList.sort((a, b) => {
                  const aId = String(a.id || a._id);
                  const bId = String(b.id || b._id);
                  const aPinned = pinnedChatIds.includes(aId) ? 1 : 0;
                  const bPinned = pinnedChatIds.includes(bId) ? 1 : 0;
                  return bPinned - aPinned;
                });

                return sortedChats.map((chat, index) => {
                  const currentChatId = String(chat.id || chat._id);
                  const activeChatId = String(selectedChat?.id || selectedChat?._id);
                  const isSelected = activeChatId === currentChatId;
                  const isPinned = pinnedChatIds.includes(currentChatId);
                  const isMuted = mutedChatIds.includes(currentChatId);
                  const senderName = !chat.isGroupChat ? getSender(user, chat.users) : chat.chatName;
                  const senderPic = !chat.isGroupChat ? getPicture(user, chat.users) : "";
                  const targetUser = !chat.isGroupChat ? getSenderUser(user, chat.users) : null;
                  const targetUserId = targetUser ? String(targetUser._id || targetUser.id || targetUser.publicId || '') : '';
                  const statusObj = targetUserId && userStatuses[targetUserId] ? userStatuses[targetUserId] : null;
                  const isTargetOnline = statusObj != null 
                    ? statusObj.isOnline 
                    : Boolean(targetUser?.isOnline || targetUser?.online);

                  let clearedAt = 0;
                  try {
                    const clearedChats = JSON.parse(localStorage.getItem("aura_cleared_chats") || "{}");
                    clearedAt = clearedChats[currentChatId] || 0;
                  } catch(e) {}
                  const latestMsgTime = chat.latestMessage ? new Date(chat.latestMessage.createdAt || chat.latestMessage.timestamp).getTime() : 0;
                  const isLatestMsgVisible = latestMsgTime > clearedAt;

                  const unreadNotifs = notification.filter(n => {
                    const notifChatId = n.chat?.id || n.chat?._id || n.chatId;
                    return String(notifChatId) === currentChatId;
                  });

                  // DB count is the source of truth; layer in-memory notifications on top for real-time
                  const dbUnread = unreadCounts[currentChatId] || 0;
                  // Don't show badge for the currently-selected (open) chat
                  let unreadCount = isSelected ? 0 : (isLatestMsgVisible ? Math.max(dbUnread, unreadNotifs.length) : 0);

                  const formatDateTime = (dateStr) => {
                    if (!dateStr) return 'Now';
                    let str = dateStr;
                    if (typeof str === 'number') str = new Date(str).toISOString();
                    const d = new Date(str);
                    if (isNaN(d.getTime())) return 'Now';
                    const now = new Date();
                    const isToday = d.toDateString() === now.toDateString();
                    return isToday
                      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                  };

                  return (
                    <motion.div
                      key={currentChatId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.03 }}
                      whileHover={{ scale: 1.01, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Box
                        className={`aura-conversation-row ${isSelected ? 'is-selected' : ''} ${unreadCount > 0 ? 'has-unread' : ''}`}
                        onClick={() => {
                          dispatch(setSelectedChat(chat));
                          // Always clear notifications & mark read when opening a chat
                          dispatch(setNotification(notification.filter(n => {
                            const notifChatId = n.chat?.id || n.chat?._id || n.chatId;
                            return String(notifChatId) !== currentChatId;
                          })));
                          // Mark all messages as read in DB
                          setUnreadCounts(prev => ({ ...prev, [currentChatId]: 0 }));
                          try {
                            const config = { headers: { Authorization: "Bearer " + getJwtToken() } };
                            axios.put(`/api/message/mark-read/${currentChatId}`, {}, config);
                          } catch (e) { }
                        }}
                        cursor="pointer"
                        bg={isSelected ? "rgba(91, 95, 239, 0.08)" : unreadCount > 0 ? "rgba(91, 95, 239, 0.03)" : "#FFFFFF"}
                        px={{ base: 3, md: 3.5 }}
                        py={2.5}
                        borderRadius="18px"
                        position="relative"
                        style={{
                          border: isSelected ? "1.5px solid #5B5FEF" : unreadCount > 0 ? "1px solid rgba(91, 95, 239, 0.25)" : "1px solid rgba(23, 24, 39, 0.06)",
                          boxShadow: isSelected ? "0 8px 24px rgba(91, 95, 239, 0.12)" : "0 2px 8px rgba(23, 24, 39, 0.02)",
                          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
                        }}
                        _hover={{
                          boxShadow: "0 8px 24px rgba(23, 24, 39, 0.05)",
                          transform: "translateY(-1px)",
                          bg: isSelected ? "rgba(91, 95, 239, 0.1)" : "#FBFBF9"
                        }}
                        d="flex"
                        alignItems="center"
                        gap="12px"
                      >
                        {/* Pinned indicator on the left side */}
                        {isPinned && (
                          <div style={{ position: "absolute", left: "0", top: "50%", transform: "translateY(-50%)", width: "3.5px", height: "46%", background: "linear-gradient(180deg, #5B5FEF 0%, #8067E8 100%)", borderTopRightRadius: "4px", borderBottomRightRadius: "4px", boxShadow: "0 0 8px rgba(91, 95, 239, 0.5)" }} />
                        )}

                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <Avatar
                            size="md"
                            name={senderName}
                            src={senderPic}
                            fontWeight="800"
                            style={{ 
                              border: isSelected ? "2px solid #5B5FEF" : "1.5px solid rgba(23, 24, 39, 0.08)",
                              boxShadow: isSelected ? "0 4px 14px rgba(91, 95, 239, 0.25)" : "0 2px 8px rgba(23, 24, 39, 0.04)"
                            }}
                          />
                          {!chat.isGroupChat && (
                            <span
                              className={isTargetOnline ? "aura-presence-pulse-active" : "aura-presence-pulse-offline"}
                              style={{
                                position: "absolute",
                                bottom: "0px",
                                right: "0px",
                                zIndex: 2
                              }}
                            />
                          )}
                        </div>

                        <Box flex="1" minWidth="0" overflow="hidden">
                          <Box d="flex" justifyContent="space-between" alignItems="center" width="100%">
                            <Box d="flex" alignItems="center" gap={1.5} flex="1" minWidth="0" overflow="hidden">
                              <Text fontWeight={unreadCount > 0 ? "800" : "600"} fontSize="0.92rem" color="#171827" isTruncated style={{ letterSpacing: "-0.01em", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                {senderName}
                              </Text>
                              {isPinned && (
                                <Tooltip label="Pinned Chat" hasArrow placement="top">
                                  <Badge bg="rgba(91, 95, 239, 0.1)" color="#5B5FEF" borderRadius="6px" px={1.5} fontSize="0.65rem">📌</Badge>
                                </Tooltip>
                              )}
                              {isMuted && (
                                <Tooltip label="Muted" hasArrow placement="top">
                                  <Badge bg="rgba(100, 116, 139, 0.1)" color="#64748B" borderRadius="6px" px={1.5} fontSize="0.65rem">🔕</Badge>
                                </Tooltip>
                              )}
                            </Box>

                            <Box d="flex" alignItems="center" gap={1} flexShrink={0} ml={2}>
                              <Text fontSize="0.72rem" fontWeight="600" color={unreadCount > 0 ? "#5B5FEF" : "#727486"} whiteSpace="nowrap">
                                {isLatestMsgVisible ? formatDateTime(chat.updatedAt || chat.latestMessage?.createdAt) : ""}
                              </Text>


                            {/* Ultra-Clean Luxurious Three Dots Menu */}
                              <Menu placement="bottom-end" isLazy strategy="fixed">
                                <MenuButton
                                  as={motion.button}
                                  type="button"
                                  className="aura-icon-btn"
                                  whileHover={{ scale: 1.15, color: "#0F172A" }}
                                  whileTap={{ scale: 0.88 }}
                                  onClick={(e) => e.stopPropagation()}
                                  _focus={{ boxShadow: "none", outline: "none" }}
                                  _focusVisible={{ boxShadow: "none", outline: "none" }}
                                  _active={{ boxShadow: "none", outline: "none", background: "transparent" }}
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    outline: "none",
                                    boxShadow: "none",
                                    borderRadius: "50%",
                                    width: "24px",
                                    height: "24px",
                                    minWidth: "24px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    color: "#94A3B8",
                                    transition: "all 0.2s ease",
                                    marginLeft: "2px",
                                    padding: 0
                                  }}
                                >
                                  <MoreVertical size={15} />
                                </MenuButton>
                                <Portal>
                                  <MenuList
                                  bg="rgba(255, 255, 255, 0.96)"
                                  backdropFilter="blur(20px)"
                                  borderRadius="20px"
                                  p={2}
                                  minW="200px"
                                  style={{
                                    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.12), 0 4px 10px rgba(0,0,0,0.04)",
                                    border: "1px solid rgba(226, 232, 240, 0.9)",
                                    zIndex: 9999
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MenuItem
                                    onClick={(e) => handleTogglePin(e, currentChatId)}
                                    borderRadius="12px"
                                    fontSize="0.9rem"
                                    fontWeight="600"
                                    color="#18181B"
                                    py={2.5}
                                    px={3}
                                    _hover={{ bg: "rgba(37, 99, 235, 0.06)", color: "#2563EB" }}
                                  >
                                    <Pin size={17} style={{ marginRight: "12px" }} />
                                    {isPinned ? "Unpin Chat" : "Pin Chat"}
                                  </MenuItem>

                                  <MenuItem
                                    onClick={(e) => handleToggleMute(e, currentChatId)}
                                    borderRadius="12px"
                                    fontSize="0.9rem"
                                    fontWeight="600"
                                    color="#18181B"
                                    py={2.5}
                                    px={3}
                                    _hover={{ bg: "rgba(113, 113, 122, 0.08)" }}
                                  >
                                    <VolumeX size={17} style={{ marginRight: "12px" }} />
                                    {isMuted ? "Unmute" : "Mute Notifications"}
                                  </MenuItem>



                                  {!chat.isGroupChat && (
                                    <MenuItem
                                      onClick={(e) => handleUnfriend(e, chat)}
                                      borderRadius="12px"
                                      fontSize="0.9rem"
                                      fontWeight="700"
                                      color="#EF4444"
                                      py={2.5}
                                      px={3}
                                      _hover={{ bg: "rgba(239, 68, 68, 0.08)", color: "#DC2626" }}
                                    >
                                      <UserMinus size={17} style={{ marginRight: "12px" }} />
                                      Unfriend
                                    </MenuItem>
                                  )}

                                  <MenuItem
                                    onClick={(e) => handleDeleteChat(e, chat)}
                                    borderRadius="12px"
                                    fontSize="0.9rem"
                                    fontWeight="700"
                                    color="#EF4444"
                                    py={2.5}
                                    px={3}
                                    _hover={{ bg: "rgba(239, 68, 68, 0.08)", color: "#DC2626" }}
                                  >
                                    <Trash2 size={17} style={{ marginRight: "12px" }} />
                                    Delete Chat
                                  </MenuItem>
                                </MenuList>
                                </Portal>
                              </Menu>
                            </Box>
                          </Box>
                          <Box d="flex" alignItems="center" justifyContent="space-between" gap={2}>
                            <Text
                              fontSize="0.82rem"
                              color={unreadCount > 0 ? "#0F172A" : "#475569"}
                              fontWeight={unreadCount > 0 ? "700" : "400"}
                              isTruncated
                              mt={0.5}
                              flex="1"
                              style={{ fontStyle: chat.latestMessage?.content?.startsWith('[view-once]') ? 'italic' : 'normal' }}
                            >
                              {isLatestMsgVisible ? <DecryptedLatestMessage msg={chat.latestMessage} /> : "No messages yet"}
                            </Text>
                            {unreadCount > 0 && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                style={{
                                  background: "linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)",
                                  color: "#FFFFFF",
                                  borderRadius: unreadCount > 9 ? "11px" : "50%",
                                  minWidth: "22px",
                                  height: "22px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "0.7rem",
                                  fontWeight: 800,
                                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                                  padding: unreadCount > 9 ? "0 6px" : "0",
                                  boxShadow: "0 2px 8px rgba(91, 95, 239, 0.35)",
                                  flexShrink: 0
                                }}
                              >
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </motion.div>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </motion.div>
                    );
                  });
                })()}

                {/* Subtle Security Encryption Badge */}
                <Box d="flex" alignItems="center" justifyContent="center" gap={1.5} py={6} opacity={0.75}>
                  <Lock size={12} color="#A1A3B5" />
                  <Text fontSize="0.72rem" fontWeight="600" color="#A1A3B5" letterSpacing="0.02em" fontFamily="'Plus Jakarta Sans', sans-serif">
                    End-to-end encrypted chats
                  </Text>
                </Box>
              </Stack>
            ) : (
              <Box d="flex" flexDir="column" alignItems="center" justifyContent="center" py={12} px={4} textAlign="center">
                <Sparkles size={32} color="#5B5FEF" style={{ marginBottom: "12px", opacity: 0.8 }} />
                <Text fontWeight="800" fontSize="1.05rem" color="#171827" mb={1} fontFamily="'Plus Jakarta Sans', sans-serif">
                  No active conversations yet
                </Text>
                <Text fontSize="0.82rem" color="#727486" maxW="240px" fontFamily="'Plus Jakarta Sans', sans-serif">
                  Search a user or create a group to start messaging!
                </Text>
              </Box>
            )}
        </Box>
        )}
      </Box>
    </>
  );
};

export default MyChat;
