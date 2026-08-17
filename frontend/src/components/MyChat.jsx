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
import AuraGroupChatModal from "./AuraGroupChatModal";
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
          <Box
            style={{
              width: '100%',
              height: '100%',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              padding: '12px 14px',
              overflowY: 'auto',
              boxSizing: 'border-box'
            }}
          >
            {/* Top Minimal Orbit HUD Header */}
            <Box
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
                padding: '0 6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <motion.span
                  animate={{ scale: [1, 1.35, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981', display: 'inline-block' }}
                />
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#5B5FEF', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Active Gravity Circle
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {(chats || []).length} Orbit Nodes
              </span>
            </Box>

            {/* ── 🪐 CONCENTRIC LIVING ORBIT CARD WITH CONTINUOUS MOTION ── */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '335px',
                height: '335px',
                minHeight: '335px',
                background: 'linear-gradient(180deg, #F5F5F1 0%, #EFEFEA 100%)',
                borderRadius: '34px',
                border: '1.5px solid rgba(23, 24, 39, 0.05)',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.04), inset 0 2px 8px rgba(255, 255, 255, 0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0
              }}
            >
              {/* Outer Dashed Orbit Ring (270px Diameter) */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '270px',
                  height: '270px',
                  borderRadius: '50%',
                  border: '1.5px dashed rgba(91, 95, 239, 0.38)',
                  pointerEvents: 'none',
                  zIndex: 1,
                  boxSizing: 'border-box'
                }}
              />

              {/* Inner Solid Orbit Ring (170px Diameter) */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '170px',
                  height: '170px',
                  borderRadius: '50%',
                  border: '1.5px solid rgba(91, 95, 239, 0.45)',
                  pointerEvents: 'none',
                  zIndex: 1,
                  boxSizing: 'border-box'
                }}
              />

              {/* Center "YOU" Node with Multi-Layered Radial Ambient Aura */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}
              >
                {/* Ambient Breathing Aura Halo */}
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.55, 0.22, 0.55] }}
                  transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
                  style={{
                    position: 'absolute',
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(91, 95, 239, 0.42) 0%, rgba(128, 103, 232, 0.18) 50%, transparent 70%)',
                    pointerEvents: 'none'
                  }}
                />

                {/* Solid YOU Sphere */}
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #5B5FEF 0%, #6E5BE8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 900,
                    fontSize: '1.05rem',
                    letterSpacing: '0.04em',
                    boxShadow: '0 10px 28px rgba(91, 95, 239, 0.45)',
                    userSelect: 'none',
                    position: 'relative',
                    zIndex: 2
                  }}
                >
                  YOU
                </motion.div>
              </div>

              {/* ── 🔄 INNER ORBIT REVOLUTION LAYER (Clockwise 30s) ── */}
              {(() => {
                const innerList = (chats || []).filter((_, idx) => idx % 2 === 0).slice(0, 4);
                if (innerList.length === 0) return null;
                const nodeColors = ['#0284C7', '#EF4444', '#10B981', '#8B5CF6'];

                return (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 32, ease: "linear" }}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '170px',
                      height: '170px',
                      marginTop: '-85px',
                      marginLeft: '-85px',
                      pointerEvents: 'none',
                      zIndex: 14
                    }}
                  >
                    {innerList.map((c, i) => {
                      const angle = (i / innerList.length) * Math.PI * 2;
                      const radius = 85; // exact half of 170px
                      const x = Math.cos(angle) * radius;
                      const y = Math.sin(angle) * radius;
                      const cName = !c.isGroupChat ? getSender(user, c.users) : c.chatName;
                      const cPic = !c.isGroupChat ? getPicture(user, c.users) : "";
                      const nodeBg = nodeColors[i % nodeColors.length];

                      return (
                        <div
                          key={c.id || c._id}
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                            pointerEvents: 'auto'
                          }}
                        >
                          {/* Counter-rotate in sync so text/avatar stays upright during orbit */}
                          <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ repeat: Infinity, duration: 32, ease: "linear" }}
                            whileHover={{ scale: 1.28, zIndex: 40 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => dispatch(setSelectedChat(c))}
                            style={{ cursor: 'pointer' }}
                          >
                            <Tooltip label={cName} hasArrow placement="top">
                              <Box position="relative">
                                <Avatar
                                  size="sm"
                                  name={cName}
                                  src={cPic}
                                  style={{
                                    width: "38px",
                                    height: "38px",
                                    background: nodeBg,
                                    color: "#FFFFFF",
                                    fontWeight: 800,
                                    fontSize: "0.85rem",
                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                    border: "2.5px solid #FFFFFF",
                                    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.14)"
                                  }}
                                />
                              </Box>
                            </Tooltip>
                          </motion.div>
                        </div>
                      );
                    })}
                  </motion.div>
                );
              })()}

              {/* ── 🔄 OUTER ORBIT REVOLUTION LAYER (Counter-Clockwise 48s) ── */}
              {(() => {
                const outerList = (chats || []).filter((_, idx) => idx % 2 !== 0).slice(0, 5);
                if (outerList.length === 0) return null;
                const nodeColors = ['#10B981', '#F59E0B', '#EC4899', '#0284C7', '#6366F1'];

                return (
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 48, ease: "linear" }}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '270px',
                      height: '270px',
                      marginTop: '-135px',
                      marginLeft: '-135px',
                      pointerEvents: 'none',
                      zIndex: 13
                    }}
                  >
                    {outerList.map((c, i) => {
                      const angle = (i / outerList.length) * Math.PI * 2;
                      const radius = 135; // exact half of 270px
                      const x = Math.cos(angle) * radius;
                      const y = Math.sin(angle) * radius;
                      const cName = !c.isGroupChat ? getSender(user, c.users) : c.chatName;
                      const cPic = !c.isGroupChat ? getPicture(user, c.users) : "";
                      const nodeBg = nodeColors[i % nodeColors.length];

                      return (
                        <div
                          key={c.id || c._id}
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                            pointerEvents: 'auto'
                          }}
                        >
                          {/* Counter-rotate in sync so text/avatar stays upright during orbit */}
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 48, ease: "linear" }}
                            whileHover={{ scale: 1.28, zIndex: 40 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => dispatch(setSelectedChat(c))}
                            style={{ cursor: 'pointer' }}
                          >
                            <Tooltip label={cName} hasArrow placement="top">
                              <Box position="relative">
                                <Avatar
                                  size="sm"
                                  name={cName}
                                  src={cPic}
                                  style={{
                                    width: "36px",
                                    height: "36px",
                                    background: nodeBg,
                                    color: "#FFFFFF",
                                    fontWeight: 800,
                                    fontSize: "0.82rem",
                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                    border: "2.5px solid #FFFFFF",
                                    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.14)"
                                  }}
                                />
                              </Box>
                            </Tooltip>
                          </motion.div>
                        </div>
                      );
                    })}
                  </motion.div>
                );
              })()}
            </div>

            {/* ── 🌟 RECENT ORBIT QUICK CONNECT TRAY ── */}
            <div
              style={{
                width: '100%',
                marginTop: '16px',
                background: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid rgba(23, 24, 39, 0.06)',
                padding: '14px 16px',
                boxShadow: '0 4px 16px rgba(23, 24, 39, 0.02)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#171827', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Quick Orbit Connect
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5B5FEF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Tap to Chat ➔
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {chats && chats.slice(0, 6).map((c) => {
                  const cName = !c.isGroupChat ? getSender(user, c.users) : c.chatName;
                  const cPic = !c.isGroupChat ? getPicture(user, c.users) : "";
                  return (
                    <motion.div
                      key={c.id || c._id}
                      whileHover={{ scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => dispatch(setSelectedChat(c))}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      <Avatar
                        size="sm"
                        name={cName}
                        src={cPic}
                        style={{
                          width: '36px',
                          height: '36px',
                          border: '2px solid rgba(91, 95, 239, 0.3)',
                          boxShadow: '0 2px 8px rgba(91, 95, 239, 0.12)'
                        }}
                      />
                      <span style={{
                        fontSize: '0.64rem',
                        fontWeight: 700,
                        color: '#64748B',
                        maxWidth: '48px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: "'Plus Jakarta Sans', sans-serif"
                      }}>
                        {cName}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </Box>
        ) : navMode === 'memory' ? (
          <Box p={3.5} overflowY="auto" h="100%" flex="1">
            {/* ── LIVE CONVERSATION MEMORY VAULT CARD ── */}
            <Box
              bg="#FFFFFF"
              p={4}
              borderRadius="24px"
              border="1.5px solid rgba(23, 24, 39, 0.06)"
              mb={3}
              boxShadow="0 6px 24px rgba(23, 24, 39, 0.03)"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <Text fontSize="0.75rem" fontWeight="800" color="#5B5FEF" textTransform="uppercase" letterSpacing="0.08em" margin={0} fontFamily="'Plus Jakarta Sans', sans-serif">
                  ● LIVE CONVERSATION MEMORY
                </Text>
                <span style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: livePing < 50 ? '#10B981' : '#F59E0B',
                  background: livePing < 50 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '99px'
                }}>
                  {livePing < 50 ? '⚡ Ultra Low Latency' : '● Connected'}
                </span>
              </div>

              <Text fontSize="0.8rem" color="#64748B" fontWeight="600" mb={3.5} lineHeight={1.4} fontFamily="'Plus Jakarta Sans', sans-serif">
                Live real-time metrics, shared vault files & media across {selectedChat ? (selectedChat.chatName || 'this conversation') : 'your active circle'}.
              </Text>

              {/* ── 4 LIVE REAL-TIME METRIC TILES ── */}
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2.5}>
                {/* 1. Live Shared Images */}
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  style={{
                    background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                    padding: '16px 12px',
                    borderRadius: '18px',
                    textAlign: 'center',
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <Text fontSize="1.45rem" fontWeight="900" color="#0F172A" margin={0} fontFamily="'Plus Jakarta Sans', sans-serif">
                    {vaultLoading ? '...' : vaultStats.images}
                  </Text>
                  <Text fontSize="0.72rem" fontWeight="800" color="#64748B" margin={0} mt={0.5} fontFamily="'Plus Jakarta Sans', sans-serif">
                    🖼️ Shared Images
                  </Text>
                </motion.div>

                {/* 2. Live Vault Files */}
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  style={{
                    background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                    padding: '16px 12px',
                    borderRadius: '18px',
                    textAlign: 'center',
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <Text fontSize="1.45rem" fontWeight="900" color="#0F172A" margin={0} fontFamily="'Plus Jakarta Sans', sans-serif">
                    {vaultLoading ? '...' : vaultStats.files}
                  </Text>
                  <Text fontSize="0.72rem" fontWeight="800" color="#64748B" margin={0} mt={0.5} fontFamily="'Plus Jakarta Sans', sans-serif">
                    📁 Vault Files
                  </Text>
                </motion.div>

                {/* 3. Live Audio & Video Notes */}
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  style={{
                    background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                    padding: '16px 12px',
                    borderRadius: '18px',
                    textAlign: 'center',
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <Text fontSize="1.45rem" fontWeight="900" color="#0F172A" margin={0} fontFamily="'Plus Jakarta Sans', sans-serif">
                    {vaultLoading ? '...' : vaultStats.audio}
                  </Text>
                  <Text fontSize="0.72rem" fontWeight="800" color="#64748B" margin={0} mt={0.5} fontFamily="'Plus Jakarta Sans', sans-serif">
                    🎙️ Audio & Video Notes
                  </Text>
                </motion.div>

                {/* 4. Live Real-Time P2P Ping Latency */}
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  style={{
                    background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                    padding: '16px 12px',
                    borderRadius: '18px',
                    textAlign: 'center',
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <Text fontSize="1.45rem" fontWeight="900" color={livePing < 50 ? "#10B981" : "#F59E0B"} margin={0} fontFamily="'Plus Jakarta Sans', sans-serif">
                    {livePing}ms
                  </Text>
                  <Text fontSize="0.72rem" fontWeight="800" color={livePing < 50 ? "#10B981" : "#F59E0B"} margin={0} mt={0.5} fontFamily="'Plus Jakarta Sans', sans-serif">
                    ⚡ Live Network Ping
                  </Text>
                </motion.div>
              </Box>
            </Box>

            {/* ── RECENT LIVE VAULT STREAM FEED ── */}
            <Box
              bg="#FFFFFF"
              p={4}
              borderRadius="24px"
              border="1.5px solid rgba(23, 24, 39, 0.06)"
              boxShadow="0 6px 24px rgba(23, 24, 39, 0.03)"
            >
              <Text fontSize="0.75rem" fontWeight="800" color="#171827" textTransform="uppercase" letterSpacing="0.06em" mb={2.5} fontFamily="'Plus Jakarta Sans', sans-serif">
                ✦ Recent Vault Activity
              </Text>

              {vaultStats.items && vaultStats.items.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {vaultStats.items.slice(0, 5).map((item, idx) => (
                    <div
                      key={item.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#F8FAFC',
                        padding: '10px 14px',
                        borderRadius: '14px',
                        border: '1px solid rgba(226, 232, 240, 0.8)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                        <span style={{ fontSize: '18px' }}>
                          {item.type === 'image' ? '🖼️' : item.type === 'file' ? '📄' : '🎙️'}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <span style={{
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            color: '#0F172A',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '160px',
                            fontFamily: "'Plus Jakarta Sans', sans-serif"
                          }}>
                            {item.name || (item.type === 'image' ? 'Shared Photo' : item.type === 'audio' ? 'Voice Note' : 'Vault File')}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>
                            {item.time ? new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live Stream'}
                          </span>
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        color: '#5B5FEF',
                        background: 'rgba(91, 95, 239, 0.1)',
                        padding: '3px 8px',
                        borderRadius: '99px'
                      }}>
                        VAULT
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '18px 8px' }}>
                  <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>✨</span>
                  <Text fontSize="0.82rem" fontWeight="700" color="#64748B" margin={0} fontFamily="'Plus Jakarta Sans', sans-serif">
                    No vault media yet. Share images, files, or voice notes to populate!
                  </Text>
                </div>
              )}
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
        <AuraGroupChatModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        fetchAgain={fetchAgain}
        setFetchAgain={setFetchAgain}
      />
    </Box>
    </>
  );
};

export default MyChat;
