import React, { useState, useRef, useEffect } from 'react'
import ScrollableFeed from 'react-scrollable-feed'
import { isSameSender, isLastMessage, isSameSenderMargin, isSameUser } from "../config/ChatsLogic"
import { Avatar } from "@chakra-ui/avatar";
import { Tooltip } from "@chakra-ui/tooltip";
import { useSelector } from "react-redux"
import { toast } from 'react-toastify';
import axios from 'axios';
import { getJwtToken } from '../config/getJwt';
import { motion, AnimatePresence } from 'framer-motion';

import { decompressData } from '../config/dataCompressor';

const DecompressedContent = ({ content, isMe }) => {
  const [text, setText] = useState(content);

  useEffect(() => {
    let isMounted = true;
    if (content && typeof content === 'string' && content.startsWith('[gz]')) {
      decompressData(content).then(res => {
        if (isMounted) setText(res);
      });
    } else {
      setText(content);
    }
    return () => { isMounted = false; };
  }, [content]);

  if (!text) return null;

  if (text.startsWith('data:image')) {
    return <img src={text} alt="Attachment" style={{ maxWidth: '280px', maxHeight: '280px', borderRadius: '16px', objectFit: 'cover', border: '1px solid rgba(0,0,0,0.08)' }} />;
  }
  if (text.startsWith('data:video') || text.includes('video/mp4') || text.includes('.mp4')) {
    return <video src={text} controls style={{ maxWidth: '280px', borderRadius: '16px', marginTop: '4px' }} />;
  }
  if (text.startsWith('data:audio') || text.includes('audio/mp3') || text.includes('audio/mpeg') || text.includes('.mp3')) {
    return <audio src={text} controls style={{ maxWidth: '280px', borderRadius: '12px', marginTop: '4px' }} />;
  }
  if (text.startsWith('data:application') || text.startsWith('data:text')) {
    let icon = '📄';
    let docLabel = 'Download Document';
    if (text.includes('pdf')) { icon = '📕'; docLabel = 'PDF Document'; }
    else if (text.includes('word') || text.includes('officedocument.wordprocessingml')) { icon = '📝'; docLabel = 'Word Document (.docx)'; }
    else if (text.includes('sheet') || text.includes('excel') || text.includes('csv')) { icon = '📊'; docLabel = 'Excel Spreadsheet (.xlsx)'; }
    else if (text.includes('presentation') || text.includes('powerpoint')) { icon = '📽'; docLabel = 'PowerPoint Deck (.pptx)'; }
    else if (text.includes('zip') || text.includes('compressed') || text.includes('rar')) { icon = '📦'; docLabel = 'Zip Archive'; }

    return (
      <a href={text} download="attachment" style={{ color: isMe ? '#FFFFFF' : '#E63946', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, background: isMe ? 'rgba(255,255,255,0.15)' : '#FFF0F2', padding: '8px 14px', borderRadius: '12px', border: isMe ? '1px solid rgba(255,255,255,0.25)' : '1px solid #FFE3E6' }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
        <span style={{ fontSize: '13px' }}>{docLabel}</span>
        <span style={{ fontSize: '12px', opacity: 0.8 }}>⬇</span>
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
  } catch (e) {}
  return new Date();
};

const formatTime = (dateInput) => {
  if (!dateInput) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  try {
    const d = parseUtcDate(dateInput);
    if (d && !isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }
  } catch (e) {}
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

const ScrollableChat = ({ messages, setMessages, isTyping }) => {
  const user = useSelector(state => state.user)

  // ── Context-menu state
  const [ctxMenu, setCtxMenu] = useState(null); // { x, y, msg }
  const ctxRef = useRef(null);

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
  const isViewOnce = (msg) => msg.content?.startsWith('[view-once]');
  const getViewOnceText = (msg) => msg.content?.replace('[view-once]', '').trim();

  const senderId = (m) => {
    if (!m) return null;
    if (typeof m.sender === 'string') return m.sender;
    return m.sender?._id || m.sender?.id || m.senderId;
  };
  const loggedId = user?._id || user?.id || user?.userLogin?._id || user?.userLogin?.id;

  return (
    <div style={{ position: 'relative' }}>
      <ScrollableFeed>
        {messages && messages.map((m, i) => {
          const isMe = Boolean(senderId(m) && loggedId && String(senderId(m)) === String(loggedId));
          const msgId = m._id || m.id;
          const viewOnce = isViewOnce(m);
          const revealed = revealedOnce.has(msgId);
          const editing = editingId === msgId;
          const bmked = isBookmarked(m);
          const tag = bookmarks.find(b => b.id === msgId)?.tag;

          return (
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
                onContextMenu={(e) => openCtx(e, m)}
                style={{
                  display: 'flex',
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '78%',
                  position: 'relative'
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
                ) : (
                  <span
                    className="animate-message"
                    style={{
                      display: 'inline-block',
                      width: 'auto',
                      background: isMe
                        ? 'linear-gradient(135deg, #FF2A54 0%, #E60044 100%)'
                        : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                      color: isMe ? '#FFFFFF' : '#0F172A',
                      borderRadius: isMe ? '22px 22px 4px 22px' : '22px 22px 22px 4px',
                      padding: '12px 18px',
                      fontSize: '0.94rem',
                      lineHeight: '1.5',
                      fontWeight: 500,
                      wordBreak: 'normal',
                      overflowWrap: 'anywhere',
                      whiteSpace: 'pre-wrap',
                      boxShadow: isMe
                        ? '0 4px 14px rgba(255, 42, 84, 0.18)'
                        : '0 2px 10px rgba(15, 23, 42, 0.04)',
                      border: isMe ? 'none' : '1px solid rgba(226, 232, 240, 0.9)',
                      cursor: 'context-menu',
                      position: 'relative',
                      fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
                      letterSpacing: '-0.01em'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14 }}>
                        <div style={{ flex: 1 }}>
                          {/* View-once message */}
                          {viewOnce ? (
                            expiredOnce.has(msgId) ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.825rem', opacity: 0.85, fontStyle: 'italic' }}>
                                🚫 Opened • View-once expired
                              </span>
                            ) : (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {revealed ? (
                                  <>
                                    <span>{getViewOnceText(m)}</span>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'rgba(0,0,0,0.15)', padding: '2px 7px', borderRadius: '6px' }}>
                                      ⏱ {viewCountdown[msgId] ?? 5}s
                                    </span>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => revealViewOnce(msgId)}
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
                            )
                          ) : (
                            <DecompressedContent content={m.content} isMe={isMe} />
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: '0.66rem',
                            opacity: isMe ? 0.92 : 0.7,
                            alignSelf: 'flex-end',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            color: isMe ? 'rgba(255, 255, 255, 0.92)' : '#64748B',
                            paddingLeft: '6px'
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
                )}
              </motion.div>

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
                    fontWeight: 500,
                    color: (m.isRead || m.seen || m.read) ? '#0EA5E9' : '#64748B',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    {(m.isRead || m.seen || m.read) ? 'Seen' : 'Sent'} • {getRelativeTime(m.createdAt || m.updatedAt || m.timestamp)}
                  </span>
                </motion.div>
              )}
            </div>
          );
        })}

        {/* Live Animated Typing Bubble Indicator on Left Side */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 6 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              marginTop: '10px',
              marginBottom: '6px'
            }}
          >
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '18px 18px 18px 4px',
                padding: '10px 16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)'
              }}
            >
              {[0, 1, 2].map((dot) => (
                <motion.span
                  key={dot}
                  animate={{ y: [0, -5, 0], opacity: [0.35, 1, 0.35] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: dot * 0.18, ease: "easeInOut" }}
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#806C65',
                    display: 'inline-block'
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </ScrollableFeed>

      {/* ── Context Menu */}
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
              border: '1px solid rgba(61,43,38,0.1)',
              borderRadius: 14,
              boxShadow: '0 12px 40px rgba(61,43,38,0.14)',
              padding: '6px 0',
              minWidth: 190,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {[
              {
                icon: '✏️', label: 'Edit message',
                show: (ctxMenu.msg?.sender?.id || ctxMenu.msg?.sender?._id) === loggedId,
                action: () => startEdit(ctxMenu.msg),
              },
              {
                icon: '👁', label: 'Send as view-once',
                show: false, // only from input; shown here for context
                action: () => { setCtxMenu(null); toast.info('Use 🔐 icon in input bar to send view-once', { autoClose: 2500 }); },
              },
              {
                icon: '📌', label: isBookmarked(ctxMenu.msg) ? 'Update bookmark' : 'Bookmark',
                show: true,
                action: () => { setBookmarkModal(ctxMenu.msg); setCtxMenu(null); },
              },
              {
                icon: '🕐', label: 'Schedule message',
                show: false,
                action: () => { setCtxMenu(null); },
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
    </div>
  )
}

export default ScrollableChat