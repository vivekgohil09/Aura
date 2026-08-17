import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Button,
  Input,
  Box,
  Text,
  Avatar,
  Spinner,
  Badge
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Plus,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Crown,
  Flame,
  Zap,
  Rocket,
  Layers,
  CheckCircle2,
  Lock
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { setChats, setSelectedChat } from '../redux/actions';
import { getSenderUser } from '../config/ChatsLogic';
import { getJwtToken } from '../config/getJwt';
import { stompService } from '../config/stompService';

const EMBLEM_PRESETS = [
  { icon: '🪐', name: 'Orbit', bg: 'linear-gradient(135deg, #6366F1, #8B5CF6)' },
  { icon: '⚡', name: 'Spark', bg: 'linear-gradient(135deg, #F59E0B, #EF4444)' },
  { icon: '🚀', name: 'Vanguard', bg: 'linear-gradient(135deg, #3B82F6, #6366F1)' },
  { icon: '💎', name: 'Diamond', bg: 'linear-gradient(135deg, #06B6D4, #3B82F6)' },
  { icon: '🔥', name: 'Phoenix', bg: 'linear-gradient(135deg, #EF4444, #F97316)' },
  { icon: '👑', name: 'Royal', bg: 'linear-gradient(135deg, #F59E0B, #D97706)' },
  { icon: '✨', name: 'Aura', bg: 'linear-gradient(135deg, #EC4899, #8B5CF6)' },
  { icon: '🎮', name: 'Arcade', bg: 'linear-gradient(135deg, #8B5CF6, #EC4899)' },
  { icon: '☕', name: 'Lounge', bg: 'linear-gradient(135deg, #10B981, #059669)' },
  { icon: '🌴', name: 'Oasis', bg: 'linear-gradient(135deg, #14B8A6, #0D9488)' }
];

const SUGGESTED_TITLES = ['⚡ Core Vanguard', '🎨 Design Guild', '🚀 Growth Matrix', '☕ Chill Orbit'];

export default function AuraGroupChatModal({ isOpen, onClose, fetchAgain, setFetchAgain }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user) || JSON.parse(localStorage.getItem('userInfo') || '{}');
  const chats = useSelector((state) => state.chats) || [];
  const userStatuses = useSelector((state) => state.userStatuses) || {};

  const [groupName, setGroupName] = useState('');
  const [selectedEmblem, setSelectedEmblem] = useState(EMBLEM_PRESETS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);

  // Extract all active 1-on-1 friends
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

  // Live query
  useEffect(() => {
    if (!searchQuery || !searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const config = { headers: { Authorization: 'Bearer ' + getJwtToken() } };
        const { data } = await axios.get(`/api/user?search=${encodeURIComponent(searchQuery.trim())}`, config);
        const myId = String(user._id || user.id);
        const filtered = (data || []).filter((u) => String(u._id || u.id) !== myId);
        setSearchResults(filtered);
      } catch (err) {
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
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, friendsList, user]);

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

      const finalName = `${selectedEmblem.icon} ${groupName.trim()}`;
      const userIds = selectedUsers.map((u) => u._id || u.id);

      const { data } = await axios.post(
        '/api/chat/group',
        {
          name: finalName,
          users: userIds
        },
        config
      );

      // Real-time broadcast
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

      toast.success(`🎉 Group "${finalName}" launched!`, {
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

  const isReady = groupName.trim().length > 0 && selectedUsers.length >= 2;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay bg="rgba(11, 15, 25, 0.72)" backdropFilter="blur(24px)" />
      <ModalContent
        bg="linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)"
        borderRadius="36px"
        overflow="hidden"
        border="1px solid rgba(255, 255, 255, 0.8)"
        boxShadow="0 40px 100px -20px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(91, 95, 239, 0.1)"
        fontFamily="'Plus Jakarta Sans', sans-serif"
        maxW="480px"
        p={0}
      >
        {/* Animated Specular Ambient Aura Bar */}
        <div
          style={{
            height: '6px',
            width: '100%',
            background: 'linear-gradient(90deg, #5B5FEF 0%, #EC4899 35%, #8B5CF6 70%, #3B82F6 100%)',
            backgroundSize: '200% 100%',
            animation: 'auraGradient 4s ease infinite'
          }}
        />

        <ModalBody p={{ base: 5, sm: 6 }}>
          {/* Header Bar with Glass Pill & Close */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <motion.div
                whileHover={{ rotate: 15, scale: 1.08 }}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #5B5FEF 0%, #8B5CF6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  boxShadow: '0 8px 20px rgba(91, 95, 239, 0.35)'
                }}
              >
                <Users size={24} strokeWidth={2.2} />
              </motion.div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Text fontWeight="900" fontSize="1.2rem" color="#0F172A" m={0} letterSpacing="-0.025em">
                    Create Group Orbit
                  </Text>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(91, 95, 239, 0.1)', color: '#5B5FEF', padding: '2px 8px', borderRadius: '99px' }}>
                    PRO
                  </span>
                </div>
                <Text fontSize="0.75rem" color="#64748B" fontWeight="600" m={0}>
                  Encrypted multi-peer collaborative space
                </Text>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                background: '#FFFFFF',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
              }}
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </Box>

          {/* 🌟 1. Interactive Live Group Preview Card */}
          <Box
            mb={4}
            p={4}
            borderRadius="24px"
            bg="linear-gradient(135deg, rgba(91, 95, 239, 0.06) 0%, rgba(139, 92, 246, 0.08) 100%)"
            border="1.5px solid rgba(91, 95, 239, 0.18)"
            boxShadow="inset 0 2px 10px rgba(91, 95, 239, 0.05)"
            position="relative"
            overflow="hidden"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <motion.div
                key={selectedEmblem.icon}
                initial={{ scale: 0.7, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: '20px',
                  background: selectedEmblem.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  boxShadow: '0 8px 24px rgba(91, 95, 239, 0.35)',
                  flexShrink: 0
                }}
              >
                {selectedEmblem.icon}
              </motion.div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <Text
                  fontWeight="900"
                  fontSize="1.05rem"
                  color="#0F172A"
                  m={0}
                  letterSpacing="-0.02em"
                  isTruncated
                >
                  {groupName.trim() ? `${selectedEmblem.icon} ${groupName.trim()}` : 'Untitled Group Space'}
                </Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#5B5FEF' }}>
                    👥 {selectedUsers.length + 1} Orbiters
                  </span>
                  <span style={{ color: '#CBD5E1', fontSize: '0.7rem' }}>•</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#10B981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Lock size={10} /> End-to-End Encrypted
                  </span>
                </div>
              </div>
            </div>

            {/* Emblem Selector Carousel */}
            <Box mt={3.5}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#5B5FEF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Choose Emblem
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B' }}>
                  {selectedEmblem.name}
                </span>
              </div>
              <Box display="flex" gap={2} overflowX="auto" pb={1} sx={{ '::-webkit-scrollbar': { display: 'none' } }}>
                {EMBLEM_PRESETS.map((emb) => {
                  const isActive = selectedEmblem.icon === emb.icon;
                  return (
                    <motion.button
                      key={emb.icon}
                      type="button"
                      whileHover={{ scale: 1.15, y: -2 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setSelectedEmblem(emb)}
                      style={{
                        width: '38px',
                        height: '38px',
                        minWidth: '38px',
                        borderRadius: '13px',
                        border: isActive ? '2px solid #5B5FEF' : '1px solid rgba(226, 232, 240, 0.9)',
                        background: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                        fontSize: '18px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isActive ? '0 4px 14px rgba(91, 95, 239, 0.3)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {emb.icon}
                    </motion.button>
                  );
                })}
              </Box>
            </Box>
          </Box>

          {/* 🌟 2. Group Title Input & Quick Suggestions */}
          <Box mb={4}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Group Space Title
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: groupName.length > 0 ? '#5B5FEF' : '#94A3B8' }}>
                {groupName.length}/35
              </span>
            </div>

            <Input
              placeholder="e.g. Design Vanguard, Aura Core Circle"
              value={groupName}
              maxLength={35}
              onChange={(e) => setGroupName(e.target.value)}
              h="46px"
              borderRadius="16px"
              bg="#FFFFFF"
              border="1.5px solid #E2E8F0"
              fontSize="0.92rem"
              fontWeight="700"
              color="#0F172A"
              _focus={{
                borderColor: '#5B5FEF',
                boxShadow: '0 0 0 3.5px rgba(91, 95, 239, 0.18)'
              }}
            />

            {/* Quick Suggestions Chips */}
            <Box display="flex" gap={1.5} mt={2} flexWrap="wrap">
              {SUGGESTED_TITLES.map((title) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => {
                    const clean = title.replace(/^[^s]+s/, '');
                    setGroupName(clean);
                  }}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    borderRadius: '99px',
                    padding: '3px 10px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: '#64748B',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {title}
                </button>
              ))}
            </Box>
          </Box>

          {/* 🌟 3. Selected Members Animated Orbit Dock */}
          <Box mb={4}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Orbit Members
                </span>
                <Badge
                  borderRadius="99px"
                  px={2}
                  py={0.5}
                  fontSize="0.68rem"
                  fontWeight="800"
                  bg={selectedUsers.length >= 2 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)'}
                  color={selectedUsers.length >= 2 ? '#059669' : '#D97706'}
                >
                  {selectedUsers.length >= 2 ? `✓ ${selectedUsers.length} Selected` : `${selectedUsers.length}/2 Required`}
                </Badge>
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B' }}>
                1-Tap to Toggle
              </span>
            </div>

            {selectedUsers.length > 0 ? (
              <Box
                p={2}
                borderRadius="18px"
                bg="#FFFFFF"
                border="1px solid rgba(226, 232, 240, 0.9)"
                display="flex"
                flexWrap="wrap"
                gap={2}
                maxH="88px"
                overflowY="auto"
              >
                <AnimatePresence>
                  {selectedUsers.map((u) => (
                    <motion.div
                      key={u._id || u.id}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.7, opacity: 0 }}
                      whileHover={{ scale: 1.04 }}
                    >
                      <Box
                        bg="linear-gradient(135deg, rgba(91, 95, 239, 0.1) 0%, rgba(139, 92, 246, 0.06) 100%)"
                        border="1.5px solid rgba(91, 95, 239, 0.3)"
                        borderRadius="99px"
                        pl={1.5}
                        pr={2.5}
                        py={1}
                        display="flex"
                        alignItems="center"
                        gap={1.5}
                        boxShadow="0 2px 8px rgba(91, 95, 239, 0.12)"
                      >
                        <Avatar size="2xs" name={u.name} src={u.pic} style={{ border: '1px solid #5B5FEF' }} />
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
                          <X size={12} strokeWidth={3} />
                        </button>
                      </Box>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Box>
            ) : (
              <Box
                p={3}
                borderRadius="18px"
                bg="#FFFFFF"
                border="1px dashed #CBD5E1"
                textAlign="center"
              >
                <Text fontSize="0.74rem" color="#94A3B8" fontWeight="600" m={0}>
                  ✨ Tap friends below to direct add them to this orbit space
                </Text>
              </Box>
            )}
          </Box>

          {/* 🌟 4. Direct 1-Tap Add User Discovery List */}
          <Box>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Direct Add Orbiters ({displayUsers.length})
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={13} color="#10B981" />
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#10B981' }}>Instant 1-Tap Sync</span>
              </div>
            </div>

            {/* Glowing Search Bar */}
            <Box position="relative" mb={2.5}>
              <Search
                size={16}
                color="#94A3B8"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <Input
                placeholder="Search friends or type @username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                pl="38px"
                h="42px"
                borderRadius="14px"
                bg="#FFFFFF"
                border="1px solid #E2E8F0"
                fontSize="0.84rem"
                fontWeight="600"
                _focus={{
                  borderColor: '#5B5FEF',
                  boxShadow: '0 0 0 3px rgba(91, 95, 239, 0.15)'
                }}
              />
              {searching && (
                <Spinner size="xs" color="#5B5FEF" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              )}
            </Box>

            {/* User Cards */}
            <Box maxH="175px" overflowY="auto" display="flex" flexDirection="column" gap={2} pr={1}>
              {displayUsers.length > 0 ? (
                displayUsers.map((itemUser) => {
                  const uId = String(itemUser._id || itemUser.id);
                  const isSelected = selectedUsers.some((u) => String(u._id || u.id) === uId);
                  const isOnline = userStatuses[uId]?.isOnline || itemUser?.isOnline;

                  return (
                    <motion.div
                      key={uId}
                      whileHover={{ scale: 1.015, x: 2 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => handleToggleUser(itemUser)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '18px',
                        background: isSelected
                          ? 'linear-gradient(135deg, rgba(91, 95, 239, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)'
                          : '#FFFFFF',
                        border: isSelected ? '1.5px solid #5B5FEF' : '1px solid rgba(226, 232, 240, 0.9)',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 4px 16px rgba(91, 95, 239, 0.12)' : '0 2px 6px rgba(0,0,0,0.02)',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                          <Avatar
                            size="sm"
                            name={itemUser.name}
                            src={itemUser.pic}
                            style={{ border: isSelected ? '2px solid #5B5FEF' : '1.5px solid #FFFFFF' }}
                          />
                          {isOnline && (
                            <span
                              style={{
                                position: 'absolute',
                                right: 0,
                                bottom: 0,
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: '#10B981',
                                border: '2px solid #FFFFFF'
                              }}
                            />
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
                            {itemUser.name}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                            @{itemUser.username || (itemUser.email ? itemUser.email.split('@')[0] : 'user')}
                          </span>
                        </div>
                      </div>

                      {/* Dynamic Switch Badge */}
                      <motion.div
                        animate={{ scale: isSelected ? [1, 1.08, 1] : 1 }}
                        style={{
                          padding: isSelected ? '5px 12px' : '5px 12px',
                          borderRadius: '99px',
                          background: isSelected
                            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                            : '#F8FAFC',
                          border: isSelected ? 'none' : '1.5px solid #E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          color: isSelected ? '#FFFFFF' : '#5B5FEF',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.35)' : 'none'
                        }}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle2 size={13} strokeWidth={2.8} />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus size={13} strokeWidth={2.5} color="#5B5FEF" />
                            <span>Direct Add</span>
                          </>
                        )}
                      </motion.div>
                    </motion.div>
                  );
                })
              ) : (
                <Box py={4} textAlign="center">
                  <Text fontSize="0.82rem" color="#94A3B8" fontWeight="600" m={0}>
                    {searchQuery.trim() ? 'No users found matching search' : 'No friends found. Type to search any user!'}
                  </Text>
                </Box>
              )}
            </Box>
          </Box>

          {/* 🌟 5. Ultra-Luxury Action Launch Dock */}
          <Box mt={5} pt={3} borderTop="1px solid rgba(226, 232, 240, 0.8)" display="flex" alignItems="center" gap={3}>
            <Button
              variant="ghost"
              onClick={onClose}
              borderRadius="99px"
              fontWeight="700"
              fontSize="0.88rem"
              color="#64748B"
              _hover={{ bg: '#F1F5F9', color: '#0F172A' }}
              px={5}
            >
              Cancel
            </Button>

            <motion.div
              whileHover={{ scale: isReady ? 1.02 : 1 }}
              whileTap={{ scale: isReady ? 0.98 : 1 }}
              style={{ flex: 1 }}
            >
              <Button
                w="100%"
                onClick={handleCreateGroup}
                isLoading={loading}
                disabled={!isReady}
                style={{
                  background: isReady
                    ? 'linear-gradient(135deg, #5B5FEF 0%, #8B5CF6 50%, #EC4899 100%)'
                    : 'linear-gradient(135deg, #CBD5E1 0%, #E2E8F0 100%)',
                  color: '#FFFFFF',
                  borderRadius: '99px',
                  fontWeight: 900,
                  fontSize: '0.92rem',
                  height: '46px',
                  boxShadow: isReady ? '0 10px 30px rgba(91, 95, 239, 0.4)' : 'none',
                  border: 'none',
                  cursor: isReady ? 'pointer' : 'not-allowed',
                  transition: 'all 0.25s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Rocket size={17} strokeWidth={2.4} />
                  <span>🚀 Launch Orbit Space ({selectedUsers.length + 1} Members)</span>
                </div>
              </Button>
            </motion.div>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
