import React, { useState, useRef, useEffect } from 'react'
import { isSameSender, isLastMessage, isSameSenderMargin, isSameUser } from "../config/ChatsLogic"
import { Avatar } from "@chakra-ui/avatar";
import { Tooltip } from "@chakra-ui/tooltip";
import { useSelector } from "react-redux"
import { toast } from 'react-toastify';
import axios from 'axios';
import { getJwtToken } from '../config/getJwt';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, PhoneCall, PhoneMissed } from 'lucide-react';

import { decompressData, decompressionCache } from '../config/dataCompressor';
import { stompService } from '../config/stompService2';

const DecompressedContent = ({ content, isMe, msgId, expiredOnce, revealedOnce, viewCountdown, revealViewOnce }) => {
  const isEncrypted = typeof content === 'string' && (content.startsWith('[gz]') || content.startsWith('[enc]'));
  const cachedVal = isEncrypted ? decompressionCache.get(content) : content;
  const [text, setText] = useState(cachedVal !== undefined ? cachedVal : '');

  useEffect(() => {
    let isMounted = true;
    if (isEncrypted && cachedVal === undefined) {
      decompressData(content).then(res => {
        if (isMounted) setText(res || '');
      }).catch(() => {
        if (isMounted) setText(content);
      });
    } else if (!isEncrypted) {
      setText(content);
    }
    return () => { isMounted = false; };
  }, [content, isEncrypted, cachedVal]);

  if (!text) return null;

  if (text.startsWith('[view-once]')) {
    const viewOnceText = text.replace('[view-once]', '').trim();
    return expiredOnce && expiredOnce.has(msgId) ? (
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.825rem', opacity: 0.85, fontStyle: 'italic' }}>
        🚫 Opened • View-once expired
      </span>
    ) : (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {revealedOnce && revealedOnce.has(msgId) ? (
          <>
            <span>{viewOnceText}</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'rgba(0,0,0,0.15)', padding: '2px 7px', borderRadius: '6px' }}>
              ⏱ {(viewCountdown && viewCountdown[msgId]) ?? 5}s
            </span>
          </>
        ) : (
          <button
            onClick={() => revealViewOnce && revealViewOnce(msgId)}
            style={{
              background: isMe ? 'rgba(255,255,255,0.22)' : 'rgba(255,42,84,0.08)',
              border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
              fontSize: 12, fontWeight: 700, color: isMe ? '#fff' : '#FF2A54',
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0
            }}
          >
            👁 Click to View (Once)
          </button>
        )}
      </span>
    );
  }

  if (text.startsWith('[call] ')) {
    const callText = text.replace('[call] ', '').toLowerCase();
    const isNegative = callText.includes('declined') || callText.includes('cancelled') || callText.includes('missed');
    const isVideo = callText.includes('video');

    const IconComponent = isNegative ? PhoneOff : PhoneCall;

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '12px 18px',
        background: isMe
          ? 'linear-gradient(135deg, #FFFDF7 0%, #FEF9EB 100%)'
          : '#FFFFFF',
        borderRadius: isMe ? '22px 22px 6px 22px' : '22px 22px 22px 6px',
        border: isMe
          ? '1.5px solid rgba(212, 175, 55, 0.45)'
          : (isNegative ? '1.5px solid rgba(254, 202, 202, 0.9)' : '1.5px solid rgba(167, 243, 208, 0.9)'),
        boxShadow: isMe
          ? '0 6px 20px rgba(212, 175, 55, 0.12), 0 2px 6px rgba(0, 0, 0, 0.03)'
          : '0 6px 20px rgba(15, 23, 42, 0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        minWidth: '250px',
        fontFamily: "'Outfit', 'Inter', sans-serif"
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '14px',
          background: isNegative
            ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
            : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isNegative
            ? '0 4px 14px rgba(239, 68, 68, 0.35)'
            : '0 4px 14px rgba(16, 185, 129, 0.35)',
          flexShrink: 0
        }}>
          <IconComponent size={20} color="#FFFFFF" strokeWidth={2.4} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{
              fontSize: '0.94rem',
              fontWeight: 800,
              color: '#0F172A',
              textTransform: 'capitalize',
              letterSpacing: '-0.01em',
              lineHeight: 1.2
            }}>
              Call {callText}
            </span>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              background: isNegative ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              color: isNegative ? '#DC2626' : '#059669',
              padding: '2px 8px',
              borderRadius: '99px'
            }}>
              {isNegative ? 'Unanswered' : 'Connected'}
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isMe ? '#B45309' : '#64748B', marginTop: '3px' }}>
            {isVideo ? 'HD Video Call' : 'HD Voice Call'}
          </span>
        </div>
      </div>
    );
  }

  if (text.startsWith('data:image')) {
    return <img src={text} alt="Attachment" style={{ maxWidth: '280px', maxHeight: '280px', borderRadius: '16px', objectFit: 'cover', border: '1px solid rgba(0,0,0,0.08)' }} />;
  }
  if (text.startsWith('data:video') || text.includes('video/mp4') || text.includes('.mp4')) {
    return <video src={text} controls style={{ maxWidth: '280px', borderRadius: '16px', marginTop: '4px' }} />;
  }
  if (text.startsWith('data:audio') || text.includes('audio/mp3') || text.includes('audio/mpeg') || text.includes('.mp3')) {
    return <audio src={text} controls style={{ maxWidth: '280px', borderRadius: '12px', marginTop: '4px' }} />;
  }
  if (text.startsWith('[doc] ') || text.startsWith('data:application') || text.startsWith('data:text') || text.includes('application/pdf')) {
    let fileName = 'Document';
    let fileSize = '';
    let docType = 'PDF Document';
    let fileData = text;
    let icon = '📕';
    let extBadge = 'PDF';
    let themeColor = '#EF4444';
    let themeBg = 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)';

    if (text.startsWith('[doc] ')) {
      try {
        const jsonStr = text.replace('[doc] ', '');
        const meta = JSON.parse(jsonStr);
        fileName = meta.name || 'PDF Document';
        fileSize = meta.size || '';
        fileData = meta.data || '';
        if (meta.isPdf || fileName.toLowerCase().endsWith('.pdf')) {
          docType = 'PDF Document';
          extBadge = 'PDF';
          icon = '📕';
          themeColor = '#EF4444';
          themeBg = 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)';
        } else if (fileName.match(/\.(docx?|doc)$/i)) {
          docType = 'Word Document';
          extBadge = 'DOCX';
          icon = '📝';
          themeColor = '#2563EB';
          themeBg = 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)';
        } else if (fileName.match(/\.(xlsx?|csv)$/i)) {
          docType = 'Excel Spreadsheet';
          extBadge = 'XLSX';
          icon = '📊';
          themeColor = '#10B981';
          themeBg = 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)';
        } else if (fileName.match(/\.(pptx?|ppt)$/i)) {
          docType = 'Presentation';
          extBadge = 'PPTX';
          icon = '📽';
          themeColor = '#F59E0B';
          themeBg = 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)';
        } else {
          docType = 'File Document';
          extBadge = 'FILE';
          icon = '📄';
          themeColor = '#64748B';
          themeBg = 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)';
        }
      } catch (e) {
        fileData = text;
      }
    } else {
      if (text.includes('pdf')) {
        fileName = 'Aura_Document.pdf';
        extBadge = 'PDF';
        icon = '📕';
        themeColor = '#EF4444';
        themeBg = 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)';
      }
    }

    return (
      <a
        href={fileData}
        download={fileName}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          background: isMe
            ? 'linear-gradient(135deg, #FFFDF7 0%, #FEF9EB 100%)'
            : '#FFFFFF',
          padding: '13px 18px',
          borderRadius: isMe ? '22px 22px 6px 22px' : '22px 22px 22px 6px',
          border: isMe
            ? '1.5px solid rgba(212, 175, 55, 0.45)'
            : '1.5px solid rgba(226, 232, 240, 0.95)',
          boxShadow: isMe
            ? '0 8px 24px rgba(212, 175, 55, 0.14), 0 2px 6px rgba(0, 0, 0, 0.03)'
            : '0 8px 24px -4px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
          width: '300px',
          maxWidth: '100%',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: 'pointer'
        }}
      >
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '14px',
          background: themeBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
        }}>
          {icon}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', textAlign: 'left' }}>
          <span style={{
            fontSize: '0.92rem',
            fontWeight: 800,
            color: '#0F172A',
            fontFamily: "'Outfit', sans-serif",
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {fileName}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{
              fontSize: '0.66rem',
              fontWeight: 800,
              color: isMe ? '#B45309' : themeColor,
              background: isMe ? 'rgba(212, 175, 55, 0.18)' : 'rgba(0,0,0,0.05)',
              padding: '1px 6px',
              borderRadius: '6px',
              letterSpacing: '0.04em'
            }}>
              {extBadge}
            </span>
            {fileSize && (
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                • {fileSize}
              </span>
            )}
          </div>
        </div>
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontSize: '14px',
          fontWeight: 800,
          flexShrink: 0,
          boxShadow: '0 3px 10px rgba(212, 175, 55, 0.35)'
        }}>
          ↓
        </div>
      </a>
    );
  }
  return <span>{text}</span>;
};

const TAG_COLORS = {
  important: { bg: '#FFF0F2', color: '#E63946', border: '#FFD0D5' },
  work: { bg: '#EEF2FF', color: '#4F46E5', border: '#C7D2FE' },
  personal: { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
  follow_up: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
};

const parseUtcDate = (dateInput) => {
  if (!dateInput) return new Date();
  try {
    if (typeof dateInput === 'string') {
      let str = dateInput;
      if (str.includes('T') && !str.endsWith('Z') && !str.includes('+')) {
        str += 'Z';
      }
      const d = new Date(str);
      if (!isNaN(d.getTime())) return d;
    } else if (typeof dateInput === 'number') {
      const d = new Date(dateInput);
      if (!isNaN(d.getTime())) return d;
    } else if (Array.isArray(dateInput)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateInput;
      return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    }
  } catch (e) { }
  return new Date();
};

const formatTime = (dateInput) => {
  if (!dateInput) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  try {
    const d = parseUtcDate(dateInput);
    if (d && !isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }
  } catch (e) { }
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

const getRelativeTime = (dateInput) => {
  if (!dateInput) return "just now";
  try {
    const d = parseUtcDate(dateInput);
    if (!d || isNaN(d.getTime())) return "just now";

    const now = new Date();
    const diffSec = Math.max(0, Math.floor((now - d) / 1000));
    if (diffSec < 45) return "just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  } catch (e) {
    return "just now";
  }
};

const getDateLabel = (dateInput) => {
  if (!dateInput) return null;
  const d = parseUtcDate(dateInput);
  if (!d || isNaN(d.getTime())) return null;
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
};

const shouldShowDateDivider = (messages, index) => {
  if (index === 0) return true;
  const currentMsg = messages[index];
  const prevMsg = messages[index - 1];

  const d1 = parseUtcDate(currentMsg.createdAt || currentMsg.timestamp);
  const d2 = parseUtcDate(prevMsg.createdAt || prevMsg.timestamp);

  if (!d1 || !d2 || isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
  return d1.toDateString() !== d2.toDateString();
};

const senderId = (m) => {
  if (!m) return null;
  if (typeof m.sender === 'string') return m.sender;
  return m.sender?._id || m.sender?.id || m.senderId;
};

const ScrollableChat = ({ chatId, otherUser, messages, setMessages, isTyping }) => {
  const user = useSelector(state => state.user);
  const loggedId = user?._id || user?.id || user?.userLogin?._id || user?.userLogin?.id;

  // ── Interactive Reactions Bar State
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [reactionsMap, setReactionsMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aura_reactions_map') || '{}'); } catch { return {}; }
  });
  const [confettiEmoji, setConfettiEmoji] = useState(null);

  const REACTION_EMOJIS = ['❤️', '🔥', '💎', '👏', '😂', '✨', '⚡'];

  const triggerHapticFeedback = () => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      try { window.navigator.vibrate(25); } catch (e) {}
    }
  };

  const handleToggleReaction = (msg, emoji) => {
    triggerHapticFeedback();
    const id = msg._id || msg.id;
    if (!id) return;

    // Trigger visual confetti explosion effect
    setConfettiEmoji({ emoji, x: window.innerWidth / 2, y: window.innerHeight / 2, id: Date.now() });
    setTimeout(() => setConfettiEmoji(null), 1200);

    setReactionsMap(prev => {
      const currentList = prev[id] || [];
      const hasMyReaction = currentList.find(r => r.userId === loggedId && r.emoji === emoji);
      let updated;
      if (hasMyReaction) {
        // remove
        updated = currentList.filter(r => !(r.userId === loggedId && r.emoji === emoji));
      } else {
        // add or replace my reaction
        const otherReactions = currentList.filter(r => r.userId !== loggedId);
        updated = [...otherReactions, { userId: loggedId, emoji, userName: user?.name || 'You' }];
      }
      const newMap = { ...prev, [id]: updated };
      try { localStorage.setItem('aura_reactions_map', JSON.stringify(newMap)); } catch (e) {}
      return newMap;
    });

    // Broadcast reaction through socket if connected
    try {
      const sock = window.__auraSocket;
      if (sock) {
        sock.emit('aura-reaction', { chatId, msgId: id, userId: loggedId, emoji, userName: user?.name || 'User' });
      }
    } catch (e) {}
  };

  // Listen for real-time reactions
  useEffect(() => {
    const sock = window.__auraSocket;
    if (!sock) return;
    const onReceiveReaction = (data) => {
      if (data && data.msgId) {
        setReactionsMap(prev => {
          const currentList = prev[data.msgId] || [];
          const updated = [...currentList.filter(r => r.userId !== data.userId), { userId: data.userId, emoji: data.emoji, userName: data.userName }];
          const newMap = { ...prev, [data.msgId]: updated };
          try { localStorage.setItem('aura_reactions_map', JSON.stringify(newMap)); } catch (e) {}
          return newMap;
        });
      }
    };
    sock.on('aura-reaction-received', onReceiveReaction);
    return () => { sock.off('aura-reaction-received', onReceiveReaction); };
  }, [chatId]);

  // ── Context-menu state
  const [ctxMenu, setCtxMenu] = useState(null); // { x, y, msg }
  const ctxRef = useRef(null);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Track whether user is scrolled to (near) bottom so auto-scroll doesn't interrupt manual scroll-up
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      const threshold = 60; // px from bottom to still consider "at bottom"
      const atBottom = (el.scrollHeight - el.scrollTop - el.clientHeight) <= threshold;
      setIsAtBottom(atBottom);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    // initialize
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (isAtBottom) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    // Emit read receipts for any incoming unread messages when user is viewing (near bottom)
    try {
      const sock = window.__auraSocket || null;
      if (!sock || !messages || !Array.isArray(messages) || !chatId) return;
      if (!isAtBottom) return; // Only mark read when user is at bottom viewing latest

      const localLoggedId = user?._id || user?.id || user?.userLogin?._id || user?.userLogin?.id;
      const unreadIncoming = messages.filter(m => {
        const sid = senderId(m);
        const id = m._id || m.id;
        const isMe = String(sid) === String(localLoggedId);
        const alreadyRead = m.isRead || m.seen || m.read;
        return !isMe && !alreadyRead && id;
      });

      if (unreadIncoming.length === 0) return;

      const ids = unreadIncoming.map(m => m._id || m.id);
      // Optimistically mark them read locally
      setMessages(prev => prev.map(m => ids.includes(m._id || m.id) ? { ...m, isRead: true, seen: true, read: true } : m));

      // Emit to server
      if (sock && sock.__isStompShim) {
        try { stompService.sendMessageRead(chatId, ids, localLoggedId); } catch (e) { }
      } else {
        try { sock.emit('message-read', { chatId, messageIds: ids, readerId: localLoggedId }); } catch (e) { }
      }
    } catch (e) { }

  }, [messages, isAtBottom, chatId]);

  // ── Edit state
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  // ── Schedule badge display
  const [scheduledBadges] = useState({}); // msgId -> ISO time (stored locally)

  // ── Bookmark modal
  const [bookmarkModal, setBookmarkModal] = useState(null); // msg
  const [bTag, setBTag] = useState('important');
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aura_bookmarks') || '[]'); } catch { return []; }
  });

  // ── View-once revealed set
  const [revealedOnce, setRevealedOnce] = useState(new Set());

  // Close context menu on outside click
  useEffect(() => {
    const close = (e) => {
      if (ctxRef.current && !ctxRef.current.contains(e.target)) setCtxMenu(null);
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, []);

  const openCtx = (e, msg) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, msg });
  };

  // ── 1. Silent Edit (no "Edited" label shown to anyone)
  const startEdit = (msg) => {
    setEditingId(msg._id || msg.id);
    setEditText(msg.content);
    setCtxMenu(null);
  };

  const saveEdit = async (msg) => {
    const id = msg._id || msg.id;
    const trimmed = editText.trim();
    if (!trimmed || trimmed === msg.content) { setEditingId(null); return; }
    try {
      const config = { headers: { Authorization: 'Bearer ' + getJwtToken(), 'Content-Type': 'application/json' } };
      // Use PUT /api/message/:id to update content silently
      await axios.put(`/api/message/${id}`, { content: trimmed, silent: true }, config);
      if (setMessages) {
        setMessages(prev => prev.map(m => (m._id || m.id) === id ? { ...m, content: trimmed } : m));
      }
    } catch {
      // Optimistic update even if backend returns 404 (feature pending)
      if (setMessages) {
        setMessages(prev => prev.map(m => (m._id || m.id) === id ? { ...m, content: trimmed } : m));
      }
    }
    setEditingId(null);
  };

  const [expiredOnce, setExpiredOnce] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('aura_expired_once') || '[]'));
    } catch {
      return new Set();
    }
  });

  const [viewCountdown, setViewCountdown] = useState({});

  // ── 2. View-once reveal with 5s countdown and permanent expiration
  const revealViewOnce = (id) => {
    if (expiredOnce.has(id)) return;
    setRevealedOnce(prev => new Set([...prev, id]));
    setViewCountdown(prev => ({ ...prev, [id]: 5 }));

    const interval = setInterval(() => {
      setViewCountdown(prev => {
        const current = prev[id];
        if (current === undefined || current <= 1) {
          clearInterval(interval);
          setExpiredOnce(ePrev => {
            const updated = new Set([...ePrev, id]);
            localStorage.setItem('aura_expired_once', JSON.stringify([...updated]));
            return updated;
          });
          setRevealedOnce(rPrev => { const s = new Set(rPrev); s.delete(id); return s; });
          return { ...prev, [id]: 0 };
        }
        return { ...prev, [id]: current - 1 };
      });
    }, 1000);
  };

  // ── 3. Bookmark with tag
  const saveBookmark = (msg) => {
    const newBm = { id: msg._id || msg.id, content: msg.content, tag: bTag, savedAt: new Date().toISOString() };
    const updated = [...bookmarks.filter(b => b.id !== newBm.id), newBm];
    setBookmarks(updated);
    localStorage.setItem('aura_bookmarks', JSON.stringify(updated));
    toast.success(`📌 Bookmarked as "${bTag}"`, { autoClose: 2000, hideProgressBar: true });
    setBookmarkModal(null);
  };

  const isBookmarked = (msg) => bookmarks.some(b => b.id === (msg._id || msg.id));

  // ── 4. Schedule message (display-only — scheduling happens at input level; here we show badge)
  return (
    <div ref={scrollContainerRef} style={{ position: 'relative', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
      <div style={{ display: 'block' }}>

        {messages && messages.map((m, i) => {
          const isMe = Boolean(senderId(m) && loggedId && String(senderId(m)) === String(loggedId));
          const msgId = m._id || m.id;
          const editing = editingId === msgId;
          const bmked = isBookmarked(m);
          const tag = bookmarks.find(b => b.id === msgId)?.tag;

          return (
            <React.Fragment key={msgId + '-wrap'}>
              {shouldShowDateDivider(messages, i) && (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '26px 0 16px 0', width: '100%' }}>
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    color: '#475569',
                    padding: '5px 18px',
                    borderRadius: '99px',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    letterSpacing: '0.08em',
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
                    textTransform: 'uppercase',
                    fontFamily: "'Outfit', sans-serif"
                  }}>
                    {getDateLabel(m.createdAt || m.timestamp)}
                  </span>
                </div>
              )}
              <div
                key={msgId}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                  width: '100%',
                  marginTop: isSameUser(messages, m, i, loggedId) ? 3 : 10,
                  marginBottom: 2,
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  onMouseEnter={() => setHoveredMsgId(msgId)}
                  onMouseLeave={() => setHoveredMsgId(null)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleToggleReaction(m, '❤️');
                  }}
                  onContextMenu={(e) => openCtx(e, m)}
                  style={{
                    display: 'flex',
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '78%',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                >
                  {editing ? (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', width: 320 }}>
                      <input
                        autoFocus
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(m); if (e.key === 'Escape') setEditingId(null); }}
                        style={{
                          flex: 1, border: '1.5px solid #FF2A54', borderRadius: 14, padding: '8px 14px',
                          fontSize: 14, outline: 'none', fontFamily: "'Inter', sans-serif"
                        }}
                      />
                      <button onClick={() => saveEdit(m)} style={{ background: '#FF2A54', color: '#fff', border: 'none', borderRadius: 10, padding: '6px 12px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Save</button>
                      <button onClick={() => setEditingId(null)} style={{ background: 'transparent', border: '1px solid #ddd', borderRadius: 10, padding: '6px 10px', cursor: 'pointer', fontSize: 13 }}>✕</button>
                    </div>
                  ) : (() => {
                    const rawText = typeof m.content === 'string' ? m.content : '';
                    const cachedText = decompressionCache.get(m.content) || rawText;
                    const isCallMsg = rawText.includes('[call]') || cachedText.includes('[call]');
                    const isDocMsg = rawText.includes('[doc] ') || cachedText.includes('[doc] ') || 
                                     rawText.startsWith('data:application') || cachedText.startsWith('data:application') ||
                                     rawText.includes('application/pdf') || cachedText.includes('application/pdf') ||
                                     rawText.startsWith('data:image') || cachedText.startsWith('data:image') ||
                                     rawText.startsWith('data:video') || cachedText.startsWith('data:video');

                    if (isCallMsg || isDocMsg) {
                      return (
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', width: 'auto', padding: 0, margin: '2px 0' }}>
                          <DecompressedContent
                            content={m.content}
                            isMe={isMe}
                            msgId={msgId}
                            expiredOnce={expiredOnce}
                            revealedOnce={revealedOnce}
                            viewCountdown={viewCountdown}
                            revealViewOnce={revealViewOnce}
                          />
                          <span
                            style={{
                              fontSize: '0.66rem',
                              opacity: 0.75,
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              color: '#64748B',
                              marginTop: '4px',
                              paddingRight: isMe ? '4px' : '0',
                              paddingLeft: !isMe ? '4px' : '0',
                              fontFamily: "'Outfit', sans-serif"
                            }}
                          >
                            {formatTime(m.createdAt || m.updatedAt || m.timestamp || m.time)}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <span
                        className="animate-message"
                        style={{
                          display: 'inline-block',
                          width: 'auto',
                          background: isMe
                            ? 'linear-gradient(135deg, #FFFDF7 0%, #FEF9EB 100%)'
                            : '#FFFFFF',
                          color: '#0F172A',
                          border: isMe
                            ? '1.5px solid rgba(212, 175, 55, 0.45)'
                            : '1.5px solid rgba(226, 232, 240, 0.9)',
                          boxShadow: isMe
                            ? '0 6px 20px rgba(212, 175, 55, 0.12), 0 2px 6px rgba(0, 0, 0, 0.03)'
                            : '0 3px 14px rgba(15, 23, 42, 0.04)',
                          borderRadius: isMe ? '22px 22px 6px 22px' : '22px 22px 22px 6px',
                          padding: '12px 18px',
                          fontSize: '0.94rem',
                          lineHeight: '1.5',
                          fontWeight: 500,
                          wordBreak: 'normal',
                          overflowWrap: 'anywhere',
                          whiteSpace: 'pre-wrap',
                          cursor: 'context-menu',
                          position: 'relative',
                          fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
                          letterSpacing: '-0.01em',
                          backdropFilter: isMe ? 'none' : 'blur(16px)',
                          WebkitBackdropFilter: isMe ? 'none' : 'blur(16px)'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14 }}>
                            <div style={{ flex: 1 }}>
                              <DecompressedContent
                                content={m.content}
                                isMe={isMe}
                                msgId={msgId}
                                expiredOnce={expiredOnce}
                                revealedOnce={revealedOnce}
                                viewCountdown={viewCountdown}
                                revealViewOnce={revealViewOnce}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                opacity: 0.8,
                                alignSelf: 'flex-end',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                color: isMe ? '#B45309' : '#64748B',
                                paddingLeft: '8px',
                                fontFamily: "'Outfit', sans-serif"
                              }}
                            >
                              {formatTime(m.createdAt || m.updatedAt || m.timestamp || m.time)}
                            </span>
                          </div>

                          {/* Bookmark tag badge */}
                          {bmked && tag && (
                            <span style={{
                              display: 'block', fontSize: 10, fontWeight: 700, marginTop: 2,
                              color: TAG_COLORS[tag]?.color || '#FF2A54',
                              opacity: 0.9,
                            }}>
                              📌 {tag.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </span>
                    );
                  })()}

                  {/* ── Interactive Instagram / iMessage Floating Quick Reaction Bar on Hover ── */}
                  <AnimatePresence>
                    {hoveredMsgId === msgId && !editing && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.85, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 6 }}
                        transition={{ type: "spring", stiffness: 450, damping: 25 }}
                        style={{
                          position: 'absolute',
                          top: '-42px',
                          [isMe ? 'right' : 'left']: '10px',
                          zIndex: 40,
                          background: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          borderRadius: '99px',
                          padding: '3px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(226, 232, 240, 0.85)'
                        }}
                      >
                        {REACTION_EMOJIS.map((emoji) => {
                          const msgReactions = reactionsMap[msgId] || [];
                          const isMine = msgReactions.some(r => r.userId === loggedId && r.emoji === emoji);
                          return (
                            <motion.button
                              key={emoji}
                              whileHover={{ scale: 1.45, y: -4 }}
                              whileTap={{ scale: 0.85 }}
                              onClick={() => handleToggleReaction(m, emoji)}
                              style={{
                                background: isMine ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                                border: isMine ? '1px solid #D4AF37' : 'none',
                                borderRadius: '50%',
                                width: '30px',
                                height: '30px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px',
                                cursor: 'pointer',
                                padding: 0,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {emoji}
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* ── Active Reactions Badge Cluster (WhatsApp/Slack/iMessage Style) ── */}
                {(() => {
                  const msgReactions = reactionsMap[msgId] || [];
                  if (msgReactions.length === 0) return null;
                  
                  // Group by emoji
                  const counts = {};
                  msgReactions.forEach(r => {
                    counts[r.emoji] = (counts[r.emoji] || 0) + 1;
                  });

                  return (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '-6px',
                        marginBottom: '4px',
                        zIndex: 10,
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        paddingRight: isMe ? '8px' : '0',
                        paddingLeft: !isMe ? '8px' : '0'
                      }}
                    >
                      {Object.entries(counts).map(([emoji, count]) => {
                        const hasMyReact = msgReactions.some(r => r.userId === loggedId && r.emoji === emoji);
                        return (
                          <motion.div
                            key={emoji}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleToggleReaction(m, emoji)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              background: hasMyReact ? '#FEF9EB' : '#FFFFFF',
                              border: hasMyReact ? '1.5px solid #D4AF37' : '1px solid rgba(226, 232, 240, 0.9)',
                              borderRadius: '99px',
                              padding: '2px 8px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              color: '#0F172A',
                              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
                              cursor: 'pointer'
                            }}
                          >
                            <span>{emoji}</span>
                            {count > 1 && <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 800 }}>{count}</span>}
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  );
                })()}

                {/* Instagram-style Transparent Seen / Sent Receipt below last sent message */}
                {isMe && i === messages.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity: 0.85, y: 0 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      width: '100%',
                      marginTop: '2px',
                      marginRight: '6px'
                    }}
                  >
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: (m.isRead || m.seen || m.read) ? '#0284C7' : '#94A3B8',
                      fontFamily: "'Outfit', 'Inter', sans-serif",
                      letterSpacing: '-0.01em'
                    }}>
                      {(m.isRead || m.seen || m.read) ? 'Seen ✓✓' : 'Sent ✓'} • {getRelativeTime(m.createdAt || m.updatedAt || m.timestamp)}
                    </span>
                  </motion.div>
                )}
              </div>
            </React.Fragment>
          );
        })}

        {/* Live Animated Typing Bubble Indicator on Left Side */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              marginTop: '10px',
              marginBottom: '6px',
              gap: 10,
            }}
          >
            {otherUser && (
              <div style={{ width: 36, height: 36, flexShrink: 0 }}>
                <img src={otherUser?.pic || ''} alt={otherUser?.name || 'User'} style={{ width: 36, height: 36, borderRadius: 12, objectFit: 'cover', border: '1.5px solid rgba(226,232,240,0.9)' }} />
              </div>
            )}

            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '18px 18px 18px 4px',
                padding: '8px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 700 }}>
                  {`${otherUser?.name || otherUser?.username || 'User'} is typing...`}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {[0, 1, 2].map((dot) => (
                    <motion.span
                      key={dot}
                      animate={{ y: [0, -6, 0], opacity: [0.35, 1, 0.35] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: dot * 0.14, ease: "easeInOut" }}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#D4AF37',
                        display: 'inline-block'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Context Menu with Emoji Quick Reaction Bar ── */}
      <AnimatePresence>
        {ctxMenu && (
          <motion.div
            ref={ctxRef}
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              top: ctxMenu.y,
              left: ctxMenu.x,
              zIndex: 9999,
              background: '#FFFFFF',
              border: '1.5px solid rgba(226, 232, 240, 0.95)',
              borderRadius: 18,
              boxShadow: '0 15px 45px rgba(15, 23, 42, 0.16)',
              padding: '6px 0',
              minWidth: 230,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {/* Quick Emoji Reaction Header Row in Context Menu */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 12px 10px 12px',
              borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
              marginBottom: '4px'
            }}>
              {REACTION_EMOJIS.map((emoji) => (
                <motion.button
                  key={emoji}
                  whileHover={{ scale: 1.4, y: -2 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => {
                    handleToggleReaction(ctxMenu.msg, emoji);
                    setCtxMenu(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    lineHeight: 1
                  }}
                >
                  {emoji}
                </motion.button>
              ))}
            </div>

            {[
              {
                icon: '✏️', label: 'Edit message',
                show: (ctxMenu.msg?.sender?.id || ctxMenu.msg?.sender?._id) === loggedId,
                action: () => startEdit(ctxMenu.msg),
              },
              {
                icon: '📌', label: isBookmarked(ctxMenu.msg) ? 'Update bookmark' : 'Bookmark',
                show: true,
                action: () => { setBookmarkModal(ctxMenu.msg); setCtxMenu(null); },
              },
              {
                icon: '📋', label: 'Copy text',
                show: true,
                action: () => { navigator.clipboard.writeText(ctxMenu.msg?.content || ''); setCtxMenu(null); toast.success('Copied!', { autoClose: 1200, hideProgressBar: true }); },
              },
            ].filter(item => item.show !== false).map((item, idx) => (
              <button
                key={idx}
                onClick={item.action}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '9px 16px', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#3D2B26',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#FFF0F2'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span>{item.icon}</span> {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bookmark Tag Modal */}
      <AnimatePresence>
        {bookmarkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
              zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <motion.div
              initial={{ scale: 0.88, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.88, y: 20 }}
              style={{
                background: '#FFFFFF', borderRadius: 20, padding: 28, minWidth: 320,
                boxShadow: '0 24px 60px rgba(61,43,38,0.18)',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#3D2B26', marginBottom: 6 }}>
                📌 Bookmark Message
              </h3>
              <p style={{ fontSize: 13, color: '#806C65', marginBottom: 18, lineHeight: 1.5, background: '#FFF9F2', padding: '10px 14px', borderRadius: 10 }}>
                "{bookmarkModal.content?.slice(0, 80)}{bookmarkModal.content?.length > 80 ? '…' : ''}"
              </p>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#806C65', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Choose Tag</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {Object.entries(TAG_COLORS).map(([tag, style]) => (
                  <button
                    key={tag}
                    onClick={() => setBTag(tag)}
                    style={{
                      padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                      background: bTag === tag ? style.color : style.bg,
                      color: bTag === tag ? '#fff' : style.color,
                      border: `1.5px solid ${style.border}`,
                      cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize',
                    }}
                  >
                    {tag.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => saveBookmark(bookmarkModal)}
                  style={{
                    flex: 1, background: 'linear-gradient(135deg, #E63946, #d62839)',
                    color: '#fff', border: 'none', borderRadius: 12, padding: '11px',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  }}
                >Save Bookmark</button>
                <button
                  onClick={() => setBookmarkModal(null)}
                  style={{
                    padding: '11px 18px', background: '#F5F5F5', border: 'none',
                    borderRadius: 12, fontSize: 14, cursor: 'pointer', fontWeight: 600, color: '#806C65',
                  }}
                >Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Micro-Interaction Flying Reaction Confetti Animation ── */}
      <AnimatePresence>
        {confettiEmoji && (
          <motion.div
            key={confettiEmoji.id}
            initial={{ scale: 0.3, opacity: 1, y: 30 }}
            animate={{ scale: [1, 2.5, 3.2], opacity: [1, 0.9, 0], y: -90, rotate: [0, 15, -15, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              left: confettiEmoji.x,
              top: confettiEmoji.y,
              transform: 'translate(-50%, -50%)',
              fontSize: '54px',
              pointerEvents: 'none',
              zIndex: 99999,
              filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))'
            }}
          >
            {confettiEmoji.emoji}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ScrollableChat;
