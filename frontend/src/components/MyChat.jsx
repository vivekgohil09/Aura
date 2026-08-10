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
import { Avatar, Tooltip, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, FormControl, Input, Progress, Spinner, Menu, MenuButton, MenuList, MenuItem, MenuDivider, Badge } from '@chakra-ui/react';
import AddIcon from '@mui/icons-material/Add';
import { Search, MoreVertical, Trash2, Pin, VolumeX, Sparkles, Lock, ShieldCheck, Users } from 'lucide-react';
import UserListItem from './UserListItem';
import UserBadgeItem from './UserBadgeItem';
import axios from 'axios';

const MyChat = ({ fetchAgain, setFetchAgain }) => {
  const history = useHistory();
  const dispatch = useDispatch();

  const [loggedUser, setLoggedUser] = useState();
  const user = useSelector(state => state.user);
  const selectedChat = useSelector(state => state.selectedChats);
  const chats = useSelector(state => state.chats);
  const notification = useSelector(state => state.notification) || [];
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
    if (!Array.isArray(chatList)) return [];
    try {
      const deletedIds = JSON.parse(localStorage.getItem("aura_deleted_chats") || "[]");
      return chatList.filter(c => !deletedIds.includes(String(c.id || c._id)));
    } catch (e) {
      return chatList;
    }
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

    const updatedChats = (chats || []).filter(c => String(c.id || c._id) !== targetId);
    dispatch(setChats(updatedChats));

    const activeChatId = String(selectedChat?.id || selectedChat?._id);
    if (activeChatId === targetId) {
      dispatch(delSelectedChat());
    }

    try {
      const config = { headers: { Authorization: "Bearer " + getJwtToken() } };
      await axios.delete(`/api/chat/${targetId}`, config);
    } catch (err) {}

    toast.success("Chat deleted!", {
      position: "top-right",
      autoClose: 3000,
      closeOnClick: true,
      theme: "colored"
    });
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
      } catch (e) { }
    };

    setLoggedUser(JSON.parse(localStorage.getItem("userInfo") || "{}"));
    fetchChats();
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
        <Box px={4} pt={4} pb={2} d="flex" flexDir="column" gap={2.5}>
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
                      height: '34px',
                      minWidth: '34px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: chatFilter === 'friends' ? '0 4px 14px rgba(212, 175, 55, 0.35)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Users size={15} color={chatFilter === 'friends' ? '#FFFFFF' : '#D4AF37'} />
                    <span>Friends</span>
                  </Button>
                </motion.div>
              </Tooltip>
              <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={onOpen}
                  size="sm"
                  leftIcon={<AddIcon style={{ fontSize: "14px", color: "#D4AF37" }} />}
                  style={{
                    background: "rgba(212, 175, 55, 0.08)",
                    color: "#D4AF37",
                    borderRadius: "99px",
                    padding: "6px 14px",
                    fontWeight: 800,
                    fontSize: "0.82rem",
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
                  const isTargetOnline = targetUser ? Boolean(targetUser.isOnline || targetUser.online) : false;

                  const unreadNotifs = notification.filter(n => {
                    const notifChatId = n.chat?.id || n.chat?._id || n.chatId;
                    return String(notifChatId) === currentChatId;
                  });

                  let unreadCount = unreadNotifs.length;

                  const formatLatestMessage = (msg) => {
                    if (!msg || !msg.content) return 'No messages yet';
                    let content = msg.content;
                    if (content.startsWith('[gz]')) {
                      // Attempt synchronous inline base64 decode check or fallback label
                      try {
                        const raw = atob(content.substring(4));
                        if (raw.includes('[enc]')) {
                          content = raw.split(':')[1] ? atob(raw.split(':')[1]) : '💬 Message';
                        } else {
                          content = raw;
                        }
                      } catch {
                        content = '💬 Message';
                      }
                    } else if (content.startsWith('[enc]')) {
                      try {
                        const parts = content.substring(5).split(':');
                        if (parts[1]) content = atob(parts[1]);
                      } catch {
                        content = '🔒 Encrypted message';
                      }
                    }
                    if (content.startsWith('[view-once]')) return '👁 View-once message';
                    if (content.startsWith('data:video')) return '🎥 Video message';
                    if (content.startsWith('data:image')) return '📷 Photo message';
                    if (content.startsWith('data:audio')) return '🎙 Voice message';
                    return content;
                  };

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
                      whileHover={{ scale: 1.01, x: 3 }}
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
                        bg={isSelected ? "linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(245, 158, 11, 0.04) 100%)" : unreadCount > 0 ? "#FFFCF5" : "#FFFFFF"}
                        px={3}
                        py={2.5}
                        borderRadius="16px"
                        style={{
                          border: isSelected ? "1px solid rgba(212, 175, 55, 0.4)" : "1px solid rgba(226, 232, 240, 0.7)",
                          borderLeft: isPinned ? "4px solid #D4AF37" : isSelected ? "4px solid #0F172A" : unreadCount > 0 ? "4px solid #F59E0B" : "1px solid rgba(226, 232, 240, 0.7)",
                          boxShadow: isSelected ? "0 8px 24px rgba(212, 175, 55, 0.18)" : "0 2px 8px rgba(15, 23, 42, 0.03)",
                          transition: "all 0.2s ease"
                        }}
                        d="flex"
                        alignItems="center"
                        gap="12px"
                      >
                        <div style={{ position: "relative" }}>
                          <Avatar
                            size="md"
                            name={senderName}
                            src={senderPic}
                            bg="#F1F5F9"
                            color="#0F172A"
                            fontWeight="800"
                            style={{ border: isSelected ? "2px solid #D4AF37" : "2px solid #E2E8F0" }}
                          />
                          {!chat.isGroupChat && (
                            <span
                              style={{
                                position: "absolute",
                                bottom: "1px",
                                right: "1px",
                                width: "10px",
                                height: "10px",
                                backgroundColor: isTargetOnline ? "#10B981" : "#9CA3AF",
                                borderRadius: "50%",
                                border: "2px solid #FFFFFF"
                              }}
                            />
                          )}
                        </div>

                        <Box flex="1" overflow="hidden">
                          <Box d="flex" justifyContent="space-between" alignItems="center">
                            <Box d="flex" alignItems="center" gap={1.5} flex="1" overflow="hidden">
                              <Text fontWeight={unreadCount > 0 ? "900" : "800"} fontSize="sm" color="#0F172A" isTruncated style={{ letterSpacing: "-0.01em", fontFamily: "'Outfit', sans-serif" }}>
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
                              <Text fontSize="xs" fontWeight="600" color={unreadCount > 0 ? "#D4AF37" : "#94A3B8"}>
                                {formatDateTime(chat.updatedAt || chat.latestMessage?.createdAt)}
                              </Text>

                              {/* Ultra-Clean Luxurious Three Dots Menu */}
                              <Menu placement="bottom-end" isLazy>
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
                                <MenuList
                                  bg="rgba(255, 255, 255, 0.96)"
                                  backdropFilter="blur(20px)"
                                  borderRadius="16px"
                                  p={1.5}
                                  minW="170px"
                                  style={{
                                    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(0,0,0,0.03)",
                                    border: "1px solid rgba(226, 232, 240, 0.8)",
                                    zIndex: 9999
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MenuItem
                                    onClick={(e) => handleTogglePin(e, currentChatId)}
                                    borderRadius="10px"
                                    fontSize="0.82rem"
                                    fontWeight="600"
                                    color="#18181B"
                                    py={2}
                                    _hover={{ bg: "rgba(37, 99, 235, 0.06)", color: "#2563EB" }}
                                  >
                                    <Pin size={15} style={{ marginRight: "10px" }} />
                                    {isPinned ? "Unpin Chat" : "Pin Chat"}
                                  </MenuItem>

                                  <MenuItem
                                    onClick={(e) => handleToggleMute(e, currentChatId)}
                                    borderRadius="10px"
                                    fontSize="0.82rem"
                                    fontWeight="600"
                                    color="#18181B"
                                    py={2}
                                    _hover={{ bg: "rgba(113, 113, 122, 0.08)" }}
                                  >
                                    <VolumeX size={15} style={{ marginRight: "10px" }} />
                                    {isMuted ? "Unmute" : "Mute Notifications"}
                                  </MenuItem>

                                  <MenuDivider my={1} borderColor="rgba(226, 232, 240, 0.8)" />

                                  <MenuItem
                                    onClick={(e) => handleDeleteChat(e, chat)}
                                    borderRadius="10px"
                                    fontSize="0.82rem"
                                    fontWeight="700"
                                    color="#EF4444"
                                    py={2}
                                    _hover={{ bg: "rgba(239, 68, 68, 0.08)", color: "#DC2626" }}
                                  >
                                    <Trash2 size={15} style={{ marginRight: "10px" }} />
                                    Delete Chat
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            </Box>
                          </Box>
                          <Text
                            fontSize="xs"
                            fontWeight={unreadCount > 0 ? "700" : "400"}
                            color={unreadCount > 0 ? "#E63946" : "#71717A"}
                            isTruncated
                            mt={0.5}
                            style={{ fontStyle: chat.latestMessage?.content?.startsWith('[view-once]') ? 'italic' : 'normal' }}
                          >
                            {formatLatestMessage(chat.latestMessage)}
                          </Text>
                        </Box>
                      </Box>
                    </motion.div>
                  );
                });
              })()}
            </Stack>
          ) : (
            <Box d="flex" flexDir="column" alignItems="center" justifyContent="center" h="70%" p={4} textAlign="center">
              <Text fontWeight="800" fontSize="sm" color="#0F172A" mb={1} fontFamily="'Outfit', sans-serif">No active conversations yet</Text>
              <Text fontSize="xs" color="#94A3B8" fontFamily="'Inter', sans-serif">Search a user or create a group to start messaging!</Text>
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
};

export default MyChat;
