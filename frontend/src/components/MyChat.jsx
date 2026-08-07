import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory, Link } from 'react-router-dom';
import { getJwtToken, handleAuthError } from '../config/getJwt';
import { setChats, setSelectedChat, logout } from '../redux/actions';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Box, Text, Stack } from "@chakra-ui/layout";
import { Button } from "@chakra-ui/button";
import ChatLoading from "./ChatLoading";
import { getSender, getPicture, getSenderUser } from '../config/ChatsLogic';
import { Avatar, Tooltip, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, FormControl, Input, Progress, Spinner } from '@chakra-ui/react';
import AddIcon from '@mui/icons-material/Add';
import { Search } from 'lucide-react';
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

  useEffect(() => {
    const fetchChatsBackground = async () => {
      try {
        const config = {
          headers: {
            Authorization: "Bearer " + getJwtToken(),
          },
        };
        const { data } = await axios.get(`/api/chat`, config);
        dispatch(setChats(data));
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
      if (!existingChats.find((c) => (c.id || c._id) === dataChatId)) {
        dispatch(setChats([data, ...existingChats]));
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
      dispatch(setChats(data));
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
        {loadingTwo && <Progress size='xs' isIndeterminate colorScheme="red" />}
        <ModalOverlay style={{ backdropFilter: "blur(6px)" }} />
        <ModalContent style={{ background: "#FFFFFF", color: "#18181B", borderRadius: "24px", boxShadow: "0 25px 60px rgba(0,0,0,0.15)" }}>
          <ModalHeader style={{ borderBottom: "1px solid #F1F1F4" }}>
            <Text fontWeight="800" fontSize="1.3rem" color="#18181B" margin={0}>Create Group Chat</Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody d="flex" flexDir="column" py={4}>
            <FormControl>
              <Input
                placeholder="Group Name (e.g. Design Team)"
                mb={3}
                value={groupChatName}
                onChange={(e) => setGroupChatName(e.target.value)}
                borderRadius="12px"
                bg="#F4F4F5"
                border="none"
              />
            </FormControl>
            <FormControl>
              <Input
                placeholder="Add Users (e.g. Vicky, Ram)"
                mb={2}
                onChange={(e) => handleSearch(e.target.value)}
                borderRadius="12px"
                bg="#F4F4F5"
                border="none"
              />
            </FormControl>
            <Box w="100%" d="flex" flexWrap="wrap" gap={1.5} mb={3}>
              {selectedUsers.map((u) => (
                <UserBadgeItem key={u.id || u._id} user={u} handleFunction={() => handleDelete(u)} />
              ))}
            </Box>
            {loadingGroupUsers ? <Spinner size="sm" color="red.500" /> : (
              searchResult?.slice(0, 4).map((u) => (
                <UserListItem key={u.id || u._id} user={u} handleFunction={() => handleGroup(u)} />
              ))
            )}
          </ModalBody>
          <ModalFooter>
            <Button bg="linear-gradient(135deg, #E63946, #d62839)" color="#FFF" borderRadius="12px" onClick={handleSubmit} _hover={{ opacity: 0.9 }}>
              Create Group
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── LEFT SIDEBAR PANEL ── */}
      <Box
        d={{ base: selectedChat ? "none" : "flex", md: "flex" }}
        flexDir="column"
        bg="#FFFFFF"
        w={{ base: "100%", md: "32%" }}
        h="100%"
        borderRadius="24px"
        style={{ border: "1px solid #F1F1F4", boxShadow: "0 6px 24px rgba(0, 0, 0, 0.04)" }}
        position="relative"
        overflow="hidden"
        zIndex={1}
      >
        {/* 1. Conversations Label & Group CTA */}
        <Box px={4} pt={4} pb={2} d="flex" alignItems="center" justifyContent="space-between">
          <Text fontWeight="800" fontSize="1.1rem" color="#18181B" margin={0} letterSpacing="-0.02em">
            Conversations
          </Text>
          <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onOpen}
              size="sm"
              leftIcon={<AddIcon style={{ fontSize: "14px", color: "#E63946" }} />}
              style={{
                background: "rgba(230, 57, 70, 0.06)",
                color: "#E63946",
                borderRadius: "99px",
                padding: "6px 16px",
                fontWeight: 800,
                fontSize: "0.82rem",
                fontFamily: "'Outfit', sans-serif",
                letterSpacing: "0.02em",
                boxShadow: "0 4px 12px rgba(230, 57, 70, 0.08)",
                border: "1px solid rgba(230, 57, 70, 0.18)",
                height: "34px",
                cursor: "pointer",
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
                transition: "all 0.2s ease"
              }}
              _hover={{
                background: "rgba(230, 57, 70, 0.12)",
                borderColor: "#E63946"
              }}
            >
              New Group
            </Button>
          </motion.div>
        </Box>

        {/* 2. Conversations List */}
        <Box flex="1" overflowY="auto" px={3} py={1}>
          {loading && (!chats || chats.length === 0) ? (
            <ChatLoading />
          ) : chats && chats.length > 0 ? (
            <Stack spacing={1.5}>
              {chats.map((chat, index) => {
                const currentChatId = chat.id || chat._id;
                const activeChatId = selectedChat?.id || selectedChat?._id;
                const isSelected = activeChatId === currentChatId;
                const senderName = !chat.isGroupChat ? getSender(user, chat.users) : chat.chatName;
                const senderPic = !chat.isGroupChat ? getPicture(user, chat.users) : "";
                const targetUser = !chat.isGroupChat ? getSenderUser(user, chat.users) : null;
                const isTargetOnline = targetUser ? Boolean(targetUser.isOnline || targetUser.online) : false;

                const unreadNotifs = notification.filter(n => {
                  const notifChatId = n.chat?.id || n.chat?._id || n.chatId;
                  return String(notifChatId) === String(currentChatId);
                });

                let unreadCount = unreadNotifs.length;
                if (unreadCount === 0 && !isSelected && chat.latestMessage) {
                  const latestSenderId = chat.latestMessage.sender?.id || chat.latestMessage.sender?._id;
                  const currentUserId = user?.id || user?._id || loggedUser?.id || loggedUser?._id;
                  if (latestSenderId && currentUserId && String(latestSenderId) !== String(currentUserId)) {
                    unreadCount = 1;
                  }
                }

                const formatLatestMessage = (msg) => {
                  if (!msg || !msg.content) return 'No messages yet';
                  if (msg.content.startsWith('[view-once]')) return '👁 View-once message';
                  if (msg.content.startsWith('data:video')) return '🎥 Video message';
                  return msg.content;
                };

                const formatDateTime = (dateStr) => {
                  if (!dateStr) return 'Now';
                  const d = new Date(dateStr);
                  if (isNaN(d.getTime())) return 'Now';
                  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const now = new Date();
                  const isToday = d.toDateString() === now.toDateString();
                  if (isToday) {
                    return timeStr;
                  }
                  const dateStrFormatted = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                  return `${dateStrFormatted}, ${timeStr}`;
                };

                return (
                  <motion.div
                    key={chat.id || chat._id || `chat-${index}`}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    whileHover={{ scale: 1.02, x: 3 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 24,
                      delay: Math.min(index * 0.03, 0.2)
                    }}
                  >
                    <Box
                      onClick={() => {
                        dispatch(setSelectedChat(chat));
                        if (unreadCount > 0) {
                          dispatch(setNotification(notification.filter(n => {
                            const notifChatId = n.chat?.id || n.chat?._id || n.chatId;
                            return String(notifChatId) !== String(currentChatId);
                          })));
                        }
                      }}
                      cursor="pointer"
                      bg={isSelected ? "linear-gradient(135deg, rgba(230, 57, 70, 0.08) 0%, rgba(230, 57, 70, 0.03) 100%)" : unreadCount > 0 ? "#FFF8F8" : "#FFFFFF"}
                      px={3}
                      py={2.5}
                      borderRadius="16px"
                      style={{
                        border: isSelected ? "1px solid rgba(230, 57, 70, 0.2)" : "1px solid rgba(0, 0, 0, 0.03)",
                        borderLeft: isSelected ? "4px solid #E63946" : unreadCount > 0 ? "4px solid #F59E0B" : "1px solid rgba(0, 0, 0, 0.03)",
                        boxShadow: isSelected ? "0 8px 20px rgba(230, 57, 70, 0.12)" : "0 2px 8px rgba(0, 0, 0, 0.02)",
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
                          bg="#FFE3E6"
                          color="#E63946"
                          fontWeight="700"
                          style={{ border: isSelected ? "2px solid #E63946" : "2px solid #FFE3E6" }}
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
                          <Text fontWeight={unreadCount > 0 ? "800" : "700"} fontSize="sm" color="#18181B" isTruncated style={{ letterSpacing: "-0.01em" }}>
                            {senderName}
                          </Text>
                          <Box d="flex" alignItems="center" gap={1.5}>
                            {unreadCount > 0 && (
                              <motion.span
                                animate={{ scale: [1, 1.15, 1] }}
                                transition={{ duration: 1.2, repeat: Infinity }}
                                style={{
                                  background: "linear-gradient(135deg, #E63946 0%, #d62839 100%)",
                                  color: "#FFFFFF",
                                  borderRadius: "99px",
                                  padding: "2px 8px",
                                  fontSize: "0.68rem",
                                  fontWeight: 800,
                                  boxShadow: "0 2px 8px rgba(230, 57, 70, 0.4)"
                                }}
                              >
                                {unreadCount} NEW
                              </motion.span>
                            )}
                            <Text fontSize="xs" fontWeight="500" color={unreadCount > 0 ? "#E63946" : "#A1A1AA"}>
                              {formatDateTime(chat.updatedAt || chat.latestMessage?.createdAt)}
                            </Text>
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
              })}
            </Stack>
          ) : (
            <Box d="flex" flexDir="column" alignItems="center" justifyContent="center" h="70%" opacity={0.6} p={4} textAlign="center">
              <Text fontWeight="700" fontSize="sm" color="#18181B" mb={1}>No active conversations yet</Text>
              <Text fontSize="xs" color="#71717A">Search a user or create a group to start messaging!</Text>
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
};

export default MyChat;
