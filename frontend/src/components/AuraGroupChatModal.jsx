import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Input,
  Box,
  Text,
  Avatar,
  Spinner
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Plus, Check, X, ShieldCheck, Sparkles } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { setChats, setSelectedChat } from '../redux/actions';
import { getSenderUser } from '../config/ChatsLogic';
import { getJwtToken } from '../config/getJwt';
import { stompService } from '../config/stompService';

const GROUP_ICON_PRESETS = ['🪐', '⚡', '🚀', '💎', '🔥', '✨', '☕', '🎮', '🌴', '👑', '🌌', '🦄'];

export default function AuraGroupChatModal({ isOpen, onClose, fetchAgain, setFetchAgain }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user) || JSON.parse(localStorage.getItem('userInfo') || '{}');
  const chats = useSelector((state) => state.chats) || [];

  const [groupName, setGroupName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🪐');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);

  // Extract all active 1-on-1 friends from active chat list
  const friendsList = useMemo(() => {
    const friendsMap = new Map();

    (chats || []).forEach((c) => {
      if (!c.isGroupChat && c.users && c.users.length > 0) {
        const friend = getSenderUser(user, c.users);
        if (friend) {
          const fId = String(friend._id || friend.id);
          const myId = String(user._id || user.id);
          if (fId && fId !== myId && !friendsMap.has(fId)) {
            friendsMap.set(fId, {
              _id: fId,
              id: fId,
              name: friend.name || friend.username || 'Friend',
              username: friend.username || (friend.email ? friend.email.split('@')[0] : 'friend'),
              pic: friend.pic || '',
              email: friend.email || ''
            });
          }
        }
      }
    });

    return Array.from(friendsMap.values());
  }, [chats, user]);

  // Live search across backend database if user searches
  useEffect(() => {
    if (!searchQuery || !searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const config = {
          headers: { Authorization: 'Bearer ' + getJwtToken() }
        };
        const { data } = await axios.get(`/api/user?search=${encodeURIComponent(searchQuery.trim())}`, config);
        const myId = String(user._id || user.id);
        const filtered = (data || []).filter((u) => String(u._id || u.id) !== myId);
        setSearchResults(filtered);
      } catch (err) {
        // fallback to local filtering
        const q = searchQuery.toLowerCase().trim();
        const localMatches = friendsList.filter(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            f.username.toLowerCase().includes(q) ||
            f.email.toLowerCase().includes(q)
        );
        setSearchResults(localMatches);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, friendsList, user]);

  // Display list: search results when typing, else active friends list
  const displayUsers = searchQuery.trim() ? searchResults : friendsList;

  const handleToggleUser = (u) => {
    const uId = String(u._id || u.id);
    if (selectedUsers.some((item) => String(item._id || item.id) === uId)) {
      setSelectedUsers((prev) => prev.filter((item) => String(item._id || item.id) !== uId));
    } else {
      setSelectedUsers((prev) => [...prev, u]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.warning('Please enter a Group Title');
      return;
    }

    if (selectedUsers.length < 2) {
      toast.warning('Please select at least 2 friends to form a group');
      return;
    }

    setLoading(true);
    try {
      const config = {
        headers: {
          'Content-type': 'application/json',
          Authorization: 'Bearer ' + getJwtToken()
        }
      };

      const finalName = `${selectedIcon} ${groupName.trim()}`;
      const userIds = selectedUsers.map((u) => u._id || u.id);

      const { data } = await axios.post(
        '/api/chat/group',
        {
          name: finalName,
          users: userIds
        },
        config
      );

      // Real-time broadcast creation over STOMP/Socket
      try {
        if (stompService && stompService.connected) {
          stompService.sendMessage(
            data.id || data._id,
            `[call] Group "${finalName}" launched with ${selectedUsers.length + 1} members`,
            `grp_create_${Date.now()}`
          );
        } else if (window.__auraSocket) {
          window.__auraSocket.emit('new message', {
            chat: data,
            sender: user,
            content: `Group "${finalName}" launched`
          });
        }
      } catch (e) {}

      dispatch(setChats([data, ...(chats || [])]));
      dispatch(setSelectedChat(data));
      if (setFetchAgain) setFetchAgain((prev) => !prev);

      toast.success(`🎉 Group "${finalName}" created successfully!`, {
        autoClose: 2000,
        hideProgressBar: true
      });

      setGroupName('');
      setSelectedUsers([]);
      setSearchQuery('');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay bg="rgba(10, 11, 20, 0.78)" backdropFilter="blur(20px)" />
      <ModalContent
        bg="#FFFFFF"
        borderRadius="30px"
        overflow="hidden"
        border="1.5px solid rgba(23, 24, 39, 0.08)"
        boxShadow="0 30px 90px rgba(0, 0, 0, 0.28)"
        fontFamily="'Plus Jakarta Sans', sans-serif"
      >
        <ModalHeader
          p={5}
          pb={3}
          borderBottom="1px solid #F1F5F9"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 6px 18px rgba(91, 95, 239, 0.35)'
              }}
            >
              <Users size={22} />
            </div>
            <div>
              <Text fontWeight="900" fontSize="1.1rem" color="#0F172A" m={0} letterSpacing="-0.02em">
                Create Group Space
              </Text>
              <Text fontSize="0.72rem" color="#64748B" fontWeight="600" m={0}>
                Direct add friends with instant live sync
              </Text>
            </div>
          </div>
          <ModalCloseButton position="static" borderRadius="50%" _hover={{ bg: '#F1F5F9' }} />
        </ModalHeader>

        <ModalBody p={5}>
          {/* Preset Icon Selector */}
          <Box mb={3.5}>
            <Text fontSize="0.74rem" fontWeight="800" color="#5B5FEF" textTransform="uppercase" letterSpacing="0.08em" mb={2}>
              ✦ Group Emblem
            </Text>
            <Box display="flex" gap={1.5} overflowX="auto" pb={1} sx={{ '::-webkit-scrollbar': { display: 'none' } }}>
              {GROUP_ICON_PRESETS.map((icon) => (
                <motion.button
                  key={icon}
                  type="button"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setSelectedIcon(icon)}
                  style={{
                    width: '38px',
                    height: '38px',
                    minWidth: '38px',
                    borderRadius: '12px',
                    border: selectedIcon === icon ? '2px solid #5B5FEF' : '1px solid #E2E8F0',
                    background: selectedIcon === icon ? 'rgba(91, 95, 239, 0.12)' : '#F8FAFC',
                    fontSize: '18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {icon}
                </motion.button>
              ))}
            </Box>
          </Box>

          {/* Group Title Input */}
          <Box mb={3.5}>
            <Text fontSize="0.74rem" fontWeight="800" color="#5B5FEF" textTransform="uppercase" letterSpacing="0.08em" mb={1.5}>
              ✦ Group Title
            </Text>
            <Input
              placeholder="e.g. Design Vanguard, Engineering Core"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              h="44px"
              borderRadius="14px"
              bg="#F8FAFC"
              border="1.5px solid #E2E8F0"
              fontSize="0.9rem"
              fontWeight="700"
              color="#0F172A"
              _focus={{ borderColor: '#5B5FEF', bg: '#FFFFFF', boxShadow: '0 0 0 3px rgba(91, 95, 239, 0.15)' }}
            />
          </Box>

          {/* Selected Member Chips with Count */}
          {selectedUsers.length > 0 && (
            <Box mb={3.5}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Text fontSize="0.74rem" fontWeight="800" color="#0F172A" m={0}>
                  Selected Members ({selectedUsers.length})
                </Text>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: selectedUsers.length >= 2 ? '#10B981' : '#F59E0B' }}>
                  {selectedUsers.length >= 2 ? '✓ Ready to create' : 'Add at least 2 friends'}
                </span>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={1.5} maxH="85px" overflowY="auto">
                <AnimatePresence>
                  {selectedUsers.map((u) => (
                    <motion.div
                      key={u._id || u.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                    >
                      <Box
                        bg="linear-gradient(135deg, rgba(91, 95, 239, 0.12) 0%, rgba(128, 103, 232, 0.08) 100%)"
                        border="1px solid rgba(91, 95, 239, 0.3)"
                        borderRadius="99px"
                        pl={1.5}
                        pr={2.5}
                        py={1}
                        display="flex"
                        alignItems="center"
                        gap={1.5}
                      >
                        <Avatar size="2xs" name={u.name} src={u.pic} />
                        <Text fontSize="0.75rem" fontWeight="800" color="#5B5FEF" m={0}>
                          {u.name}
                        </Text>
                        <button
                          type="button"
                          onClick={() => handleToggleUser(u)}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: '#5B5FEF',
                            display: 'flex',
                            alignItems: 'center',
                            padding: 0
                          }}
                        >
                          <X size={12} />
                        </button>
                      </Box>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Box>
            </Box>
          )}

          {/* Search Input for Direct Add */}
          <Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Text fontSize="0.74rem" fontWeight="800" color="#5B5FEF" textTransform="uppercase" letterSpacing="0.08em" m={0}>
                ✦ Direct Add Members ({displayUsers.length})
              </Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={13} color="#10B981" />
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#10B981' }}>Direct 1-Tap Add</span>
              </div>
            </Box>

            <Box position="relative" mb={2.5}>
              <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <Input
                placeholder="Search by name or @username to direct add..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                pl="36px"
                h="38px"
                borderRadius="12px"
                bg="#F8FAFC"
                border="1px solid #E2E8F0"
                fontSize="0.82rem"
                fontWeight="600"
              />
              {searching && (
                <Spinner size="xs" color="#5B5FEF" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              )}
            </Box>

            {/* Direct Member Selection Cards (NO 'Requested' Button!) */}
            <Box maxH="190px" overflowY="auto" display="flex" flexDirection="column" gap={1.5} pr={1}>
              {displayUsers.length > 0 ? (
                displayUsers.map((itemUser) => {
                  const isSelected = selectedUsers.some((u) => String(u._id || u.id) === String(itemUser._id || itemUser.id));
                  return (
                    <motion.div
                      key={itemUser._id || itemUser.id}
                      whileHover={{ scale: 1.01, x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleToggleUser(itemUser)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 14px',
                        borderRadius: '16px',
                        background: isSelected ? 'rgba(91, 95, 239, 0.08)' : '#F8FAFC',
                        border: isSelected ? '1.5px solid #5B5FEF' : '1px solid rgba(226, 232, 240, 0.8)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Avatar size="sm" name={itemUser.name} src={itemUser.pic} style={{ border: '1.5px solid #FFFFFF' }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0F172A' }}>
                            {itemUser.name}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
                            @{itemUser.username || (itemUser.email ? itemUser.email.split('@')[0] : 'user')}
                          </span>
                        </div>
                      </div>

                      {/* Direct Add Toggle Badge */}
                      <div
                        style={{
                          padding: isSelected ? '4px 10px' : '4px 10px',
                          borderRadius: '99px',
                          background: isSelected ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : '#FFFFFF',
                          border: isSelected ? 'none' : '1.5px solid #CBD5E1',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: isSelected ? '#FFFFFF' : '#64748B',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          boxShadow: isSelected ? '0 2px 8px rgba(16, 185, 129, 0.35)' : 'none'
                        }}
                      >
                        {isSelected ? (
                          <>
                            <Check size={12} strokeWidth={3} />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus size={12} strokeWidth={2.5} color="#5B5FEF" />
                            <span style={{ color: '#5B5FEF' }}>Direct Add</span>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <Box py={4} textAlign="center">
                  <Text fontSize="0.82rem" color="#94A3B8" fontWeight="600" m={0}>
                    {searchQuery.trim() ? 'No users matching search' : 'No friends found. Type to search any user!'}
                  </Text>
                </Box>
              )}
            </Box>
          </Box>
        </ModalBody>

        <ModalFooter p={4} bg="#F8FAFC" borderTop="1px solid #F1F5F9" display="flex" gap={2}>
          <Button
            variant="ghost"
            onClick={onClose}
            borderRadius="99px"
            fontWeight="700"
            fontSize="0.85rem"
            color="#64748B"
          >
            Cancel
          </Button>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ flex: 1 }}>
            <Button
              w="100%"
              onClick={handleCreateGroup}
              isLoading={loading}
              disabled={!groupName.trim() || selectedUsers.length < 2}
              style={{
                background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                color: '#FFFFFF',
                borderRadius: '99px',
                fontWeight: 800,
                fontSize: '0.88rem',
                height: '42px',
                boxShadow: '0 8px 24px rgba(91, 95, 239, 0.35)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              🚀 Launch Group Space ({selectedUsers.length + 1} Members)
            </Button>
          </motion.div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
