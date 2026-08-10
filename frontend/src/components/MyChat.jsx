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
    if (content.startsWith('[gz]') || content.startsWith('[enc]')) {
      decompressData(content).then(res => {
        if (!isMounted) return;
        if (res.startsWith('data:image')) setText('📷 Photo message');
        else if (res.startsWith('data:video') || res.includes('video/mp4') || res.includes('.mp4')) setText('🎥 Video message');
        else if (res.startsWith('data:audio') || res.includes('audio/mp3') || res.includes('.mp3')) setText('🎙 Voice message');
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

const MyChat = ({ fetchAgain, setFetchAgain }) => {
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

  const [chatFilter, setChatFilter] = useState('all'); // 'all' or 'friends'
  const [pinnedChatIds, setPinnedChatIds] = useState([]);
  const [mutedChatIds, setMutedChatIds] = useState([]);
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
        {loadingTwo && <Progress size='xs' isIndeterminate colorScheme="amber" bg="rgba(212, 175, 55, 0.2)" style={{ height: "3px" }} />}
        <ModalOverlay style={{ backdropFilter: "blur(12px)", background: "rgba(15, 23, 42, 0.35)" }} />
        <ModalContent style={{
          background: "#FFFFFF",
          color: "#0F172A",
          borderRadius: "28px",
          border: "1.5px solid rgba(212, 175, 55, 0.3)",
          boxShadow: "0 25px 60px rgba(15, 23, 42, 0.18)"
        }}>
          <ModalHeader style={{ borderBottom: "1px solid #F1F5F9", padding: "20px 24px" }}>
            <Text fontWeight="900" fontSize="1.35rem" color="#0F172A" margin={0} fontFamily="'Outfit', sans-serif">Create Group Chat</Text>
          </ModalHeader>
          <ModalCloseButton style={{ borderRadius: "50%", border: "1px solid rgba(226, 232, 240, 0.8)", top: "18px", right: "20px" }} />
          <ModalBody d="flex" flexDir="column" py={4} px={5}>
            <FormControl>
              <Input
                placeholder="Group Name (e.g. Design Team)"
                mb={3}
                value={groupChatName}
                onChange={(e) => setGroupChatName(e.target.value)}
                borderRadius="16px"
                bg="#FFFFFF"
                border="1.5px solid rgba(226, 232, 240, 0.9)"
                color="#0F172A"
                fontWeight="600"
                fontFamily="'Inter', sans-serif"
                _focus={{ borderColor: "#D4AF37", boxShadow: "0 4px 14px rgba(212, 175, 55, 0.15)" }}
              />
            </FormControl>
            <FormControl>
              <Input
                placeholder="Add Users (e.g. Vicky, Ram)"
                mb={3}
                onChange={(e) => handleSearch(e.target.value)}
                borderRadius="16px"
                bg="#FFFFFF"
                border="1.5px solid rgba(226, 232, 240, 0.9)"
                color="#0F172A"
                fontWeight="600"
                fontFamily="'Inter', sans-serif"
                _focus={{ borderColor: "#D4AF37", boxShadow: "0 4px 14px rgba(212, 175, 55, 0.15)" }}
              />
            </FormControl>
            <Box w="100%" d="flex" flexWrap="wrap" gap={1.5} mb={3}>
              {selectedUsers.map((u) => (
                <UserBadgeItem key={u.id || u._id} user={u} handleFunction={() => handleDelete(u)} />
              ))}
            </Box>
            {loadingGroupUsers ? <Spinner size="sm" color="#D4AF37" /> : (
              searchResult?.slice(0, 4).map((u) => (
                <UserListItem key={u.id || u._id} user={u} handleFunction={() => handleGroup(u)} />
              ))
            )}
          </ModalBody>
          <ModalFooter style={{ borderTop: "1px solid #F1F5F9", padding: "16px 24px" }}>
            <Button
              style={{
                background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
                color: "#FFFFFF",
                border: "1px solid rgba(212, 175, 55, 0.5)",
                borderRadius: "16px",
                padding: "12px 24px",
                fontWeight: 800,
                fontSize: "0.95rem",
                fontFamily: "'Outfit', sans-serif",
                boxShadow: "0 8px 20px rgba(15, 23, 42, 0.2)",
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
        d={{ base: selectedChat ? "none" : "flex", md: "flex" }}
        flexDir="column"
        bg="rgba(255, 255, 255, 0.95)"
        w={{ base: "100%", md: "32%" }}
        h="100%"
        borderRadius="24px"
        style={{
          border: "1.5px solid rgba(212, 175, 55, 0.25)",
          boxShadow: "0 10px 40px rgba(15, 23, 42, 0.05), 0 0 20px rgba(212, 175, 55, 0.08)",
          backdropFilter: "blur(24px)"
        }}
        position="relative"
        overflow="hidden"
        zIndex={1}
      >
        {/* 1. Conversations Label & Filter CTA */}
        <Box px={4} pt={4} pb={2} d="flex" flexDir="column" gap={2.5} flexShrink={0}>
          <Box d="flex" alignItems="center" justifyContent="space-between">
            <Text fontWeight="900" fontSize="1.25rem" color="#0F172A" margin={0} letterSpacing="-0.02em" fontFamily="'Outfit', sans-serif">
              Conversations
            </Text>
            <Box d="flex" alignItems="center" gap={2}>
              <Tooltip label={chatFilter === 'friends' ? "Show All Chats" : "Filter 1-on-1 Friends"} hasArrow placement="top">
                <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                  <Button
                    onClick={() => setChatFilter(chatFilter === 'friends' ? 'all' : 'friends')}
                    size="sm"
                    style={{
                      background: chatFilter === 'friends' ? 'linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)' : 'rgba(212, 175, 55, 0.08)',
                      color: chatFilter === 'friends' ? '#FFFFFF' : '#D4AF37',
                      borderRadius: '99px',
                      padding: '0 12px',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      fontFamily: "'Outfit', sans-serif",
                      border: chatFilter === 'friends' ? 'none' : '1px solid rgba(212, 175, 55, 0.3)',
                      height: '36px',
                      minWidth: '36px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: chatFilter === 'friends' ? '0 4px 14px rgba(212, 175, 55, 0.35)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Users size={16} color={chatFilter === 'friends' ? '#FFFFFF' : '#D4AF37'} />
                    <span style={{ fontSize: '0.85rem' }}>Friends</span>
                  </Button>
                </motion.div>
              </Tooltip>
              <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={onOpen}
                  size="sm"
                  leftIcon={<AddIcon style={{ fontSize: "16px", color: "#D4AF37" }} />}
                  style={{
                    background: "rgba(212, 175, 55, 0.08)",
                    color: "#D4AF37",
                    borderRadius: "99px",
                    padding: "0 16px",
                    height: "36px",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    fontFamily: "'Outfit', sans-serif",
                    letterSpacing: "0.02em",
                    border: "1px solid rgba(212, 175, 55, 0.3)",
                    boxShadow: "0 4px 12px rgba(212, 175, 55, 0.1)",
                    WebkitTapHighlightColor: "transparent",
                    transition: "all 0.2s ease"
                  }}
                  _hover={{
                    background: "rgba(212, 175, 55, 0.15)",
                    borderColor: "#D4AF37"
                  }}
                >
                  New Group
                </Button>
              </motion.div>
            </Box>
          </Box>
        </Box>

        {/* 2. Conversations List */}
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

                // Sort chats so pinned ones stay at top and filter by chatFilter ('friends' vs 'all')
                const filteredList = uniqueChats.filter(c => {
                  if (chatFilter === 'friends') return !c.isGroupChat;
                  
                  const cId = String(c.id || c._id);
                  const isDeletedLocally = deletedChatIds.includes(cId);
                  
                  // For 'all' filter, hide locally deleted chats UNLESS there's a new message
                  if (isDeletedLocally) {
                    try {
                      const clearedChats = JSON.parse(localStorage.getItem("aura_cleared_chats") || "{}");
                      const clearedAt = clearedChats[cId] || 0;
                      const latestMsgTime = c.latestMessage ? new Date(c.latestMessage.createdAt || c.latestMessage.timestamp).getTime() : 0;
                      
                      // If a new message arrived AFTER it was cleared, it shouldn't be hidden
                      if (latestMsgTime > clearedAt) {
                         // Auto-restore it locally from deletedChatIds!
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
                  
                  return true;
                });

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

                  let unreadCount = isLatestMsgVisible ? unreadNotifs.length : 0;

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
                        onClick={() => {
                          dispatch(setSelectedChat(chat));
                          if (unreadCount > 0) {
                            dispatch(setNotification(notification.filter(n => {
                              const notifChatId = n.chat?.id || n.chat?._id || n.chatId;
                              return String(notifChatId) !== currentChatId;
                            })));
                          }
                        }}
                        cursor="pointer"
                        bg={isSelected ? "#F8FAFC" : unreadCount > 0 ? "rgba(245, 158, 11, 0.03)" : "#FFFFFF"}
                        px={4}
                        py={3}
                        borderRadius="20px"
                        position="relative"
                        style={{
                          border: isSelected ? "1.5px solid rgba(212, 175, 55, 0.5)" : unreadCount > 0 ? "1.5px solid rgba(245, 158, 11, 0.3)" : "1.5px solid transparent",
                          boxShadow: isSelected ? "0 10px 25px rgba(212, 175, 55, 0.15)" : "0 2px 10px rgba(15, 23, 42, 0.02)",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                        }}
                        _hover={{
                          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
                          bg: isSelected ? "#F8FAFC" : "#F8FAFC"
                        }}
                        d="flex"
                        alignItems="center"
                        gap="14px"
                      >
                        {/* Pinned indicator on the left side instead of border */}
                        {isPinned && (
                          <div style={{ position: "absolute", left: "0", top: "50%", transform: "translateY(-50%)", width: "4px", height: "40%", background: "#D4AF37", borderTopRightRadius: "4px", borderBottomRightRadius: "4px" }} />
                        )}

                        <div style={{ position: "relative" }}>
                          <Avatar
                            size="md"
                            name={senderName}
                            src={senderPic}
                            bg="linear-gradient(135deg, #0F172A 0%, #1E293B 100%)"
                            color="#FFFFFF"
                            fontWeight="700"
                            style={{ 
                              border: isSelected ? "2px solid #D4AF37" : "2px solid transparent",
                              boxShadow: "0 4px 10px rgba(0,0,0,0.08)"
                            }}
                          />
                          {!chat.isGroupChat && (
                            <span
                              style={{
                                position: "absolute",
                                bottom: "2px",
                                right: "2px",
                                width: "12px",
                                height: "12px",
                                backgroundColor: isTargetOnline ? "#10B981" : "#94A3B8",
                                borderRadius: "50%",
                                border: "2px solid #FFFFFF",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                              }}
                            />
                          )}
                        </div>

                        <Box flex="1" overflow="hidden">
                          <Box d="flex" justifyContent="space-between" alignItems="center">
                            <Box d="flex" alignItems="center" gap={1.5} flex="1" overflow="hidden">
                              <Text fontWeight={unreadCount > 0 ? "900" : "700"} fontSize="0.95rem" color="#0F172A" isTruncated style={{ letterSpacing: "-0.01em", fontFamily: "'Outfit', sans-serif" }}>
                                {senderName}
                              </Text>
                              {isPinned && (
                                <Tooltip label="Pinned Chat" hasArrow placement="top">
                                  <Badge bg="rgba(212, 175, 55, 0.15)" color="#D4AF37" borderRadius="6px" px={1.5} fontSize="0.65rem">📌</Badge>
                                </Tooltip>
                              )}
                              {isMuted && (
                                <Tooltip label="Muted" hasArrow placement="top">
                                  <Badge bg="rgba(100, 116, 139, 0.1)" color="#64748B" borderRadius="6px" px={1.5} fontSize="0.65rem">🔕</Badge>
                                </Tooltip>
                              )}
                            </Box>

                            <Box d="flex" alignItems="center" gap={1}>
                              {unreadCount > 0 && !isMuted && (
                                <motion.span
                                  animate={{ scale: [1, 1.15, 1] }}
                                  transition={{ duration: 1.2, repeat: Infinity }}
                                  style={{
                                    background: "linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)",
                                    color: "#FFFFFF",
                                    borderRadius: "99px",
                                    padding: "2px 8px",
                                    fontSize: "0.68rem",
                                    fontWeight: 800,
                                    boxShadow: "0 2px 8px rgba(212, 175, 55, 0.4)"
                                  }}
                                >
                                  {unreadCount} NEW
                                </motion.span>
                              )}
                              <Text fontSize="0.72rem" fontWeight="700" color={unreadCount > 0 ? "#D4AF37" : "#64748B"}>
                                {isLatestMsgVisible ? formatDateTime(chat.updatedAt || chat.latestMessage?.createdAt) : ""}
                              </Text>

                              {/* Ultra-Clean Luxurious Three Dots Menu */}
                              <Menu placement="bottom-end" isLazy strategy="fixed">
                                <MenuButton
                                  as={motion.button}
                                  type="button"
                                  whileHover={{ scale: 1.15 }}
                                  whileTap={{ scale: 0.88 }}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: "28px",
                                    height: "28px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    color: "#A1A1AA",
                                    transition: "color 0.2s ease",
                                    marginLeft: "2px"
                                  }}
                                >
                                  <MoreVertical size={16} />
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
                          <Text
                            fontSize="0.82rem"
                            color={unreadCount > 0 ? "#0F172A" : "#475569"}
                            fontWeight={unreadCount > 0 ? "700" : "500"}
                            isTruncated
                            mt={0.5}
                            style={{ fontStyle: chat.latestMessage?.content?.startsWith('[view-once]') ? 'italic' : 'normal' }}
                          >
                            {isLatestMsgVisible ? <DecryptedLatestMessage msg={chat.latestMessage} /> : "No messages yet"}
                          </Text>
                        </Box>
                      </Box>
                    </motion.div>
                    );
                  });
                })()
              ) : (
                <Box d="flex" flexDir="column" alignItems="center" justifyContent="center" py={12} px={4} textAlign="center">
                  <Sparkles size={32} color="#D4AF37" style={{ marginBottom: "12px", opacity: 0.8 }} />
                  <Text fontWeight="800" fontSize="1.05rem" color="#0F172A" mb={1} fontFamily="'Outfit', sans-serif">
                    No active conversations yet
                  </Text>
                  <Text fontSize="0.82rem" color="#64748B" maxW="240px" fontFamily="'Inter', sans-serif">
                    Search a user or create a group to start messaging!
                  </Text>
                </Box>
              )}

              {/* Subtle Security Encryption Badge */}
              {chats && chats.length > 0 && (
                <Box d="flex" alignItems="center" justifyContent="center" gap={1.5} py={6} opacity={0.75}>
                  <Lock size={12} color="#94A3B8" />
                  <Text fontSize="0.72rem" fontWeight="600" color="#94A3B8" letterSpacing="0.02em" fontFamily="'Inter', sans-serif">
                    End-to-end encrypted chats
                  </Text>
                </Box>
              )}
            </Stack>
        </Box>
      </Box>
    </>
  );
};

export default MyChat;
