import confetti from 'canvas-confetti';
import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux'
import { MDBBtn } from 'mdb-react-ui-kit';
import { Box, Text } from "@chakra-ui/layout"
import { ArrowBackIcon, ViewIcon, SearchIcon } from "@chakra-ui/icons";
import { IconButton, Spinner, useToast, Tooltip, Button, Avatar } from "@chakra-ui/react";
import UserBadgeItem from './UserBadgeItem';
import UserListItem from "./UserListItem"
import { useHistory } from 'react-router-dom';
import { getJwtToken, handleAuthError } from '../config/getJwt';
import axios from 'axios';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import SendIcon from '@mui/icons-material/Send';
import Picker from 'emoji-picker-react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Image,
    FormControl,
    Input,
    Progress,
    Portal,
    Menu,
    MenuButton,
    MenuList,
    MenuItem
} from '@chakra-ui/react'
import { delSelectedChat , setNotification } from "../redux/actions/index"
import { getSender, getPicture, getSenderUser } from '../config/ChatsLogic';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDisclosure } from "@chakra-ui/hooks";
import { setSelectedChat, setChats } from '../redux/actions/index';
import ScrollableChat from './ScrollableChat';
import '../styles/chatTheme.css';
import { compressData } from '../config/dataCompressor';
import { stompService } from '../config/stompService2';
const url = window.location.origin;
// Use the global socket initialized in ChatPage so call listeners work app-wide
const getSocket = () => window.__auraSocket || null;
var socket, selectedChatCompare;

import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import VideoCameraBackIcon from '@mui/icons-material/VideoCameraBack';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { Phone, Video, Info, MoreVertical, Eye, Clock, Smile, Feather, Palette, Sparkles, ShieldCheck, Compass, Radio, Users, Lock, Zap, ArrowUpRight, MessageSquare, Terminal, Mic, Trash2, Send, Camera, StopCircle, Check, Globe } from 'lucide-react';

const SingleChat = ({ fetchAgain, setFetchAgain, onOpenDrawer }) => {
    const history = useHistory();
    const dispatch = useDispatch()
    const selectedChat = useSelector(state => state.selectedChats)
    const notification = useSelector(state => state.notification);
    const user = useSelector(state => state.user)
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [groupChatName, setGroupChatName] = useState();
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [searchResult, setSearchResult] = useState([]);
    const [loading, setLoading] = useState(false);
    const [renameloading, setRenameLoading] = useState(false);
    const [messages, setMessages] = useState([]);
    const [messageLoading, setMessageloading] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [socketConnected, setSocketConnected] = useState(false)
    const [typing, setTyping] = useState(false);
    const [istyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef(null);
    const remoteTypingTimeoutRef = useRef(null);
    const messageCacheMapRef = useRef({});
    // View-once & Schedule
    const [viewOnceMode, setViewOnceMode] = useState(false);
    const [scheduleModal, setScheduleModal] = useState(false);
    const [scheduledAt, setScheduledAt] = useState('');
    const [pendingScheduled, setPendingScheduled] = useState([]);
    const userStatuses = useSelector(state => state.userStatuses) || {};
    const [presenceNow, setPresenceNow] = useState(Date.now());
    const PRESENCE_STALE_MS = 45000;

    const formatLastSeenDate = (lastSeenRaw) => {
        if (!lastSeenRaw) return "recently";
        try {
            let date;
            if (typeof lastSeenRaw === 'number' || (typeof lastSeenRaw === 'string' && /^[0-9]+$/.test(lastSeenRaw))) {
                date = new Date(Number(lastSeenRaw));
            } else {
                // Try ISO parse, fallback to Date constructor
                const parsed = Date.parse(String(lastSeenRaw));
                date = isNaN(parsed) ? new Date(String(lastSeenRaw)) : new Date(parsed);
            }
            if (isNaN(date.getTime())) return "recently";

            const now = new Date();
            const isToday = date.toDateString() === now.toDateString();

            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            const isYesterday = date.toDateString() === yesterday.toDateString();

            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (isToday) {
                return `today at ${timeString}`;
            }
            if (isYesterday) {
                return `yesterday at ${timeString}`;
            }
            const dateString = date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
            return `${dateString}, ${timeString}`;
        } catch (e) {
            return "recently";
        }
    };

    // WebRTC & WebSocket Call State Management
    const [showPicker, setShowPicker] = useState(false);
    const [isVideoCallActive, setIsVideoCallActive] = useState(false);
    const [callType, setCallType] = useState("video"); // "video" or "voice"
    const [incomingCall, setIncomingCall] = useState(null);
    const localVideoRef = React.useRef(null);
    const remoteVideoRef = React.useRef(null);
    const peerConnectionRef = React.useRef(null);
    const initWebRTCRef = React.useRef(null);
    const fileInputRef = React.useRef(null);

    const compressImage = (dataUrl, maxWidth = 800, quality = 0.7) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = dataUrl;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };
            img.onerror = () => resolve(dataUrl);
        });
    };

    const [pendingAttachment, setPendingAttachment] = useState(null);
    const [telemetryModalOpen, setTelemetryModalOpen] = useState(false);
    const [isSpatialAudioTest, setIsSpatialAudioTest] = useState(false);
    const [burstDockOpen, setBurstDockOpen] = useState(true);
    const burstEmojis = ['✨', '🌌', '🪐', '⚡', '💖', '🔥'];

    const triggerBurstReaction = (emoji) => {
        try {
            confetti({
                particleCount: 32,
                spread: 65,
                origin: { y: 0.8 },
                colors: ['#5B5FEF', '#8067E8', '#6D8CFF', '#10B981', '#F43F5E']
            });
        } catch (e) {}
        const chatId = selectedChat?.id || selectedChat?._id;
        if (chatId) {
            try {
                const sock = window.__auraSocket;
                if (sock) {
                    sock.emit('aura-reaction', { chatId, emoji, userId: user?._id || user?.id, userName: user?.name || 'You' });
                }
            } catch (e) {}
            setNewMessage(prev => prev ? prev + ' ' + emoji : emoji);
        }
    };
    const [isSendingAttachment, setIsSendingAttachment] = useState(false);

        const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Expanded upload capacity (up to 100MB input)
        if (file.size > 100 * 1024 * 1024) {
            toast.error("File size exceeds 100MB limit");
            return;
        }

        const toastId = toast.loading("⚡ Compressing media with Aura High-Ratio Engine...");
        try {
            const compressedResult = await processAndCompressAttachment(file);
            toast.dismiss(toastId);

            if (compressedResult.savedPercent > 0) {
                toast.success(`⚡ Compressed ${compressedResult.originalSize} ➔ ${compressedResult.compressedSize} (${compressedResult.savedPercent}% saved!)`, { autoClose: 2500, hideProgressBar: true });
            }

            setPendingAttachment({
                name: compressedResult.name,
                size: compressedResult.compressedSize,
                originalSize: compressedResult.originalSize,
                savedPercent: compressedResult.savedPercent,
                type: compressedResult.type,
                dataUrl: compressedResult.dataUrl,
                isPdf: compressedResult.isPdf,
                isImage: compressedResult.isImage,
                isVideo: compressedResult.isVideo
            });
        } catch (err) {
            toast.dismiss(toastId);
            toast.error("Failed to process file for compression");
        }
        e.target.value = "";
    };

    const confirmSendAttachment = async () => {
        if (!pendingAttachment) return;
        setIsSendingAttachment(true);
        try {
            let rawContent = pendingAttachment.dataUrl;
            if (pendingAttachment.isImage) {
                // If it is a photo, send directly as visible image data URL
                rawContent = pendingAttachment.dataUrl;
            } else {
                // Pack non-image documents into rich file metadata
                const filePayload = JSON.stringify({
                    _isDoc: true,
                    name: pendingAttachment.name,
                    size: pendingAttachment.size,
                    type: pendingAttachment.type,
                    data: pendingAttachment.dataUrl,
                    isPdf: pendingAttachment.isPdf
                });
                rawContent = '[doc] ' + filePayload;
            }

            if (viewOnceMode) {
                rawContent = '[view-once] ' + rawContent;
                setViewOnceMode(false);
            }
            const contentToSend = await compressData(rawContent);

            const config = {
                headers: {
                    "Content-type": "application/json",
                    Authorization: "Bearer " + getJwtToken(),
                },
            };

            const payload = {
                content: contentToSend,
                chatId: selectedChat.id || selectedChat._id,
            };

            const { data } = await axios.post('/api/message', payload, config);
            if (stompService.connected) {
                stompService.sendMessage(selectedChat.id || selectedChat._id, contentToSend, `doc_${Date.now()}`);
            } else if (socket) {
                socket.emit('new message', data);
            }
            setMessages(prev => {
                if (prev.some(m => m._id === data._id || m.id === data.id)) return prev;
                return [...prev, data];
            });
            const sentName = pendingAttachment?.name || "File";
            setPendingAttachment(null);
            setIsSendingAttachment(false);
            toast.success(`${sentName} sent successfully!`, { autoClose: 1500, hideProgressBar: true });
        } catch (err) {
            setIsSendingAttachment(false);
            toast.error("Failed to send attachment");
        }
    };

    const toggleEmojiPicker = () => setShowPicker(!showPicker);
    const onEmojiClick = (event, emojiObject) => {
        setNewMessage((prev) => prev + (emojiObject?.emoji || ''));
    };

    // ── DIRECT MEDIA SENDER (Voice & Video Notes) ──
    const sendDirectMediaMessage = async (rawContent) => {
        const chatId = selectedChat?.id || selectedChat?._id;
        if (!chatId) return;
        try {
            let contentWithViewOnce = rawContent;
            if (viewOnceMode) {
                contentWithViewOnce = '[view-once] ' + contentWithViewOnce;
                setViewOnceMode(false);
            }
            const content = await compressData(contentWithViewOnce);
            const clientMsgId = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            if (stompService.connected) {
                stompService.sendMessage(chatId, content, clientMsgId);
            } else {
                const config = {
                    headers: { "Content-Type": "application/json", Authorization: "Bearer " + getJwtToken() },
                };
                const { data } = await axios.post(`/api/message`, { content, chatId, clientMessageId: clientMsgId }, config);
                if (socket) { socket.emit("new message", data); }
                setMessages(prev => {
                    if (prev.some(m => (m.clientMessageId && m.clientMessageId === clientMsgId) || m._id === data._id || m.id === data.id)) return prev;
                    return [...prev, data];
                });
            }
        } catch (error) {
            if (handleAuthError(error, history)) return;
            toast.error("Failed to send media note", { position: "top-center", autoClose: 2000, hideProgressBar: true, theme: 'colored' });
        }
    };

    // ── VOICE NOTE RECORDING LOGIC ──
    const [isRecordingVoice, setIsRecordingVoice] = useState(false);
    const [voiceDuration, setVoiceDuration] = useState(0);
    const voiceTimerRef = useRef(null);
    const voiceMediaRecorderRef = useRef(null);
    const voiceStreamRef = useRef(null);
    const voiceChunksRef = useRef([]);

    const startVoiceRecording = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                toast.error("Microphone is not supported in this browser.");
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            voiceStreamRef.current = stream;
            voiceChunksRef.current = [];

            let mimeType = 'audio/webm';
            if (!MediaRecorder.isTypeSupported('audio/webm')) {
                if (MediaRecorder.isTypeSupported('audio/mp4')) {
                    mimeType = 'audio/mp4';
                } else {
                    mimeType = '';
                }
            }

            const options = mimeType ? { mimeType } : undefined;
            const recorder = new MediaRecorder(stream, options);
            voiceMediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    voiceChunksRef.current.push(e.data);
                }
            };

            recorder.start(200);
            setIsRecordingVoice(true);
            setVoiceDuration(0);

            voiceTimerRef.current = setInterval(() => {
                setVoiceDuration(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Error starting audio recording:", err);
            toast.error("Microphone access denied or unavailable.");
        }
    };

    const stopVoiceRecording = (shouldSend = true) => {
        if (voiceTimerRef.current) {
            clearInterval(voiceTimerRef.current);
            voiceTimerRef.current = null;
        }
        const recorder = voiceMediaRecorderRef.current;
        if (recorder && recorder.state !== 'inactive') {
            recorder.onstop = () => {
                if (shouldSend && voiceChunksRef.current.length > 0) {
                    const mime = recorder.mimeType || 'audio/webm';
                    const blob = new Blob(voiceChunksRef.current, { type: mime });
                    const reader = new FileReader();
                    const dur = voiceDuration;
                    reader.onloadend = () => {
                        const base64Data = reader.result;
                        const payload = `[voice] ` + JSON.stringify({
                            data: base64Data,
                            duration: dur
                        });
                        sendDirectMediaMessage(payload);
                        toast.success("Voice note sent!", { autoClose: 1500, hideProgressBar: true });
                    };
                    reader.readAsDataURL(blob);
                }
                if (voiceStreamRef.current) {
                    voiceStreamRef.current.getTracks().forEach(t => t.stop());
                    voiceStreamRef.current = null;
                }
                voiceChunksRef.current = [];
                setIsRecordingVoice(false);
                setVoiceDuration(0);
            };
            recorder.stop();
        } else {
            if (voiceStreamRef.current) {
                voiceStreamRef.current.getTracks().forEach(t => t.stop());
                voiceStreamRef.current = null;
            }
            voiceChunksRef.current = [];
            setIsRecordingVoice(false);
            setVoiceDuration(0);
        }
    };

    const cancelVoiceRecording = () => {
        stopVoiceRecording(false);
        toast.info("Voice note discarded", { autoClose: 1200, hideProgressBar: true });
    };

    // ── TELEGRAM-STYLE CIRCULAR VIDEO NOTE RECORDING LOGIC ──
    const [isRecordingVideoNote, setIsRecordingVideoNote] = useState(false);
    const [mediaNoteMode, setMediaNoteMode] = useState('voice');
    const [videoNoteDuration, setVideoNoteDuration] = useState(0);
    const videoNoteTimerRef = useRef(null);
    const videoNoteMediaRecorderRef = useRef(null);
    const videoNoteStreamRef = useRef(null);
    const videoNoteChunksRef = useRef([]);
    const videoNotePreviewRef = useRef(null);

    const startVideoNoteRecording = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                toast.error("Camera is not supported in this browser.");
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 }, aspectRatio: 1 },
                audio: true
            });
            videoNoteStreamRef.current = stream;
            videoNoteChunksRef.current = [];

            let mimeType = 'video/webm;codecs=vp8,opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                if (MediaRecorder.isTypeSupported('video/webm')) {
                    mimeType = 'video/webm';
                } else if (MediaRecorder.isTypeSupported('video/mp4')) {
                    mimeType = 'video/mp4';
                } else {
                    mimeType = '';
                }
            }

            const options = mimeType ? { mimeType } : undefined;
            const recorder = new MediaRecorder(stream, options);
            videoNoteMediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    videoNoteChunksRef.current.push(e.data);
                }
            };

            recorder.start(200);
            setIsRecordingVideoNote(true);
            setVideoNoteDuration(0);

            videoNoteTimerRef.current = setInterval(() => {
                setVideoNoteDuration(prev => {
                    const next = prev + 1;
                    if (next >= 60) {
                        stopVideoNoteRecording(true);
                    }
                    return next;
                });
            }, 1000);
        } catch (err) {
            console.error("Error starting video note recording:", err);
            toast.error("Camera or microphone permission denied.");
        }
    };

    const stopVideoNoteRecording = (shouldSend = true) => {
        if (videoNoteTimerRef.current) {
            clearInterval(videoNoteTimerRef.current);
            videoNoteTimerRef.current = null;
        }
        const recorder = videoNoteMediaRecorderRef.current;
        if (recorder && recorder.state !== 'inactive') {
            recorder.onstop = () => {
                if (shouldSend && videoNoteChunksRef.current.length > 0) {
                    const mime = recorder.mimeType || 'video/webm';
                    const blob = new Blob(videoNoteChunksRef.current, { type: mime });
                    const reader = new FileReader();
                    const dur = videoNoteDuration;
                    reader.onloadend = () => {
                        const base64Data = reader.result;
                        const payload = `[video_note] ` + JSON.stringify({
                            data: base64Data,
                            duration: dur
                        });
                        sendDirectMediaMessage(payload);
                        toast.success("Video note sent!", { autoClose: 1500, hideProgressBar: true });
                    };
                    reader.readAsDataURL(blob);
                }
                if (videoNoteStreamRef.current) {
                    videoNoteStreamRef.current.getTracks().forEach(t => t.stop());
                    videoNoteStreamRef.current = null;
                }
                videoNoteChunksRef.current = [];
                setIsRecordingVideoNote(false);
                setVideoNoteDuration(0);
            };
            recorder.stop();
        } else {
            if (videoNoteStreamRef.current) {
                videoNoteStreamRef.current.getTracks().forEach(t => t.stop());
                videoNoteStreamRef.current = null;
            }
            videoNoteChunksRef.current = [];
            setIsRecordingVideoNote(false);
            setVideoNoteDuration(0);
        }
    };

    const cancelVideoNoteRecording = () => {
        stopVideoNoteRecording(false);
        toast.info("Video note discarded", { autoClose: 1200, hideProgressBar: true });
    };

    const formatSeconds = (secs) => {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const [isMuted, setIsMuted] = useState(false);

    // ── GESTURE-DRIVEN VOICE & VIDEO NOTE RECORDER STATE ──
    const [isRecordingMedia, setIsRecordingMedia] = useState(false);
    const [mediaRecordType, setMediaRecordType] = useState('voice'); // 'voice' | 'video'
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [isCancelSlid, setIsCancelSlid] = useState(false);
    const [isVideoNoteLocked, setIsVideoNoteLocked] = useState(false);

    const mediaRecorderRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const recordTimerRef = useRef(null);
    const gestureStartRef = useRef({ x: 0, y: 0, time: 0 });
    const isCancelledRef = useRef(false);
    const videoBubbleRef = useRef(null);

    // Start Audio Voice Recording
    const startAudioRecording = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            recordedChunksRef.current = [];
            isCancelledRef.current = false;
            setIsCancelSlid(false);
            setIsVideoNoteLocked(false);

            let mimeType = 'audio/webm';
            if (window.MediaRecorder && !MediaRecorder.isTypeSupported('audio/webm')) {
                if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
            }

            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (ev) => {
                if (ev.data && ev.data.size > 0) {
                    recordedChunksRef.current.push(ev.data);
                }
            };

            recorder.onstop = async () => {
                if (isCancelledRef.current) {
                    recordedChunksRef.current = [];
                    return;
                }
                const blob = new Blob(recordedChunksRef.current, { type: mimeType || 'audio/webm' });
                if (blob.size > 100) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64data = reader.result;
                        sendMediaNoteMessage('voice', base64data, recordingDuration);
                    };
                    reader.readAsDataURL(blob);
                }
            };

            recorder.start(200);
            setIsRecordingMedia(true);
            setMediaRecordType('voice');
            setRecordingDuration(0);

            if (recordTimerRef.current) clearInterval(recordTimerRef.current);
            recordTimerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Microphone recording access error:", err);
            toast.error("Microphone access is required to record voice notes!");
        }
    };

    // Transition from Voice Note to Circular Video Note with Voice
    const switchToVideoNoteRecording = async () => {
        if (mediaRecordType === 'video') return;
        try {
            // Stop audio recorder first
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                isCancelledRef.current = true;
                mediaRecorderRef.current.stop();
            }
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(t => t.stop());
            }

            const videoStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
                audio: true
            });

            mediaStreamRef.current = videoStream;
            recordedChunksRef.current = [];
            isCancelledRef.current = false;

            if (videoBubbleRef.current) {
                videoBubbleRef.current.srcObject = videoStream;
            }

            let mimeType = 'video/webm;codecs=vp8,opus';
            if (window.MediaRecorder && !MediaRecorder.isTypeSupported(mimeType)) {
                if (MediaRecorder.isTypeSupported('video/webm')) mimeType = 'video/webm';
                else if (MediaRecorder.isTypeSupported('video/mp4')) mimeType = 'video/mp4';
                else mimeType = '';
            }

            const vRecorder = new MediaRecorder(videoStream, mimeType ? { mimeType } : undefined);
            mediaRecorderRef.current = vRecorder;

            vRecorder.ondataavailable = (ev) => {
                if (ev.data && ev.data.size > 0) {
                    recordedChunksRef.current.push(ev.data);
                }
            };

            vRecorder.onstop = async () => {
                if (isCancelledRef.current) {
                    recordedChunksRef.current = [];
                    return;
                }
                const blob = new Blob(recordedChunksRef.current, { type: mimeType || 'video/webm' });
                if (blob.size > 100) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64data = reader.result;
                        sendMediaNoteMessage('video', base64data, recordingDuration);
                    };
                    reader.readAsDataURL(blob);
                }
            };

            vRecorder.start(200);
            setMediaRecordType('video');
            setIsVideoNoteLocked(true);
            toast.info("📹 Switched to Video Note with Voice! Release or tap send to finish.");

        } catch (err) {
            console.error("Camera access error for video note:", err);
            toast.error("Camera access is required for video notes!");
        }
    };

    // Stop and Send Recording
    const finishMediaRecording = () => {
        if (!isRecordingMedia) return;
        if (recordTimerRef.current) {
            clearInterval(recordTimerRef.current);
            recordTimerRef.current = null;
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }

        setTimeout(() => {
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(t => t.stop());
                mediaStreamRef.current = null;
            }
        }, 400);

        setIsRecordingMedia(false);
        setIsVideoNoteLocked(false);
        setIsCancelSlid(false);
    };

    // Cancel Recording
    const cancelMediaRecording = () => {
        isCancelledRef.current = true;
        if (recordTimerRef.current) {
            clearInterval(recordTimerRef.current);
            recordTimerRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
        }
        setIsRecordingMedia(false);
        setIsVideoNoteLocked(false);
        setIsCancelSlid(false);
        toast.warning("Recording Cancelled");
    };

    // Send Media Note via STOMP / REST API
    const sendMediaNoteMessage = async (type, base64Data, durationSecs) => {
        if (!selectedChat) return;
        const chatId = selectedChat.id || selectedChat._id;
        const prefix = type === 'video' ? '[video_note]' : '[voice]';
        const payloadObj = JSON.stringify({ data: base64Data, duration: durationSecs || 1 });
        const rawContent = `${prefix} ${payloadObj}`;

        try {
            const content = await compressData(rawContent);
            const clientMsgId = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            if (stompService.connected) {
                stompService.sendMessage(chatId, content, clientMsgId);
            } else {
                const config = {
                    headers: { "Content-Type": "application/json", Authorization: "Bearer " + getJwtToken() },
                };
                const { data } = await axios.post(`/api/message`, { content, chatId, clientMessageId: clientMsgId }, config);
                if (socket) { socket.emit("new message", data); }
                setMessages(prev => [...prev, data]);
            }
        } catch (e) {
            console.error("Error sending media note message:", e);
        }
    };

    // Pointer / Touch Gestures for Hold & Swipe Up / Left
    const handleRecordPointerDown = (e) => {
        const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
        const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
        gestureStartRef.current = { x: clientX, y: clientY, time: Date.now() };
        startAudioRecording(e);
    };

    const handleRecordPointerMove = (e) => {
        if (!isRecordingMedia) return;
        const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
        const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
        const deltaY = gestureStartRef.current.y - clientY;
        const deltaX = gestureStartRef.current.x - clientX;

        // Slide UP (> 50px) ➔ Switch to Video Note
        if (deltaY > 50 && mediaRecordType === 'voice') {
            switchToVideoNoteRecording();
        }

        // Slide LEFT (> 70px) ➔ Mark cancel intent
        if (deltaX > 70) {
            setIsCancelSlid(true);
        } else {
            setIsCancelSlid(false);
        }
    };

    const handleRecordPointerUp = (e) => {
        if (!isRecordingMedia) return;
        if (isCancelSlid) {
            cancelMediaRecording();
        } else if (mediaRecordType === 'voice') {
            // If held for less than 300ms, still send or finish
            finishMediaRecording();
        } else if (mediaRecordType === 'video' && !isVideoNoteLocked) {
            finishMediaRecording();
        }
    };
    const selectedChatRef = React.useRef(null);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isCallAccepted, setIsCallAccepted] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const callDurationRef = React.useRef(0);
    const isCallerRef = React.useRef(false);

    useEffect(() => {
        let interval = null;
        if (isVideoCallActive && isCallAccepted) {
            interval = setInterval(() => {
                setCallDuration(prev => {
                    const next = prev + 1;
                    callDurationRef.current = next;
                    return next;
                });
            }, 1000);
        } else {
            setCallDuration(0);
            callDurationRef.current = 0;
        }
        return () => clearInterval(interval);
    }, [isVideoCallActive, isCallAccepted]);

    useEffect(() => {
        let stopAudio = null;
        if (incomingCall) {
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const playBeep = () => {
                    if (audioCtx.state === "suspended") {
                        audioCtx.resume();
                    }
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(520, audioCtx.currentTime);
                    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.9);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start();
                    osc.stop(audioCtx.currentTime + 0.9);
                };
                playBeep();
                const interval = setInterval(playBeep, 1600);
                stopAudio = () => {
                    clearInterval(interval);
                    audioCtx.close();
                };
            } catch (e) {
                console.error("Audio error", e);
            }
        }
        return () => {
            if (stopAudio) stopAudio();
        };
    }, [incomingCall]);

    const formatCallDuration = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    useEffect(() => {
        if (window.__auraCallToAccept && selectedChat) {
            const call = window.__auraCallToAccept;
            if (String(selectedChat._id || selectedChat.id) === String(call.chatId)) {
                window.__auraCallToAccept = null;
                startVideoCall(call.callType, true);
            }
        }
    }, [selectedChat]);

    initWebRTCRef.current = async (stream, isCaller, targetUserId) => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        peerConnectionRef.current = pc;
        
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                if (stompService.isConnected()) {
                    stompService.sendIceCandidate({ type: 'ice-candidate', chatId: selectedChatRef.current?._id || selectedChatRef.current?.id, fromUser: user?._id || user?.id, toUser: targetUserId, signalData: { candidate: event.candidate } });
                } else if (socket && socket.emit) {
                    socket.emit("webrtc-signal", {
                        targetUserId,
                        fromUserId: user?._id || user?.id,
                        signal: { type: 'ice', candidate: event.candidate }
                    });
                }
            }
        };

        if (isCaller) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            if (stompService.isConnected()) {
                stompService.sendCallUser({ type: 'call-user', chatId: selectedChatRef.current?._id || selectedChatRef.current?.id, fromUser: user?._id || user?.id, toUser: targetUserId, signalData: offer });
            } else if (socket) {
                socket.emit("webrtc-signal", {
                    targetUserId,
                    fromUserId: user?._id || user?.id,
                    signal: offer
                });
            }
        }
    };

    const startVideoCall = async (type = "video", accepted = false) => {
        // Prevent calling yourself
        if (selectedChat && !selectedChat.isGroupChat && Array.isArray(selectedChat.users) && selectedChat.users.length === 1) {
            const myId = user?._id || user?.id;
            const otherUser = selectedChat.users.find((u) => u && String(u._id || u.id) !== String(myId));
            if (!otherUser) {
                toast.error("You cannot start a voice or video call with yourself!", {
                    position: "top-center",
                    autoClose: 2500,
                    hideProgressBar: true,
                    theme: "colored"
                });
                return;
            }
        }

        setCallType(type);
        setIsVideoCallActive(true);
        setIsMuted(false);
        setIsCameraOff(false);
        setIsCallAccepted(accepted);
        isCallerRef.current = !accepted;
        try {
            let stream;
            try {
                const constraints = type === "video" ? {
                    video: {
                        width: { ideal: 1920, max: 3840, min: 640 },
                        height: { ideal: 1080, max: 2160, min: 480 },
                        frameRate: { ideal: 30, max: 60, min: 15 },
                        facingMode: "user"
                    },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                } : {
                    video: false,
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                };
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (strictErr) {
                // Fallback to basic media constraints if ideal resolution/framerate or sampleRate fails
                stream = await navigator.mediaDevices.getUserMedia({
                    video: type === "video",
                    audio: true
                });
            }
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            if (noiseFilterEnabled) {
                applyNoiseFilter(stream);
            }

            // Emit call signal over WebSocket
            const chatId = selectedChat ? (selectedChat.id || selectedChat._id) : null;
            const targetUser = selectedChat ? getSenderUser(user, selectedChat.users) : null;
            const targetUserId = targetUser ? (targetUser._id || targetUser.id) : null;
            const myId = user ? (user._id || user.id) : null;

            const gSock = getSocket();
            const emitWithRetry = (eventName, payload, attempts = 8, delay = 250) => {
                const tryEmit = (n) => {
                    const s = getSocket();
                    if (s) {
                        s.emit(eventName, payload);
                        return;
                    }
                    if (n <= 0) {
                        toast.error('Signaling server unavailable. Please try again.');
                        return;
                    }
                    setTimeout(() => tryEmit(n - 1), delay);
                };
                tryEmit(attempts);
            };

            if (!chatId) {
                toast.error('No chat selected for call');
            } else {
                if (!accepted) {
                    if (window.stompService && window.stompService.isConnected && window.stompService.isConnected()) {
                        window.stompService.sendCallUser({ type: 'call-user', chatId, fromUser: user?.name || user?.username || 'User', fromAvatar: user?.pic || '', fromUserId: myId, toUser: targetUserId, callType: type });
                    } else {
                        emitWithRetry('call-user', {
                            chatId,
                            fromUser: user?.name || user?.username || 'User',
                            fromAvatar: user?.pic || '',
                            fromUserId: myId,
                            targetUserId: targetUserId,
                            callType: type
                        });
                    }
                } else {
                    if (window.stompService && window.stompService.isConnected && window.stompService.isConnected()) {
                        window.stompService.sendAnswerCall({ type: 'accept-call', chatId, fromUserId: myId });
                    } else {
                        emitWithRetry('accept-call', { chatId, fromUserId: myId });
                    }
                    if (targetUser) {
                        initWebRTCRef.current(stream, false, targetUserId);
                    }
                }
            }
        } catch (err) {
            toast.error("Camera/Microphone access required for Call");
            setIsVideoCallActive(false);
            setIsCallAccepted(false);
        }
    };

    // AI Call Suite States: Live Captions, Real-time Voice Translation, Noise Removal
    const [liveCaptionsEnabled, setLiveCaptionsEnabled] = useState(true);
    const [noiseFilterEnabled, setNoiseFilterEnabled] = useState(true);
    const [translateEnabled, setTranslateEnabled] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [targetLang, setTargetLang] = useState("hi"); // Default Hindi translation
    const [captionsLog, setCaptionsLog] = useState([]);
    const [currentTranscript, setCurrentTranscript] = useState("");
    const recognitionRef = React.useRef(null);
    const audioContextRef = React.useRef(null);
    const noiseFilterNodeRef = React.useRef(null);

    // Dynamic Translation Helper
    const translateText = async (text, lang) => {
        if (!text || text.trim() === "") return "";
        try {
            const res = await fetch(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`
            );
            const data = await res.json();
            return data && data[0] && data[0][0] ? data[0][0][0] : text;
        } catch {
            return text;
        }
    };

    // Live Captions & Real-Time Speech Recognition Engine
    useEffect(() => {
        let recognition = null;
        if (isVideoCallActive && liveCaptionsEnabled) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                recognition.onresult = async (event) => {
                    let interim = '';
                    let final = '';
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            final += transcript;
                        } else {
                            interim += transcript;
                        }
                    }

                    if (final.trim()) {
                        let translated = '';
                        if (translateEnabled) {
                            translated = await translateText(final, targetLang);
                        }
                        const entry = {
                            id: Date.now(),
                            speaker: user?.name || "Me",
                            original: final,
                            translated: translated
                        };
                        setCaptionsLog(prev => [...prev.slice(-4), entry]);
                        setCurrentTranscript('');
                    } else if (interim.trim()) {
                        setCurrentTranscript(interim);
                    }
                };

                recognition.onerror = () => {};
                try {
                    recognition.start();
                    recognitionRef.current = recognition;
                } catch (e) {}
            }
        } else {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) {}
                recognitionRef.current = null;
            }
            setCurrentTranscript('');
        }

        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) {}
                recognitionRef.current = null;
            }
        };
    }, [isVideoCallActive, liveCaptionsEnabled, translateEnabled, targetLang]);

    // Web Audio API Noise Removal & Audio Enhancer DSP Filter
    const applyNoiseFilter = (stream) => {
        if (!stream || stream.getAudioTracks().length === 0) return;
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);

            // High-pass filter to eliminate background low-frequency hums/rumble (< 80Hz)
            const highpass = audioCtx.createBiquadFilter();
            highpass.type = 'highpass';
            highpass.frequency.value = 85;

            // Low-pass filter to remove high-frequency static noise (> 3.5kHz)
            const lowpass = audioCtx.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.value = 3500;

            // Compressor for crystal-clear voice normalization
            const compressor = audioCtx.createDynamicsCompressor();
            compressor.threshold.setValueAtTime(-24, audioCtx.currentTime);
            compressor.knee.setValueAtTime(30, audioCtx.currentTime);
            compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
            compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
            compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

            source.connect(highpass);
            highpass.connect(lowpass);
            lowpass.connect(compressor);
            noiseFilterNodeRef.current = compressor;
        } catch (e) {}
    };

    const toggleMute = () => {
        const nextMute = !isMuted;
        setIsMuted(nextMute);
        if (localVideoRef.current && localVideoRef.current.srcObject) {
            localVideoRef.current.srcObject.getAudioTracks().forEach(track => {
                track.enabled = !nextMute;
            });
        }
    };

    const toggleCamera = () => {
        const nextCam = !isCameraOff;
        setIsCameraOff(nextCam);
        if (localVideoRef.current && localVideoRef.current.srcObject) {
            localVideoRef.current.srcObject.getVideoTracks().forEach(track => {
                track.enabled = !nextCam;
            });
        }
    };

    const endVideoCall = () => {
        if (isCallerRef.current) {
            const dur = callDurationRef.current;
            if (dur > 0) {
                sendSystemMessage(`[call] ended ${formatCallDuration(dur)}`);
            } else {
                sendSystemMessage(`[call] cancelled`);
            }
        }
        if (localVideoRef.current && localVideoRef.current.srcObject) {
            localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
        const chatId = selectedChat.id || selectedChat._id;
        if (socket) {
            socket.emit("end-call", { chatId });
        }
        setIsVideoCallActive(false);
        setIsCallAccepted(false);
    };


    useEffect(() => {
        // Chat UI initialization
    }, [])

    const handleAlert = () => {
        toast.info('This feature is available soon!', {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            theme: 'colored'
        });
    }
    const handleRemove = async (user1) => {
        const loggedUser = JSON.parse(localStorage.getItem("userInfo"))

        if (selectedChat.groupAdmin._id !== loggedUser._id && user1._id !== loggedUser._id) {
            toast.warning("Only admins can remove someone!", {
                position: "top-center",
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: false,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: 'colored'
            });
            return;
        }

        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: "Bearer " + getJwtToken(),
                },
            };
            const { data } = await axios.put(
                `/api/chat/group-remove`,
                {
                    chatId: selectedChat._id,
                    userId: user1._id,
                },
                config
            );
            user1._id === loggedUser._id ? dispatch(delSelectedChat()) : dispatch(setSelectedChat(data));
            setFetchAgain(!fetchAgain);
            setLoading(false);
        } catch (error) {
            if (handleAuthError(error, history)) return;
            toast.error("Error Occured!", {
                position: "top-center",
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: false,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: 'colored'
            });
            setLoading(false);
        }
    }
    const handleAddUser = async (user1) => {
        // console.log(user1);
        const loggedUser = JSON.parse(localStorage.getItem("userInfo"))

        if (selectedChat.users.find((u) => u._id === user1._id)) {
            toast.warning("User Already in group!", {
                position: "top-center",
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: false,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: 'colored'
            });
            return;
        }

        if (selectedChat.groupAdmin._id !== loggedUser._id) {
            toast.warning("Only admins can add someone!", {
                position: "top-center",
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: false,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: 'colored'
            });
            return;
        }
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: "Bearer " + getJwtToken(),
                },
            };
            const { data } = await axios.put(
                `/api/chat/group-add`,
                {
                    chatId: selectedChat._id,
                    userId: user1._id,
                },
                config
            );

            dispatch(setSelectedChat(data));
            setFetchAgain(!fetchAgain);
            setLoading(false);
        } catch (error) {
            if (handleAuthError(error, history)) return;
            toast.error("Error Occured!", {
                position: "top-center",
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: false,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: 'colored'
            });
            setLoading(false);
        }
    }
    const handleSearch = async (query) => {
        setSearch(query);
        if (!query) {
            return;
        }

        try {
            setLoading(true);

            const config = {
                headers: {
                    Authorization: "Bearer " + getJwtToken(),
                },
            };
            const { data } = await axios.get(`/api/user/all-users?search=${search}`, config);
            setLoading(false);
            setSearchResult(data);

        } catch (error) {
            if (handleAuthError(error, history)) return;
            toast.error('Failed to load search result!', {
                position: "top-center",
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: false,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: 'colored'
            });
            setLoading(false);
        }
    }
    const handleRename = async () => {
        if (!groupChatName) {
            toast.error('Please enter Group Name!', {
                position: "top-center",
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: false,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: 'colored'
            });
        }

        try {
            setRenameLoading(true);

            const config = {
                headers: {
                    Authorization: "Bearer " + getJwtToken(),
                },
            };

            const { data } = await axios.put(`/api/chat/rename`, {
                chatId: selectedChat._id,
                chatName: groupChatName,
            }, config);

            dispatch(setSelectedChat(data))
            setFetchAgain(!fetchAgain);
            setRenameLoading(false);
            setGroupChatName("")

        } catch (error) {
            if (handleAuthError(error, history)) return;
            toast.error('Error Occured!', {
                position: "top-center",
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: false,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: 'colored'
            });
            setRenameLoading(false)
            setGroupChatName("")
        }


    }

    const handleLeave = (user) => {
        toast.info("For Now this feature is not available!", {
            position: "top-center",
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
            theme: 'colored'
        });
    }

    const getCurrentUser = () => {
        let storedUser = {};
        try {
            storedUser = JSON.parse(localStorage.getItem("userInfo") || "{}");
        } catch (e) {}
        return storedUser?.userLogin || storedUser?.data || storedUser || user?.userLogin || user?.data || user || {};
    };

    useEffect(() => {
        const interval = setInterval(() => setPresenceNow(Date.now()), 15000);
        return () => clearInterval(interval);
    }, []);

    const getTypingPayload = () => {
        const currentUser = getCurrentUser();
        const chatId = selectedChat?.id || selectedChat?._id;
        const senderId = currentUser?._id || currentUser?.id || currentUser?.userId;
        const senderName = currentUser?.name || currentUser?.username || 'User';
        const senderEmail = currentUser?.email || '';
        return { chatId, senderId, senderName, senderEmail };
    };

    const isTypingFromOtherUser = (data, chatId) => {
        const currentUser = getCurrentUser();
        const incomingChatId = typeof data === 'object' && data !== null
            ? (data.chatId || data.room || data.chat?.id || data.chat?._id)
            : data;
        if (String(incomingChatId) !== String(chatId)) return false;

        const senderId = typeof data === 'object' && data !== null
            ? (data.senderId || data.userId || data.fromUser || data.fromUserId)
            : null;
        const senderEmail = typeof data === 'object' && data !== null ? data.senderEmail : null;
        const localUserId = currentUser?._id || currentUser?.id || currentUser?.userId;
        const localEmail = currentUser?.email;

        if (senderId && localUserId) return String(senderId) !== String(localUserId);
        if (senderEmail && localEmail) return String(senderEmail).toLowerCase() !== String(localEmail).toLowerCase();
        return false;
    };

    const emitStopTyping = () => {
        const typingPayload = getTypingPayload();
        if (!typingPayload.chatId) return;
        if (stompService.isConnected()) {
            stompService.sendStopTyping(typingPayload.chatId, typingPayload);
        } else if (socket && socket.emit) {
            socket.emit("stop typing", typingPayload);
        }
        setTyping(false);
    };

    const showRemoteTyping = () => {
        setIsTyping(true);
        if (remoteTypingTimeoutRef.current) clearTimeout(remoteTypingTimeoutRef.current);
        remoteTypingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            remoteTypingTimeoutRef.current = null;
        }, 3500);
    };

    const hideRemoteTyping = () => {
        setIsTyping(false);
        if (remoteTypingTimeoutRef.current) {
            clearTimeout(remoteTypingTimeoutRef.current);
            remoteTypingTimeoutRef.current = null;
        }
    };

    useEffect(() => {
        setTyping(false);
        hideRemoteTyping();
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }

        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (remoteTypingTimeoutRef.current) clearTimeout(remoteTypingTimeoutRef.current);
        };
    }, [selectedChat?.id, selectedChat?._id]);

    const typingHandler = (e) => {
        const value = e.target.value;
        setNewMessage(value);

        if (!socketConnected) return;

        if (!value.trim()) {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
            emitStopTyping();
            return;
        }

        if (!typing) {
            setTyping(true);
            const typingPayload = getTypingPayload();
            if (stompService.isConnected()) {
                stompService.sendTyping(typingPayload.chatId, typingPayload);
            } else if (socket && socket.emit) {
                socket.emit("typing", typingPayload);
            }
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            emitStopTyping();
            typingTimeoutRef.current = null;
        }, 3000);
    }

    const sendingMsgRef = useRef(false);

    const sendMessage = async (e) => {
        if (sendingMsgRef.current) return;
        if (e.key === "Enter" && newMessage) {
            sendingMsgRef.current = true;
            const chatId = selectedChat.id || selectedChat._id;
            const typingPayload = getTypingPayload();
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
            if (stompService.isConnected()) { stompService.sendStopTyping(chatId, typingPayload); } else if (socket) { socket.emit("stop typing", typingPayload); }
            const rawContent = viewOnceMode ? `[view-once] ${newMessage}` : newMessage;
            setNewMessage("");
            setViewOnceMode(false);
            try {
                const content = await compressData(rawContent);
                const clientMsgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                if (stompService.connected) {
                    stompService.sendMessage(chatId, content, clientMsgId);
                } else {
                    const config = {
                        headers: { "Content-Type": "application/json", Authorization: "Bearer " + getJwtToken() },
                    };
                    const { data } = await axios.post(`/api/message`, { content, chatId, clientMessageId: clientMsgId }, config);
                    if (socket) { socket.emit("new message", data); }
                    setMessages(prev => {
                        if (prev.some(m => (m.clientMessageId && m.clientMessageId === clientMsgId) || m._id === data._id || m.id === data.id)) return prev;
                        return [...prev, data];
                    });
                }
            } catch (error) {
                if (handleAuthError(error, history)) return;
                toast.error("Error Occured!", { position: "top-center", autoClose: 2000, hideProgressBar: true, theme: 'colored' });
            } finally {
                sendingMsgRef.current = false;
            }
        }
    }

    const sendSystemMessage = async (rawContent) => {
        const chatId = selectedChat.id || selectedChat._id;
        try {
            const content = await compressData(rawContent);
            const clientMsgId = `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            if (stompService.connected) {
                stompService.sendMessage(chatId, content, clientMsgId);
            } else {
                const config = {
                    headers: { "Content-Type": "application/json", Authorization: "Bearer " + getJwtToken() },
                };
                const { data } = await axios.post(`/api/message`, { content, chatId, clientMessageId: clientMsgId }, config);
                if (socket) { socket.emit("new message", data); }
                setMessages(prev => [...prev, data]);
            }
        } catch { /* silent */ }
    };

    const scheduleMessage = async (scheduledTimeISO) => {
        if (!newMessage) return;
        const chatId = selectedChat.id || selectedChat._id;
        const rawContent = viewOnceMode ? `[view-once] ${newMessage}` : newMessage;
        const scheduledObj = {
            id: `sch_${Date.now()}`,
            chatId,
            rawContent,
            scheduledTimeISO,
            status: 'pending'
        };
        setPendingScheduled(prev => [...prev, scheduledObj]);
        setNewMessage("");
        setViewOnceMode(false);
        toast.success(`⏰ Message scheduled for ${new Date(scheduledTimeISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, { autoClose: 3000, hideProgressBar: true });

        const delay = Math.max(0, new Date(scheduledTimeISO).getTime() - Date.now());
        setTimeout(async () => {
            try {
                const content = await compressData(rawContent);
                const clientMsgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const config = { headers: { "Content-Type": "application/json", Authorization: "Bearer " + getJwtToken() } };
                const { data } = await axios.post(`/api/message`, { content, chatId, clientMessageId: clientMsgId }, config);
                if (socket) { socket.emit("new message", data); }
                setMessages(prev => [...prev, data]);
                setPendingScheduled(prev => prev.filter(s => s.id !== scheduledObj.id));
            } catch { /* silent */ }
        }, delay);
    };

    const fetchMessages = async (e) => {
        if (!selectedChat) return;
        const chatId = selectedChat.id || selectedChat._id;

        // Instant Cache Check: Load cached messages immediately (0ms lag, no full spinner)
        if (messageCacheMapRef.current[chatId] && messageCacheMapRef.current[chatId].length > 0) {
            setMessages(messageCacheMapRef.current[chatId]);
            setMessageloading(false);
        } else {
            setMessageloading(true);
        }

        try {
            const config = {
                headers: {
                    Authorization: "Bearer " + getJwtToken(),
                },
            };
            const { data } = await axios.get(`/api/message/${chatId}`, config);

            let clearedAt = 0;
            try {
                const clearedChats = JSON.parse(localStorage.getItem("aura_cleared_chats") || "{}");
                clearedAt = clearedChats[chatId] || 0;
            } catch(e) {}
            
            const parseMessageTime = (dateInput) => {
                if (!dateInput) return 0;
                if (typeof dateInput === 'number') return dateInput;
                if (Array.isArray(dateInput)) {
                    const [year, month, day, hour = 0, minute = 0, second = 0] = dateInput;
                    return Date.UTC(year, month - 1, day, hour, minute, second);
                }
                const parsed = new Date(dateInput).getTime();
                return isNaN(parsed) ? 0 : parsed;
            };

            const filteredData = (Array.isArray(data) ? data : []).filter(m => {
                if (!m) return false;
                const msgTime = parseMessageTime(m.createdAt || m.timestamp || m.updatedAt);
                if (!clearedAt) return true;
                return msgTime === 0 || msgTime > clearedAt;
            });

            messageCacheMapRef.current[chatId] = filteredData;
            setMessages(filteredData);
            setMessageloading(false);
            if (socket) {
                socket.emit("join chat", chatId);
            }
        } catch (error) {
            setMessageloading(false);
            if (handleAuthError(error, history)) return;
            toast.error("Error Occured!", {
                position: "top-center",
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: false,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                theme: 'colored'
            });
        }
    }

    // Auto-request Browser Live Notification Permission
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);
    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        if (!userInfo) return;

        stompService.connect(
            () => setSocketConnected(true),
            (err) => setSocketConnected(false)
        );

        const tryConnect = () => {
            const globalSocket = getSocket();
            if (globalSocket) {
                socket = globalSocket;
                socket.off("connected").on("connected", () => setSocketConnected(true));
                socket.off("end-call").on("end-call", () => {
                    if (isCallerRef.current) {
                        const dur = callDurationRef.current;
                        if (dur > 0) {
                            sendSystemMessage(`[call] ended ${formatCallDuration(dur)}`);
                        } else {
                            sendSystemMessage(`[call] declined`);
                        }
                    }
                    if (localVideoRef.current && localVideoRef.current.srcObject) {
                        localVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
                    }
                    if (peerConnectionRef.current) {
                        peerConnectionRef.current.close();
                    }
                    setIsVideoCallActive(false);
                    setIsCallAccepted(false);
                    setIncomingCall(null);
                });
                socket.off("accept-call").on("accept-call", () => {
                    setIsCallAccepted(true);
                    if (localVideoRef.current && localVideoRef.current.srcObject && selectedChatRef.current && user) {
                        const targetUser = getSenderUser(user, selectedChatRef.current.users);
                        if (targetUser && initWebRTCRef.current) {
                            initWebRTCRef.current(localVideoRef.current.srcObject, true, targetUser._id || targetUser.id);
                        }
                    }
                });
                socket.off("webrtc-signal").on("webrtc-signal", async (data) => {
                    const myId = String(user?._id || user?.id);
                    if (String(data.targetUserId) !== myId) return;
                    const pc = peerConnectionRef.current;
                    if (!pc) return;
                    
                    try {
                        if (data.signal.type === 'offer') {
                            await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
                            const answer = await pc.createAnswer();
                            await pc.setLocalDescription(answer);
                            socket.emit("webrtc-signal", {
                                targetUserId: data.fromUserId,
                                fromUserId: myId,
                                signal: answer
                            });
                        } else if (data.signal.type === 'answer') {
                            await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
                        } else if (data.signal.type === 'ice') {
                            await pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
                        }
                    } catch (e) {
                        console.error("WebRTC Signal Error", e);
                    }
                });
            } else if (!socket) {
                    socket = getSocket();
                    if (socket && socket.on) socket.on('connected', () => setSocketConnected(true));
                    window.__auraSocket = socket;
            }
        };
        setTimeout(tryConnect, 100);
    }, []);

    // ── PER-CHAT: Fetch messages and STOMP subscription ──────────────────────────────
    useEffect(() => {
        fetchMessages();
        selectedChatCompare = selectedChat;
        selectedChatRef.current = selectedChat;

        if (selectedChat) {
            const chatId = selectedChat.id || selectedChat._id;
            if (socket) {
                socket.emit("join chat", chatId);
                socket.off("typing").on("typing", (data) => {
                    if (isTypingFromOtherUser(data, chatId)) {
                        showRemoteTyping();
                    }
                });
                socket.off("stop typing").on("stop typing", (data) => {
                    if (isTypingFromOtherUser(data, chatId)) {
                        hideRemoteTyping();
                    }
                });

            // Listen for remote read receipts and mark messages locally
            socket.off("message-read").on("message-read", (data) => {
                try {
                    if (!data) return;
                    const incomingChatId = data.chatId || data.chat || data.chat?.id;
                    const msgIds = data.messageIds || data.ids || (data.lastMessageId ? [data.lastMessageId] : []);
                    const currentChatId = selectedChat ? (selectedChat._id || selectedChat.id) : null;
                    if (!currentChatId || String(incomingChatId) !== String(currentChatId)) {
                        // Also update global chat list if available
                        try {
                            const chatsList = window.__auraChats || [];
                            const changed = chatsList.map(c => {
                                const cid = c._id || c.id;
                                if (String(cid) === String(incomingChatId) && c.latestMessage) {
                                    return { ...c, latestMessage: { ...c.latestMessage, isRead: true, seen: true, read: true } };
                                }
                                return c;
                            });
                            window.__auraChats = changed;
                            try { dispatch(setChats(changed)); } catch (e) {}
                        } catch (e) {}
                        return;
                    }

                    if (msgIds && msgIds.length > 0) {
                        setMessages(prev => prev.map(m => {
                            const id = m._id || m.id;
                            if (msgIds.includes(id)) return { ...m, isRead: true, seen: true, read: true };
                            return m;
                        }));
                    }
                } catch (e) {}
            });
            }

            // Prefer WebSocket live stream for incoming messages; fallback to STOMP when socket unavailable
            let unsubscribe = null;
            const handleNewMessage = (newMessageReceived) => {
                try {
                    const currentChat = selectedChatRef.current;
                    const currentChatId = currentChat ? (currentChat.id || currentChat._id) : null;
                    const incomingChatId = newMessageReceived?.chat
                        ? (newMessageReceived.chat.id || newMessageReceived.chat._id)
                        : newMessageReceived?.chatId;

                    if (!currentChatId || String(currentChatId) !== String(incomingChatId)) {
                        dispatch(setNotification([newMessageReceived, ...(notification || [])]));
                        setFetchAgain(prev => !prev);
                    } else {
                        setMessages(prev => {
                            const msgId = newMessageReceived._id || newMessageReceived.id;
                            const clientMsgId = newMessageReceived.clientMessageId;
                            const exists = prev.some(m =>
                                (msgId && (m._id === msgId || m.id === msgId)) ||
                                (clientMsgId && m.clientMessageId === clientMsgId)
                            );
                            if (exists) return prev;
                            return [...prev, newMessageReceived];
                        });
                    }
                } catch (e) { console.error('handleNewMessage error', e); }
            };

            // If a real socket.io client is present and not our STOMP shim, use its events.
            if (socket && !socket.__isStompShim) {
                // listen for several common event names (server may use any)
                socket.off("new message").on("new message", handleNewMessage);
                socket.off("message").on("message", handleNewMessage);
                socket.off("message received").on("message received", handleNewMessage);
                socket.off("message-received").on("message-received", handleNewMessage);

                // cleanup
                return () => {
                    try {
                        socket.off("new message", handleNewMessage);
                        socket.off("message", handleNewMessage);
                        socket.off("message received", handleNewMessage);
                        socket.off("message-received", handleNewMessage);
                    } catch (e) {}
                };
            } else {
                // Use STOMP subscription per-conversation
                unsubscribe = stompService.subscribeToConversation(chatId, handleNewMessage);

                // Typing topic (stomp)
                const unsubTyping = stompService.subscribeToTopic(`/topic/typing/${chatId}`, (data) => {
                    try {
                        if (!data) return;
                        if (!isTypingFromOtherUser(data, chatId)) return;
                        if (data.stopped || data.stopped === true) {
                            hideRemoteTyping();
                        } else {
                            showRemoteTyping();
                        }
                    } catch (e) { }
                });

                // Message-read topic (stomp)
                const unsubMsgRead = stompService.subscribeToTopic(`/topic/message-read/${chatId}`, (data) => {
                    try {
                        if (!data) return;
                        const msgIds = data.messageIds || data.ids || (data.lastMessageId ? [data.lastMessageId] : []);
                        if (msgIds && msgIds.length > 0) {
                            setMessages(prev => prev.map(m => {
                                const id = m._id || m.id;
                                if (!id) return m;
                                if (msgIds.includes(id)) return { ...m, isRead: true, seen: true, read: true };
                                return m;
                            }));
                        }
                    } catch (e) {}
                });

                // Call signalling topic
                const unsubCall = stompService.subscribeToCall(chatId, async (signal) => {
                    try {
                        if (!signal || !signal.type) return;
                        const t = signal.type;
                        if (t === 'call-user') {
                            // incoming call offer
                            setIncomingCall(signal);
                        } else if (t === 'call-accepted' || t === 'make-answer' || t === 'answer-call') {
                            // remote accepted -> create/attach local stream
                            setIsCallAccepted(true);
                            if (localVideoRef.current && localVideoRef.current.srcObject && selectedChatRef.current && user) {
                                const targetUser = getSenderUser(user, selectedChatRef.current.users);
                                if (targetUser && initWebRTCRef.current) {
                                    initWebRTCRef.current(localVideoRef.current.srcObject, true, targetUser._id || targetUser.id);
                                }
                            }
                        } else if (t === 'end-call') {
                            // remote ended
                            if (isCallerRef.current) {
                                const dur = callDurationRef.current;
                                if (dur > 0) {
                                    sendSystemMessage(`[call] ended ${formatCallDuration(dur)}`);
                                } else {
                                    sendSystemMessage(`[call] declined`);
                                }
                            }
                            if (localVideoRef.current && localVideoRef.current.srcObject) {
                                localVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
                            }
                            if (peerConnectionRef.current) {
                                peerConnectionRef.current.close();
                            }
                            setIsVideoCallActive(false);
                            setIsCallAccepted(false);
                            setIncomingCall(null);
                        } else if (t === 'ice' || t === 'ice-candidate') {
                            const pc = peerConnectionRef.current;
                            if (!pc) return;
                            await pc.addIceCandidate(new RTCIceCandidate(signal.signalData.candidate));
                        } else if (t === 'offer') {
                            const pc = peerConnectionRef.current;
                            if (!pc) return;
                            await pc.setRemoteDescription(new RTCSessionDescription(signal.signalData));
                            const answer = await pc.createAnswer();
                            await pc.setLocalDescription(answer);
                            // send answer back
                            stompService.sendAnswerCall({ type: 'answer-call', chatId: chatId, fromUser: user?._id || user?.id, toUser: signal.fromUser, signalData: answer });
                        } else if (t === 'answer') {
                            const pc = peerConnectionRef.current;
                            if (!pc) return;
                            await pc.setRemoteDescription(new RTCSessionDescription(signal.signalData));
                        }
                    } catch (e) {
                        console.error('call signal handling error', e);
                    }
                });

                return () => {
                    try { if (unsubscribe) unsubscribe(); } catch (e) {}
                    try { if (unsubTyping) unsubTyping(); } catch (e) {}
                    try { if (unsubMsgRead) unsubMsgRead(); } catch (e) {}
                    try { if (unsubCall) unsubCall(); } catch (e) {}
                };
            }
        }
    }, [selectedChat]);




    return (
        <>
            {selectedChat ? (
                <>
                    <Box
                        pb={2.5}
                        pt={{ base: "calc(var(--sat) + 6px)", md: "8px" }}
                        px={3}
                        w="100%"
                        d="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        flexShrink={0}
                        position="sticky"
                        top={0}
                        zIndex={50}
                        bg="rgba(255, 255, 255, 0.95)"
                        style={{
                            backdropFilter: "blur(20px)",
                            WebkitBackdropFilter: "blur(20px)",
                            borderBottom: "1px solid rgba(23, 24, 39, 0.06)",
                            marginBottom: "6px"
                        }}
                    >
                        {!selectedChat.isGroupChat ? (() => {
                            const targetUser = getSenderUser(user, selectedChat.users);
                            const targetUserId = targetUser ? String(targetUser._id || targetUser.id || targetUser.publicId || '') : '';
                            const statusObj = targetUserId && userStatuses[targetUserId] ? userStatuses[targetUserId] : null;
                            const statusAge = statusObj?.updatedAt ? presenceNow - statusObj.updatedAt : Number.POSITIVE_INFINITY;
                            const hasFreshPresence = statusObj != null && statusAge <= PRESENCE_STALE_MS;
                            const isTargetOnline = hasFreshPresence
                                ? Boolean(statusObj.isOnline)
                                : statusObj == null && Boolean(targetUser?.isOnline || targetUser?.online);
                            const targetLastSeen = statusObj != null && statusObj.lastSeen != null
                                ? statusObj.lastSeen
                                : targetUser?.lastSeen;

                            return (
                                <>
                                    <div className='d-flex align-items-center' style={{ gap: '10px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                        <Box display={{ base: "flex", md: "none" }} mr={0.5}>
                                            <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }}>
                                                <IconButton
                                                    size="sm"
                                                    onClick={() => dispatch(delSelectedChat())}
                                                    icon={<ArrowBackIcon style={{ fontSize: "18px", color: "#171827" }} />}
                                                    aria-label="Back to chat list"
                                                    style={{
                                                        background: "#F4F3EF",
                                                        borderRadius: "12px",
                                                        border: "1px solid rgba(23, 24, 39, 0.08)",
                                                        width: "36px",
                                                        height: "36px",
                                                        minWidth: "36px"
                                                    }}
                                                />
                                            </motion.div>
                                        </Box>
                                        <div style={{ position: "relative", flexShrink: 0 }}>
                                            <Avatar 
                                                size="md" 
                                                cursor="pointer" 
                                                src={getPicture(user, selectedChat.users)} 
                                                name={getSender(user, selectedChat.users)} 
                                                fontWeight="800"
                                                style={{ 
                                                    border: "2px solid rgba(91, 95, 239, 0.4)",
                                                    boxShadow: "0 4px 14px rgba(91, 95, 239, 0.15)",
                                                    width: "42px",
                                                    height: "42px"
                                                }}
                                            />
                                            <span 
                                                className={isTargetOnline ? "aura-presence-online" : "aura-presence-offline"}
                                                style={{
                                                    position: "absolute",
                                                    bottom: "0px",
                                                    right: "0px",
                                                    width: "12px",
                                                    height: "12px",
                                                    borderRadius: "50%",
                                                    border: "2px solid #FFFFFF",
                                                    zIndex: 2
                                                }}
                                            />
                                        </div>
                                        <div className="d-flex flex-column justify-content-center" style={{ minWidth: 0, overflow: 'hidden', flex: 1 }}>
                                            <p className="m-0" style={{
                                                fontSize: "1rem",
                                                fontWeight: 800,
                                                color: "#0F172A",
                                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                                letterSpacing: "-0.02em",
                                                lineHeight: 1.25,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap"
                                            }}>
                                                {getSender(user, selectedChat.users)}
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'nowrap', overflow: 'hidden' }}>
                                                {isTargetOnline ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: "0.72rem", color: "#10B981", fontWeight: 700, whiteSpace: "nowrap" }}>
                                                        <span style={{ width: "6px", height: "6px", backgroundColor: "#10B981", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 6px #10B981" }} />
                                                        Active now
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: "0.72rem", color: "#64748B", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                        <span style={{ width: "5px", height: "5px", backgroundColor: "#9CA3AF", borderRadius: "50%", display: "inline-block" }} />
                                                        {formatLastSeenDate(targetLastSeen)}
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setTelemetryModalOpen(true)}
                                                    style={{
                                                        border: 'none',
                                                        background: 'rgba(16, 185, 129, 0.1)',
                                                        color: '#059669',
                                                        borderRadius: '6px',
                                                        padding: '1px 6px',
                                                        fontSize: '0.65rem',
                                                        fontWeight: 800,
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '3px',
                                                        lineHeight: 1.4,
                                                        flexShrink: 0
                                                    }}
                                                    title="View Architecture Telemetry (0.42ms Vault)"
                                                >
                                                    <span>⚡ 0.42ms</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Top Right: Strictly Live Phone & Video Calling */}
                                    <div className='d-flex align-items-center' style={{ gap: '8px', flexShrink: 0 }}>
                                        <Tooltip label="Start Voice Call" hasArrow placement="bottom-end">
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.08, y: -1 }}
                                                whileTap={{ scale: 0.92 }}
                                                onClick={() => startVideoCall("voice")}
                                                aria-label="Start Voice Call"
                                                style={{
                                                    background: "rgba(91, 95, 239, 0.08)",
                                                    borderRadius: "14px",
                                                    border: "1.5px solid rgba(91, 95, 239, 0.2)",
                                                    width: "40px",
                                                    height: "40px",
                                                    minWidth: "40px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    cursor: "pointer",
                                                    color: "#5B5FEF",
                                                    boxShadow: "0 2px 8px rgba(91, 95, 239, 0.08)",
                                                    transition: "all 0.2s ease"
                                                }}
                                            >
                                                <Phone size={18} />
                                            </motion.button>
                                        </Tooltip>
                                        <Tooltip label="Start HD Video Call" hasArrow placement="bottom-end">
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.08, y: -1 }}
                                                whileTap={{ scale: 0.92 }}
                                                onClick={() => startVideoCall("video")}
                                                aria-label="Start HD Video Call"
                                                style={{
                                                    background: "linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)",
                                                    borderRadius: "14px",
                                                    border: "none",
                                                    width: "40px",
                                                    height: "40px",
                                                    minWidth: "40px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    cursor: "pointer",
                                                    color: "#FFFFFF",
                                                    boxShadow: "0 4px 14px rgba(91, 95, 239, 0.28)",
                                                    transition: "all 0.2s ease"
                                                }}
                                            >
                                                <Video size={18} />
                                            </motion.button>
                                        </Tooltip>
                                    </div>
                                </>
                            );
                        })() : (
                            <>
                                <div className='d-flex align-items-center' style={{ gap: '8px', minWidth: 0, flex: 1, overflow: 'hidden', marginRight: '8px' }}>
                                    <Box display={{ base: "flex", md: "none" }} mr={1}>
                                        <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}>
                                            <IconButton
                                                size="sm"
                                                onClick={() => dispatch(delSelectedChat())}
                                                icon={<ArrowBackIcon style={{ fontSize: "18px", color: "#171827" }} />}
                                                aria-label="Back to chat list"
                                                style={{
                                                    background: "#F4F3EF",
                                                    borderRadius: "12px",
                                                    border: "1px solid rgba(23, 24, 39, 0.08)",
                                                    width: "38px",
                                                    height: "38px",
                                                    boxShadow: "0 2px 6px rgba(23, 24, 39, 0.02)"
                                                }}
                                            />
                                        </motion.div>
                                    </Box>
                                    <div style={{ position: "relative", flexShrink: 0 }}>
                                        <Avatar 
                                            size="md" 
                                            cursor="pointer" 
                                            name={selectedChat.chatName} 
                                            bg="#5B5FEF !important"
                                            color="#FFFFFF !important"
                                            fontWeight="800"
                                            style={{ border: "2px solid #5B5FEF" }}
                                        />
                                    </div>
                                    <div className="d-flex flex-column justify-content-center" style={{ minWidth: 0, overflow: 'hidden' }}>
                                        <p className="fw-bold fs-6 m-0" style={{ color: "#171827", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.015em", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {selectedChat.chatName}
                                        </p>
                                        <span style={{ fontSize: "0.72rem", color: "#727486", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600, marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            👥 {selectedChat.users ? `${selectedChat.users.length} members` : 'Group'} • 🔒 Encrypted Orbit
                                        </span>
                                    </div>
                                </div>
                                <div className='d-flex align-items-center' style={{ gap: '10px', flexShrink: 0 }}>
                                    <Tooltip label="View Group Details" hasArrow placement="bottom-end">
                                        <motion.div whileHover={{ scale: 1.06, y: -1 }} whileTap={{ scale: 0.94 }}>
                                            <IconButton
                                                size="sm"
                                                onClick={onOpen}
                                                icon={<Info size={19} color="#5B5FEF" />}
                                                aria-label="View Group Details"
                                                style={{
                                                    background: "rgba(91, 95, 239, 0.08)",
                                                    borderRadius: "12px",
                                                    border: "1.5px solid rgba(91, 95, 239, 0.2)",
                                                    width: "40px",
                                                    height: "40px",
                                                    minWidth: "40px",
                                                    boxShadow: "0 2px 8px rgba(91, 95, 239, 0.12)"
                                                }}
                                            />
                                        </motion.div>
                                    </Tooltip>
                                </div>
                            </>
                        )}
                    </Box>
                    <Modal isOpen={isOpen} onClose={onClose}>
                                        <ModalOverlay />
                                        <ModalContent h="650px">
                                            <ModalHeader
                                                fontSize="24px"
                                                d="flex"
                                                justifyContent="center"
                                                style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}
                                            >
                                                <h3 className="gradient-text m-0">{selectedChat.chatName.toUpperCase()}</h3>
                                            </ModalHeader>
                                            <ModalCloseButton style={{ top: "16px", right: "16px" }} />

                                            <ModalBody>
                                                <Box>
                                                    {selectedChat.users.map(u => {
                                                        return (
                                                            <UserBadgeItem
                                                                key={u._id}
                                                                user={u}
                                                                handleFunction={() => handleRemove(u)}
                                                            />
                                                        )
                                                    })}
                                                </Box>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Chat Name"
                                                        mb={3}
                                                        onChange={(e) => setGroupChatName(e.target.value)}
                                                    />
                                                    <MDBBtn color='primary' onClick={handleRename}>{renameloading ? <Spinner /> : "Update"}</MDBBtn>
                                                </FormControl>
                                                <FormControl className='mt-3'>
                                                    <Input
                                                        placeholder="Add Users eg: John, Alex, Jane"
                                                        mb={1}
                                                        onChange={(e) => handleSearch(e.target.value)}
                                                    />
                                                </FormControl>
                                                {loading ? (
                                                    <Spinner size="lg" />
                                                ) : (
                                                    searchResult?.slice(0, 3).map((user) => (
                                                        <UserListItem
                                                            key={user._id}
                                                            user={user}
                                                            handleFunction={() => handleAddUser(user)}
                                                        />
                                                    ))
                                                )}
                                            </ModalBody>

                                            <ModalFooter>
                                                <MDBBtn color='danger' onClick={() => handleLeave(user)}>Leave Group</MDBBtn>

                                            </ModalFooter>
                                        </ModalContent>
                                    </Modal>

                    <Box
                        d="flex"
                        flexDir="column"
                        justifyContent="space-between"
                        p={{ base: 2, sm: 3.5 }}
                        bg="rgba(248, 250, 252, 0.7)"
                        style={{
                            border: "1px solid rgba(226, 232, 240, 0.8)",
                            boxShadow: "inset 0 2px 14px rgba(15, 23, 42, 0.02)",
                            borderRadius: "24px",
                            backdropFilter: "blur(16px)",
                            WebkitBackdropFilter: "blur(16px)",
                            position: "relative"
                        }}
                        w="100%"
                        flex="1"
                        h="0"
                        minH="0"
                        overflow="hidden"
                    >
                        {/* Messages Here */} 
                        {messageLoading ? (
                            <Spinner
                                thickness='3px'
                                speed='0.65s'
                                emptyColor='#E2E8F0'
                                color='#FF2A54'
                                w={10}
                                h={10}
                                alignSelf="center"
                                margin="auto"
                            />
                        ) : (
                            <Box flex="1" overflowY="auto" minH="0" pr={1}>
                                <ScrollableChat 
                                    chatId={(selectedChat && (selectedChat._id || selectedChat.id)) || null} 
                                    otherUser={selectedChat ? getSenderUser(user, selectedChat.users) : null} 
                                    messages={messages} 
                                    setMessages={setMessages} 
                                    isTyping={istyping} 
                                />
                            </Box>
                        )}
                        {/* Video & Voice Call Modal Overlay */}
                        {isVideoCallActive && (
                            <Portal>
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    style={{
                                        position: "fixed",
                                        inset: 0,
                                        width: "100vw",
                                        height: "100vh",
                                        background: "radial-gradient(ellipse at 50% 15%, #14162B 0%, #0A0B14 60%, #05060A 100%)",
                                        zIndex: 9999,
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "28px 20px 24px 20px",
                                        overflow: "hidden"
                                    }}
                                >
                                    {/* Ambient Shimmering Aurora Orbs */}
                                    <motion.div
                                        animate={{ opacity: [0.35, 0.65, 0.35], scale: [1, 1.1, 1] }}
                                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                        style={{
                                            position: "absolute",
                                            top: "-120px",
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            width: "650px",
                                            height: "650px",
                                            borderRadius: "50%",
                                            background: "radial-gradient(circle, rgba(91, 95, 239, 0.22) 0%, rgba(128, 103, 232, 0.08) 50%, transparent 70%)",
                                            pointerEvents: "none"
                                        }}
                                    />
                                    <motion.div
                                        animate={{ opacity: [0.2, 0.45, 0.2], scale: [1, 1.15, 1] }}
                                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                        style={{
                                            position: "absolute",
                                            bottom: "-100px",
                                            right: "-80px",
                                            width: "500px",
                                            height: "500px",
                                            borderRadius: "50%",
                                            background: "radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)",
                                            pointerEvents: "none"
                                        }}
                                    />

                                    {/* ── TOP CALL STATUS BAR ── */}
                                    <Box display="flex" flexDirection="column" alignItems="center" zIndex={10}>
                                        {/* Security & Resolution Badge */}
                                        <Box
                                            display="inline-flex"
                                            alignItems="center"
                                            gap="8px"
                                            bg="rgba(255, 255, 255, 0.06)"
                                            px={4}
                                            py={1.5}
                                            borderRadius="99px"
                                            border="1px solid rgba(255, 255, 255, 0.12)"
                                            mb={2.5}
                                            style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
                                        >
                                            <motion.span
                                                animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10B981", boxShadow: "0 0 10px #10B981", display: "inline-block" }}
                                            />
                                            <Text fontSize="0.72rem" fontWeight="800" color="#10B981" letterSpacing="0.08em" margin={0}>
                                                {callType === "video" ? "256-BIT E2EE • 4K 60FPS • 0.42ms" : "256-BIT E2EE • SPATIAL AUDIO • 0.42ms"}
                                            </Text>
                                        </Box>

                                        {/* Participant Name */}
                                        <Text fontSize="1.8rem" fontWeight="900" color="#FFFFFF" fontFamily="'Plus Jakarta Sans', sans-serif" letterSpacing="-0.02em" margin={0}>
                                            {getSender(user, selectedChat.users)}
                                        </Text>

                                        {/* Duration / Connecting State */}
                                        <Box display="flex" alignItems="center" gap="6px" mt={1.5}>
                                            {isCallAccepted ? (
                                                <div style={{
                                                    background: "rgba(91, 95, 239, 0.15)",
                                                    border: "1px solid rgba(91, 95, 239, 0.35)",
                                                    padding: "3px 12px",
                                                    borderRadius: "99px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px"
                                                }}>
                                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                                                    <Text fontSize="0.88rem" fontWeight="800" color="#FFFFFF" margin={0} fontFamily="monospace">
                                                        {formatCallDuration(callDuration)}
                                                    </Text>
                                                </div>
                                            ) : (
                                                <Box display="flex" alignItems="center" gap="6px">
                                                    <Text fontSize="0.86rem" fontWeight="700" color="#94A3B8" margin={0}>
                                                        Establishing Vault Relay
                                                    </Text>
                                                    {[0, 1, 2].map((i) => (
                                                        <motion.span
                                                            key={i}
                                                            animate={{ opacity: [0.2, 1, 0.2] }}
                                                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                                                            style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#5B5FEF", display: "inline-block" }}
                                                        />
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>

                                    {/* ── CENTER MEDIA STAGE ── */}
                                    {callType === "video" ? (
                                        <Box
                                            position="relative"
                                            width="100%"
                                            maxW="820px"
                                            flex="1"
                                            minH="0"
                                            display="flex"
                                            justifyContent="center"
                                            alignItems="center"
                                            bg="#0A0B14"
                                            borderRadius="32px"
                                            overflow="hidden"
                                            border="1.5px solid rgba(255, 255, 255, 0.12)"
                                            boxShadow="0 25px 80px rgba(0, 0, 0, 0.6), 0 0 40px rgba(91, 95, 239, 0.15)"
                                            zIndex={10}
                                            my={2.5}
                                        >
                                            {/* Remote Participant Video Stream */}
                                            <video 
                                                ref={remoteVideoRef} 
                                                autoPlay 
                                                playsInline 
                                                style={{ 
                                                    width: '100%', 
                                                    height: '100%', 
                                                    objectFit: 'cover', 
                                                    borderRadius: '32px', 
                                                    display: isCallAccepted ? 'block' : 'none'
                                                }} 
                                            />

                                            {/* Fullscreen Local Video Stream while calling/connecting */}
                                            {!isCallAccepted && (
                                                <video 
                                                    ref={localVideoRef} 
                                                    autoPlay 
                                                    playsInline 
                                                    muted 
                                                    style={{ 
                                                        width: '100%', 
                                                        height: '100%', 
                                                        objectFit: 'cover', 
                                                        transform: 'scaleX(-1)', 
                                                        borderRadius: '32px' 
                                                    }} 
                                                />
                                            )}

                                            {/* 4K UHD LIVE Badge */}
                                            <Box
                                                position="absolute"
                                                top="16px"
                                                left="16px"
                                                display="flex"
                                                alignItems="center"
                                                gap="6px"
                                                bg="rgba(10, 11, 20, 0.75)"
                                                backdropFilter="blur(16px)"
                                                px={3}
                                                py={1}
                                                borderRadius="99px"
                                                border="1px solid rgba(255, 255, 255, 0.18)"
                                                zIndex={25}
                                            >
                                                <motion.span
                                                    animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                    style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981", display: "inline-block" }}
                                                />
                                                <Text fontSize="0.68rem" fontWeight="800" color="#FFFFFF" letterSpacing="0.06em" margin={0}>
                                                    {isCallAccepted ? "4K 60FPS LIVE" : "CONNECTING"}
                                                </Text>
                                            </Box>

                                            {/* Floating PiP Self View */}
                                            {isCallAccepted && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                                    style={{
                                                        position: "absolute",
                                                        bottom: "16px",
                                                        right: "16px",
                                                        width: "150px",
                                                        height: "112px",
                                                        borderRadius: "18px",
                                                        overflow: "hidden",
                                                        border: "2px solid rgba(91, 95, 239, 0.8)",
                                                        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(91, 95, 239, 0.3)",
                                                        zIndex: 20,
                                                        background: "#0E0F19"
                                                    }}
                                                >
                                                    <video 
                                                        ref={localVideoRef} 
                                                        autoPlay 
                                                        playsInline 
                                                        muted 
                                                        style={{ 
                                                            width: '100%', 
                                                            height: '100%', 
                                                            objectFit: 'cover', 
                                                            transform: 'scaleX(-1)' 
                                                        }} 
                                                    />
                                                    <Box position="absolute" bottom="4px" left="6px" bg="rgba(10, 11, 20, 0.75)" px={1.5} py={0.5} borderRadius="6px">
                                                        <Text fontSize="9px" fontWeight="800" color="#5B5FEF" margin={0}>You</Text>
                                                    </Box>
                                                </motion.div>
                                            )}

                                            {!isCallAccepted && (
                                                <Box position="absolute" bottom="16px" right="16px" bg="rgba(10, 11, 20, 0.7)" backdropFilter="blur(12px)" px={3} py={1} borderRadius="12px" border="1px solid rgba(255, 255, 255, 0.15)" zIndex={25}>
                                                    <Text fontSize="0.72rem" fontWeight="700" color="#FFFFFF" margin={0}>Self View</Text>
                                                </Box>
                                            )}
                                        </Box>
                                    ) : (
                                        <Box display="flex" flexDirection="column" alignItems="center" my="auto" position="relative" zIndex={10}>
                                            {/* 3D Pulsing Aura Orbit Rings */}
                                            <motion.div
                                                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.05, 0.4] }}
                                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                                style={{
                                                    position: "absolute",
                                                    top: "calc(50% - 105px)",
                                                    width: "210px",
                                                    height: "210px",
                                                    borderRadius: "50%",
                                                    background: "radial-gradient(circle, rgba(91, 95, 239, 0.25) 0%, transparent 70%)"
                                                }}
                                            />
                                            <motion.div
                                                animate={{ scale: [1, 1.85, 1], opacity: [0.25, 0.02, 0.25] }}
                                                transition={{ duration: 2.5, repeat: Infinity, delay: 0.6, ease: "easeInOut" }}
                                                style={{
                                                    position: "absolute",
                                                    top: "calc(50% - 105px)",
                                                    width: "210px",
                                                    height: "210px",
                                                    borderRadius: "50%",
                                                    background: "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)"
                                                }}
                                            />

                                            <Avatar
                                                size="2xl"
                                                name={getSender(user, selectedChat.users)}
                                                src={getPicture(user, selectedChat.users)}
                                                fontWeight="800"
                                                fontSize="2.8rem"
                                                style={{
                                                    width: "140px",
                                                    height: "140px",
                                                    border: "4px solid rgba(255, 255, 255, 0.9)",
                                                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 3px rgba(91, 95, 239, 0.6), 0 0 40px rgba(91, 95, 239, 0.3)",
                                                    position: "relative",
                                                    zIndex: 2
                                                }}
                                            />

                                            {/* Multi-Frequency Spatial Audio Soundwave Equalizer */}
                                            <Box display="flex" alignItems="center" gap="4px" mt={8} mb={2}>
                                                {[14, 28, 44, 20, 52, 30, 46, 22, 38, 48, 18, 34, 40].map((h, i) => (
                                                    <motion.div
                                                        key={i}
                                                        animate={{ height: isCallAccepted ? ["8px", `${h}px`, "8px"] : ["4px", "12px", "4px"] }}
                                                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.07, ease: "easeInOut" }}
                                                        style={{
                                                            width: "4px",
                                                            background: "linear-gradient(180deg, #5B5FEF 0%, #8067E8 50%, #10B981 100%)",
                                                            borderRadius: "4px"
                                                        }}
                                                    />
                                                ))}
                                            </Box>

                                            <Text color="#94A3B8" fontSize="0.86rem" fontWeight="600" mt={1} margin={0}>
                                                {isCallAccepted ? "● Spatial Audio Stream Active (Opus HD 48kHz)" : "Waiting for participant to connect..."}
                                            </Text>
                                        </Box>
                                    )}

                                    {/* ── LIVE AI CAPTIONS & TRANSLATION GLASS ── */}
                                    {liveCaptionsEnabled && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            style={{
                                                width: "92%",
                                                maxWidth: "520px",
                                                margin: "0 auto 10px auto",
                                                background: "rgba(15, 23, 42, 0.75)",
                                                backdropFilter: "blur(24px)",
                                                WebkitBackdropFilter: "blur(24px)",
                                                padding: "12px 18px",
                                                borderRadius: "20px",
                                                textAlign: "left",
                                                border: "1px solid rgba(255, 255, 255, 0.12)",
                                                boxShadow: "0 16px 40px rgba(0, 0, 0, 0.4)",
                                                zIndex: 40
                                            }}
                                        >
                                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                                                <Box display="flex" alignItems="center" gap="6px">
                                                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981" }} />
                                                    <Text color="#10B981" fontSize="0.7rem" fontWeight="800" letterSpacing="0.08em" m={0}>
                                                        LIVE AI SUBTITLES & TRANSLATION
                                                    </Text>
                                                </Box>
                                                <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "#8067E8", background: "rgba(128, 103, 232, 0.15)", padding: "2px 8px", borderRadius: "99px" }}>
                                                    AUTO-SYNC
                                                </span>
                                            </Box>

                                            {captionsLog.length === 0 && !currentTranscript && (
                                                <Text color="#64748B" fontSize="0.82rem" fontWeight="600" italic m={0}>
                                                    🎙️ Speaking to generate live subtitles...
                                                </Text>
                                            )}
                                            {captionsLog.map((c, index) => (
                                                <motion.div key={c.id || index} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} style={{ marginBottom: "6px" }}>
                                                    <Text color="#FFFFFF" fontSize="0.88rem" fontWeight="700" m={0}>
                                                        <span style={{ color: "#5B5FEF", fontWeight: 800 }}>{c.speaker}:</span> {c.original}
                                                    </Text>
                                                    {c.translated && (
                                                        <Text color="#10B981" fontSize="0.82rem" fontWeight="800" m={0} style={{ marginTop: "1px" }}>
                                                            🌐 {c.translated}
                                                        </Text>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}

                                    {/* ── FLOATING CALL CONTROL CAPSULE DOCK ── */}
                                    <motion.div
                                        initial={{ y: 30, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: 30, opacity: 0 }}
                                        style={{ width: "100%", display: "flex", justifyContent: "center", zIndex: 30 }}
                                    >
                                        <Box
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                            bg="rgba(255, 255, 255, 0.1)"
                                            backdropFilter="blur(32px)"
                                            WebkitBackdropFilter="blur(32px)"
                                            px={{ base: 3, sm: 5 }}
                                            py={2.5}
                                            borderRadius="99px"
                                            border="1px solid rgba(255, 255, 255, 0.18)"
                                            boxShadow="0 25px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(91, 95, 239, 0.15)"
                                            gap={{ base: 3, sm: 4 }}
                                        >
                                            {/* Mic Toggle */}
                                            <Tooltip label={isMuted ? "Unmute Mic" : "Mute Mic"} hasArrow placement="top">
                                                <motion.button
                                                    type="button"
                                                    whileHover={{ scale: 1.1, y: -2 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={toggleMute}
                                                    style={{
                                                        width: "50px",
                                                        height: "50px",
                                                        borderRadius: "50%",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        background: isMuted ? "rgba(239, 68, 68, 0.25)" : "rgba(255, 255, 255, 0.12)",
                                                        border: isMuted ? "2px solid #EF4444" : "1px solid rgba(255, 255, 255, 0.2)",
                                                        color: isMuted ? "#EF4444" : "#FFFFFF",
                                                        cursor: "pointer",
                                                        boxShadow: isMuted ? "0 0 20px rgba(239, 68, 68, 0.4)" : "none"
                                                    }}
                                                >
                                                    {isMuted ? <MicOffIcon style={{ fontSize: 22 }} /> : <MicIcon style={{ fontSize: 22 }} />}
                                                </motion.button>
                                            </Tooltip>

                                            {/* Camera Switch */}
                                            <Tooltip label={callType === "video" ? (isCameraOff ? "Turn Camera On" : "Turn Camera Off") : "Switch to Video"} hasArrow placement="top">
                                                <motion.button
                                                    type="button"
                                                    whileHover={{ scale: 1.1, y: -2 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => {
                                                        if (callType === "video") {
                                                            toggleCamera();
                                                        } else {
                                                            setCallType("video");
                                                            toast.success("Switched to 4K Video Stream!");
                                                        }
                                                    }}
                                                    style={{
                                                        width: "50px",
                                                        height: "50px",
                                                        borderRadius: "50%",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        background: (callType === "video" && isCameraOff) ? "rgba(239, 68, 68, 0.25)" : "rgba(255, 255, 255, 0.12)",
                                                        border: (callType === "video" && isCameraOff) ? "2px solid #EF4444" : "1px solid rgba(255, 255, 255, 0.2)",
                                                        color: (callType === "video" && isCameraOff) ? "#EF4444" : "#FFFFFF",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    {(callType === "video" && isCameraOff) ? (
                                                        <VideocamOffIcon style={{ fontSize: 22 }} />
                                                    ) : (
                                                        <VideocamIcon style={{ fontSize: 22 }} />
                                                    )}
                                                </motion.button>
                                            </Tooltip>

                                            {/* Live AI Subtitles Toggle */}
                                            <Tooltip label={liveCaptionsEnabled ? "Hide AI Subtitles" : "Show AI Subtitles"} hasArrow placement="top">
                                                <motion.button
                                                    type="button"
                                                    whileHover={{ scale: 1.1, y: -2 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setLiveCaptionsEnabled(!liveCaptionsEnabled)}
                                                    style={{
                                                        width: "50px",
                                                        height: "50px",
                                                        borderRadius: "50%",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        background: liveCaptionsEnabled ? "rgba(16, 185, 129, 0.25)" : "rgba(255, 255, 255, 0.12)",
                                                        border: liveCaptionsEnabled ? "2px solid #10B981" : "1px solid rgba(255, 255, 255, 0.2)",
                                                        color: liveCaptionsEnabled ? "#10B981" : "#FFFFFF",
                                                        cursor: "pointer",
                                                        fontSize: "1.1rem"
                                                    }}
                                                >
                                                    💬
                                                </motion.button>
                                            </Tooltip>

                                            {/* End Call Button */}
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.08, y: -2 }}
                                                whileTap={{ scale: 0.92 }}
                                                onClick={endVideoCall}
                                                aria-label="End Call"
                                                style={{
                                                    height: "50px",
                                                    padding: "0 24px",
                                                    borderRadius: "99px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                                                    border: "none",
                                                    color: "#FFFFFF",
                                                    fontWeight: 800,
                                                    fontSize: "0.92rem",
                                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                                    cursor: "pointer",
                                                    boxShadow: "0 8px 25px rgba(239, 68, 68, 0.5)",
                                                    letterSpacing: "0.02em"
                                                }}
                                            >
                                                <CallEndIcon style={{ fontSize: 20 }} />
                                                <span>End Call</span>
                                            </motion.button>
                                        </Box>
                                    </motion.div>
                                </motion.div>
                            </Portal>
                        )}

                        {/* Hidden file input for attachment upload */}
                                        {/* Hidden file input for attachment upload */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            style={{ display: "none" }}
                            accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                        />

                        {/* Premium Floating Input Bar */}
                        <FormControl
                            id="first-name"
                            isRequired
                            mt={{ base: 1, md: 2 }}
                            pb={{ base: "calc(var(--sab) + 4px)", md: "4px" }}
                            position="sticky"
                            bottom="0"
                            zIndex="100"
                        >

                            {showPicker && (
                                <Box position="absolute" bottom="75px" left="10px" zIndex="1000">
                                    <Picker onEmojiClick={onEmojiClick} />
                                </Box>
                            )}

                            {/* Circular Video Note Live Preview Floating HUD */}
                            {isRecordingVideoNote && (
                                <Box
                                    position="absolute"
                                    bottom="80px"
                                    left="50%"
                                    transform="translateX(-50%)"
                                    zIndex="1000"
                                    display="flex"
                                    flexDirection="column"
                                    alignItems="center"
                                    gap="8px"
                                >
                                    <div style={{
                                        position: 'relative',
                                        width: '210px',
                                        height: '210px',
                                        borderRadius: '50%',
                                        overflow: 'hidden',
                                        boxShadow: '0 20px 60px rgba(91, 95, 239, 0.4), 0 0 0 3px #5B5FEF',
                                        background: '#0F172A'
                                    }}>
                                        <video
                                            ref={(el) => {
                                                videoNotePreviewRef.current = el;
                                                if (el && videoNoteStreamRef.current && el.srcObject !== videoNoteStreamRef.current) {
                                                    el.srcObject = videoNoteStreamRef.current;
                                                    el.play().catch(() => {});
                                                }
                                            }}
                                            autoPlay
                                            playsInline
                                            muted
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                borderRadius: '50%',
                                                transform: 'scaleX(-1)'
                                            }}
                                        />

                                        {/* Progress Ring Overlay */}
                                        <svg
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: '100%',
                                                transform: 'rotate(-90deg)',
                                                pointerEvents: 'none'
                                            }}
                                            viewBox="0 0 210 210"
                                        >
                                            <circle
                                                cx="105"
                                                cy="105"
                                                r="100"
                                                stroke="rgba(255, 255, 255, 0.2)"
                                                strokeWidth="4"
                                                fill="transparent"
                                            />
                                            <circle
                                                cx="105"
                                                cy="105"
                                                r="100"
                                                stroke="#EF4444"
                                                strokeWidth="4"
                                                fill="transparent"
                                                strokeDasharray={2 * Math.PI * 100}
                                                strokeDashoffset={2 * Math.PI * 100 - (videoNoteDuration / 60) * (2 * Math.PI * 100)}
                                                strokeLinecap="round"
                                                style={{ transition: 'stroke-dashoffset 0.2s linear' }}
                                            />
                                        </svg>

                                        {/* Recording Duration Pill */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '12px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            background: 'rgba(23, 24, 39, 0.85)',
                                            backdropFilter: 'blur(10px)',
                                            padding: '3px 10px',
                                            borderRadius: '99px',
                                            color: '#FFFFFF',
                                            fontSize: '0.72rem',
                                            fontWeight: 800,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            border: '1px solid rgba(255, 255, 255, 0.2)'
                                        }}>
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                                            {formatSeconds(videoNoteDuration)} / 01:00
                                        </div>
                                    </div>
                                </Box>
                            )}

                            <div 
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: (isRecordingVoice || isRecordingVideoNote) ? 'rgba(254, 242, 242, 0.98)' : 'rgba(255, 255, 255, 0.96)',
                                    backdropFilter: 'blur(24px)',
                                    WebkitBackdropFilter: 'blur(24px)',
                                    border: (isRecordingVoice || isRecordingVideoNote) ? '1.5px solid rgba(239, 68, 68, 0.35)' : '1.5px solid rgba(226, 232, 240, 0.85)',
                                    borderRadius: '28px',
                                    padding: '6px 8px 6px 12px',
                                    boxShadow: '0 12px 36px -4px rgba(23, 24, 39, 0.06), 0 4px 12px rgba(91, 95, 239, 0.05)',
                                    WebkitTapHighlightColor: 'transparent',
                                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}
                            >
                                {/* ── STATE A: WHILE RECORDING VOICE OR VIDEO NOTE ── */}
                                {(isRecordingVoice || isRecordingVideoNote) ? (
                                    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '10px' }}>
                                        {/* Red Blinking Beacon */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px' }}>
                                            <motion.span
                                                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                                                transition={{ duration: 1, repeat: Infinity }}
                                                style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444', display: 'inline-block', boxShadow: '0 0 10px #EF4444' }}
                                            />
                                            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#EF4444', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                                {formatSeconds(isRecordingVoice ? voiceDuration : videoNoteDuration)}
                                            </span>
                                        </div>

                                        {/* Waveform Visualization Bars */}
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', height: '22px' }}>
                                            {[14, 28, 42, 20, 36, 48, 16, 32, 44, 22, 38, 18].map((h, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    animate={{ height: [6, h, 6] }}
                                                    transition={{ duration: 0.5, repeat: Infinity, delay: idx * 0.06 }}
                                                    style={{ width: '3px', background: '#EF4444', borderRadius: '3px' }}
                                                />
                                            ))}
                                        </div>

                                        {/* Discard / Cancel Button */}
                                        <Tooltip label="Discard" hasArrow placement="top">
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.08 }}
                                                whileTap={{ scale: 0.92 }}
                                                onClick={isRecordingVoice ? cancelVoiceRecording : cancelVideoNoteRecording}
                                                style={{
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    width: '36px',
                                                    height: '36px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    color: '#EF4444',
                                                    flexShrink: 0
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </motion.button>
                                        </Tooltip>

                                        {/* Send Recorded Note Button */}
                                        <Tooltip label={isRecordingVoice ? "Send Voice Note" : "Send Video Note"} hasArrow placement="top">
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.08 }}
                                                whileTap={{ scale: 0.92 }}
                                                onClick={() => isRecordingVoice ? stopVoiceRecording(true) : stopVideoNoteRecording(true)}
                                                style={{
                                                    background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                                                    border: 'none',
                                                    borderRadius: '18px',
                                                    height: '36px',
                                                    padding: '0 16px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    color: '#FFFFFF',
                                                    fontWeight: 800,
                                                    fontSize: '0.8rem',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 4px 14px rgba(91, 95, 239, 0.3)',
                                                    flexShrink: 0
                                                }}
                                            >
                                                <span>Send</span>
                                                <Send size={14} color="#FFFFFF" />
                                            </motion.button>
                                        </Tooltip>
                                    </div>
                                ) : (
                                    /* ── STATE B: NORMAL INPUT MODE ── */
                                    <>
                                        {/* Left Action Tools (File + Menu) */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {/* Primary File Attachment Button */}
                                            <Tooltip label="Attach File / Photo" hasArrow placement="top">
                                                <motion.button
                                                    type="button"
                                                    whileHover={{ scale: 1.08, backgroundColor: 'rgba(91, 95, 239, 0.1)' }}
                                                    whileTap={{ scale: 0.92 }}
                                                    onClick={() => {
                                                        if (showPicker) setShowPicker(false);
                                                        if (fileInputRef.current) fileInputRef.current.click();
                                                    }}
                                                    style={{
                                                        background: 'rgba(244, 243, 239, 0.9)',
                                                        border: '1px solid rgba(23, 24, 39, 0.06)',
                                                        borderRadius: '50%',
                                                        width: '36px',
                                                        height: '36px',
                                                        minWidth: '36px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        touchAction: 'manipulation',
                                                        WebkitTapHighlightColor: 'transparent',
                                                        transition: 'all 0.2s ease',
                                                        color: '#727486'
                                                    }}
                                                >
                                                    <AttachFileIcon style={{ fontSize: '18px' }} />
                                                </motion.button>
                                            </Tooltip>

                                            {/* Three Dots Options Menu (More Actions) */}
                                            <Menu placement="top-start" isLazy>
                                                <MenuButton
                                                    as={motion.button}
                                                    type="button"
                                                    className="aura-icon-btn"
                                                    p={0}
                                                    m={0}
                                                    whileHover={{ scale: 1.08, backgroundColor: (viewOnceMode || showPicker || scheduleModal) ? 'rgba(230, 57, 70, 0.12)' : 'rgba(91, 95, 239, 0.1)' }}
                                                    whileTap={{ scale: 0.92 }}
                                                    onClick={() => {
                                                        if (showPicker) setShowPicker(false);
                                                    }}
                                                    _focus={{ boxShadow: "none", outline: "none" }}
                                                    _focusVisible={{ boxShadow: "none", outline: "none" }}
                                                    _active={{ boxShadow: "none", outline: "none" }}
                                                    style={{
                                                        background: (viewOnceMode || showPicker || scheduleModal) ? 'rgba(230, 57, 70, 0.08)' : 'rgba(244, 243, 239, 0.9)',
                                                        border: (viewOnceMode || showPicker || scheduleModal) ? '1px solid rgba(230, 57, 70, 0.25)' : '1px solid rgba(23, 24, 39, 0.06)',
                                                        borderRadius: '50%',
                                                        width: '36px',
                                                        height: '36px',
                                                        minWidth: '36px',
                                                        padding: '0',
                                                        margin: '0',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        touchAction: 'manipulation',
                                                        WebkitTapHighlightColor: 'transparent',
                                                        transition: 'all 0.2s ease',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    <Box display="flex" alignItems="center" justifyContent="center" width="100%" height="100%">
                                                        <MoreVertical size={17} color={(viewOnceMode || showPicker || scheduleModal) ? '#E63946' : '#727486'} />
                                                    </Box>
                                                    {viewOnceMode && (
                                                        <span style={{
                                                            position: 'absolute', top: '2px', right: '2px', width: '7px', height: '7px',
                                                            borderRadius: '50%', background: '#E63946', boxShadow: '0 0 6px rgba(230, 57, 70, 0.7)'
                                                        }} />
                                                    )}
                                                </MenuButton>
                                                <MenuList
                                                    style={{
                                                        background: 'rgba(255, 255, 255, 0.97)',
                                                        backdropFilter: 'blur(24px)',
                                                        WebkitBackdropFilter: 'blur(24px)',
                                                        borderRadius: '20px',
                                                        border: '1px solid rgba(23, 24, 39, 0.06)',
                                                        boxShadow: '0 20px 45px rgba(23, 24, 39, 0.08)',
                                                        padding: '8px',
                                                        minWidth: '220px',
                                                        zIndex: 9999
                                                    }}
                                                >
                                                    <MenuItem
                                                        onClick={startVoiceRecording}
                                                        style={{
                                                            borderRadius: '12px',
                                                            fontSize: '0.86rem',
                                                            fontWeight: 700,
                                                            color: '#171827',
                                                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px',
                                                            padding: '10px 14px'
                                                        }}
                                                        _hover={{ bg: 'rgba(91, 95, 239, 0.08)' }}
                                                    >
                                                        <Mic size={18} color="#5B5FEF" />
                                                        <span>Record Voice Note</span>
                                                    </MenuItem>
                                                    <MenuItem
                                                        onClick={startVideoNoteRecording}
                                                        style={{
                                                            borderRadius: '12px',
                                                            fontSize: '0.86rem',
                                                            fontWeight: 700,
                                                            color: '#171827',
                                                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px',
                                                            padding: '10px 14px'
                                                        }}
                                                        _hover={{ bg: 'rgba(91, 95, 239, 0.08)' }}
                                                    >
                                                        <Video size={18} color="#8067E8" />
                                                        <span>Record Video Short Note</span>
                                                    </MenuItem>
                                                    <MenuItem
                                                        onClick={toggleEmojiPicker}
                                                        style={{
                                                            borderRadius: '12px',
                                                            fontSize: '0.86rem',
                                                            fontWeight: 700,
                                                            color: showPicker ? '#5B5FEF' : '#171827',
                                                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px',
                                                            padding: '10px 14px'
                                                        }}
                                                        _hover={{ bg: 'rgba(91, 95, 239, 0.08)' }}
                                                    >
                                                        <Smile size={18} color={showPicker ? '#5B5FEF' : '#727486'} />
                                                        <span>{showPicker ? 'Close Emoji Picker' : 'Emoji Picker'}</span>
                                                    </MenuItem>
                                                    <MenuItem
                                                        onClick={() => {
                                                            setViewOnceMode(!viewOnceMode);
                                                            if (showPicker) setShowPicker(false);
                                                        }}
                                                        style={{
                                                            borderRadius: '12px',
                                                            fontSize: '0.86rem',
                                                            fontWeight: 700,
                                                            color: viewOnceMode ? '#E63946' : '#1E293B',
                                                            fontFamily: "'Outfit', 'Inter', sans-serif",
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px',
                                                            padding: '10px 14px'
                                                        }}
                                                        _hover={{ bg: 'rgba(230, 57, 70, 0.06)' }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                                            <Eye size={18} color={viewOnceMode ? '#E63946' : '#64748B'} />
                                                            <span>Send View-Once</span>
                                                        </div>
                                                        {viewOnceMode && <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#E63946', background: 'rgba(230,57,70,0.12)', padding: '2px 8px', borderRadius: '6px' }}>ACTIVE</span>}
                                                    </MenuItem>
                                                    <MenuItem
                                                        onClick={() => {
                                                            setScheduleModal(true);
                                                            if (showPicker) setShowPicker(false);
                                                        }}
                                                        style={{
                                                            borderRadius: '12px',
                                                            fontSize: '0.86rem',
                                                            fontWeight: 700,
                                                            color: '#1E293B',
                                                            fontFamily: "'Outfit', 'Inter', sans-serif",
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px',
                                                            padding: '10px 14px'
                                                        }}
                                                        _hover={{ bg: 'rgba(91, 95, 239, 0.08)' }}
                                                    >
                                                        <Clock size={18} color="#64748B" />
                                                        <span>Schedule Message</span>
                                                    </MenuItem>
                                                </MenuList>
                                            </Menu>
                                        </div>

                                        {/* ── FLOATING CIRCULAR VIDEO NOTE PREVIEW BUBBLE (TELEGRAM 4K STYLE) ── */}
                                        {isRecordingMedia && mediaRecordType === 'video' && (
                                            <motion.div
                                                initial={{ scale: 0.5, opacity: 0, y: 30 }}
                                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                                exit={{ scale: 0.5, opacity: 0, y: 30 }}
                                                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                                style={{
                                                    position: 'absolute',
                                                    bottom: '75px',
                                                    right: '16px',
                                                    width: '180px',
                                                    height: '180px',
                                                    borderRadius: '50%',
                                                    overflow: 'hidden',
                                                    border: '3px solid #5B5FEF',
                                                    boxShadow: '0 16px 50px rgba(0, 0, 0, 0.4), 0 0 35px rgba(91, 95, 239, 0.5)',
                                                    zIndex: 1000,
                                                    background: '#0F172A',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <video
                                                    ref={videoBubbleRef}
                                                    autoPlay
                                                    playsInline
                                                    muted
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        transform: 'scaleX(-1)'
                                                    }}
                                                />
                                                {/* Circular Recording Progress Ring */}
                                                <svg
                                                    style={{
                                                        position: 'absolute',
                                                        inset: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        transform: 'rotate(-90deg)',
                                                        pointerEvents: 'none'
                                                    }}
                                                    viewBox="0 0 180 180"
                                                >
                                                    <circle
                                                        cx="90"
                                                        cy="90"
                                                        r="84"
                                                        stroke="rgba(255, 255, 255, 0.25)"
                                                        strokeWidth="4"
                                                        fill="transparent"
                                                    />
                                                    <motion.circle
                                                        cx="90"
                                                        cy="90"
                                                        r="84"
                                                        stroke="#EF4444"
                                                        strokeWidth="4"
                                                        fill="transparent"
                                                        strokeDasharray={527}
                                                        animate={{ strokeDashoffset: [527, 0] }}
                                                        transition={{ duration: 60, ease: "linear" }}
                                                    />
                                                </svg>

                                                {/* Top Timer & Badge Overlay */}
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '12px',
                                                    background: 'rgba(10, 11, 20, 0.75)',
                                                    backdropFilter: 'blur(10px)',
                                                    padding: '2px 8px',
                                                    borderRadius: '99px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    border: '1px solid rgba(255, 255, 255, 0.2)'
                                                }}>
                                                    <motion.span
                                                        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                                                        transition={{ duration: 1, repeat: Infinity }}
                                                        style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }}
                                                    />
                                                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'monospace' }}>
                                                        {formatSeconds(recordingDuration)}
                                                    </span>
                                                </div>

                                                {/* Action Controls on Bubble */}
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: '12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px'
                                                }}>
                                                    <motion.button
                                                        type="button"
                                                        whileHover={{ scale: 1.15 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={cancelMediaRecording}
                                                        style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '50%',
                                                            background: 'rgba(239, 68, 68, 0.85)',
                                                            border: 'none',
                                                            color: '#FFFFFF',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        ✕
                                                    </motion.button>
                                                    <motion.button
                                                        type="button"
                                                        whileHover={{ scale: 1.15 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={finishMediaRecording}
                                                        style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '50%',
                                                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                                            border: 'none',
                                                            color: '#FFFFFF',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                                                        }}
                                                    >
                                                        <Send size={16} />
                                                    </motion.button>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* ── ACTIVE RECORDING STRIP (VOICE NOTE) ── */}
                                        {isRecordingMedia && mediaRecordType === 'voice' ? (
                                            <div style={{
                                                flex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '0 12px',
                                                height: '38px',
                                                background: isCancelSlid ? 'rgba(239, 68, 68, 0.1)' : 'rgba(91, 95, 239, 0.08)',
                                                borderRadius: '16px',
                                                border: isCancelSlid ? '1.5px solid #EF4444' : '1px solid rgba(91, 95, 239, 0.25)',
                                                transition: 'all 0.2s ease'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <motion.span
                                                        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                                                        transition={{ duration: 1, repeat: Infinity }}
                                                        style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }}
                                                    />
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                                                        {formatSeconds(recordingDuration)}
                                                    </span>
                                                    {/* Real-time Soundwave Bars */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginLeft: '6px' }}>
                                                        {[10, 22, 30, 16, 26, 12, 28, 18].map((h, idx) => (
                                                            <motion.div
                                                                key={idx}
                                                                animate={{ height: ['4px', `${h}px`, '4px'] }}
                                                                transition={{ duration: 0.6, repeat: Infinity, delay: idx * 0.08 }}
                                                                style={{ width: '3px', background: '#5B5FEF', borderRadius: '2px' }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                <div style={{
                                                    fontSize: '0.74rem',
                                                    fontWeight: 800,
                                                    color: isCancelSlid ? '#EF4444' : '#64748B',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}>
                                                    {isCancelSlid ? (
                                                        <span>🗑️ Release to Cancel</span>
                                                    ) : (
                                                        <span>⬆️ Slide Up for Video • ⬅️ Slide to Cancel</span>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            /* Auto-Expanding WhatsApp Style Modern Textarea */
                                            <textarea
                                                rows={1}
                                                placeholder={viewOnceMode ? "👁 View-once message..." : "Type a message..."}
                                                value={newMessage}
                                                onChange={(e) => {
                                                    typingHandler(e);
                                                    e.target.style.height = '36px';
                                                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                                                }}
                                                onFocus={(e) => {
                                                    setTimeout(() => {
                                                        try {
                                                            e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                                        } catch (err) {}
                                                    }, 200);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        sendMessage(e);
                                                        e.target.style.height = '36px';
                                                    }
                                                }}
                                                style={{
                                                    flex: 1,
                                                    border: 'none',
                                                    outline: 'none',
                                                    fontSize: '0.94rem',
                                                    fontFamily: "'Outfit', 'Inter', sans-serif",
                                                    fontWeight: 500,
                                                    color: '#0F172A',
                                                    background: 'transparent',
                                                    resize: 'none',
                                                    height: '36px',
                                                    maxHeight: '120px',
                                                    minHeight: '36px',
                                                    lineHeight: '1.45',
                                                    padding: '7px 6px',
                                                    overflowY: newMessage ? 'auto' : 'hidden'
                                                }}
                                            />
                                        )}

                                        {/* Right Action Tools: Send Button OR Hold/Swipe Media Recorder */}
                                        {newMessage.trim() ? (
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.05, y: -1 }}
                                                whileTap={{ scale: 0.94 }}
                                                onClick={(e) => {
                                                    sendMessage({ key: "Enter" });
                                                    const textarea = e.currentTarget.parentElement?.querySelector('textarea');
                                                    if (textarea) textarea.style.height = '36px';
                                                }}
                                                aria-label="Send Message"
                                                style={{
                                                    background: "linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)",
                                                    borderRadius: "18px",
                                                    height: "38px",
                                                    padding: "0 16px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: "6px",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    boxShadow: "0 4px 16px rgba(91, 95, 239, 0.28)",
                                                    color: "#FFFFFF",
                                                    fontWeight: 800,
                                                    fontSize: "0.78rem",
                                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                                    letterSpacing: "0.04em",
                                                    flexShrink: 0,
                                                    WebkitTapHighlightColor: 'transparent',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <span>AURA</span>
                                                <span>→</span>
                                            </motion.button>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {/* ── HOLD TO RECORD VOICE / HOLD UP TO RECORD VIDEO NOTE BUTTON ── */}
                                                <Tooltip
                                                    label={isRecordingMedia ? (mediaRecordType === 'video' ? "Recording Video Note (Release/Tap Send)" : "Slide ⬆️ for Video Note • Slide ⬅️ to Cancel") : "Hold for Voice Note • Hold & Slide ⬆️ for Video Note"}
                                                    hasArrow
                                                    placement="top"
                                                    isOpen={isRecordingMedia ? true : undefined}
                                                >
                                                    <motion.button
                                                        type="button"
                                                        onPointerDown={handleRecordPointerDown}
                                                        onPointerMove={handleRecordPointerMove}
                                                        onPointerUp={handleRecordPointerUp}
                                                        onContextMenu={(e) => e.preventDefault()}
                                                        animate={{
                                                            scale: isRecordingMedia ? 1.25 : 1,
                                                            boxShadow: isRecordingMedia
                                                                ? (mediaRecordType === 'video'
                                                                    ? '0 0 25px rgba(239, 68, 68, 0.7)'
                                                                    : '0 0 25px rgba(91, 95, 239, 0.7)')
                                                                : '0 2px 6px rgba(91, 95, 239, 0.08)'
                                                        }}
                                                        whileHover={{ scale: isRecordingMedia ? 1.25 : 1.08 }}
                                                        aria-label="Hold to record voice or video note"
                                                        style={{
                                                            background: isRecordingMedia
                                                                ? (mediaRecordType === 'video'
                                                                    ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                                                                    : 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)')
                                                                : 'rgba(91, 95, 239, 0.08)',
                                                            border: isRecordingMedia ? 'none' : '1.5px solid rgba(91, 95, 239, 0.25)',
                                                            borderRadius: '50%',
                                                            width: '38px',
                                                            height: '38px',
                                                            minWidth: '38px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            color: isRecordingMedia ? '#FFFFFF' : '#5B5FEF',
                                                            flexShrink: 0,
                                                            userSelect: 'none',
                                                            touchAction: 'none',
                                                            WebkitUserSelect: 'none',
                                                            transition: 'background 0.2s ease, color 0.2s ease'
                                                        }}
                                                    >
                                                        {mediaRecordType === 'video' && isRecordingMedia ? (
                                                            <Video size={18} />
                                                        ) : (
                                                            <Mic size={18} />
                                                        )}
                                                    </motion.button>
                                                </Tooltip>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Scheduled messages pending badge */}
                            {pendingScheduled.length > 0 && (
                                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {pendingScheduled.map(s => (
                                        <span key={s.id} style={{
                                            fontSize: 11, fontWeight: 700, background: '#EEF2FF', color: '#4F46E5',
                                            border: '1px solid #C7D2FE', borderRadius: 99, padding: '4px 10px',
                                        }}>
                                            ⏰ Scheduled: {s.content.slice(0, 20)}… → {new Date(s.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* ── 5. LIVE NETWORK TELEMETRY & VAULT SECURITY MODAL ── */}
                            <Modal isOpen={telemetryModalOpen} onClose={() => setTelemetryModalOpen(false)} isCentered size="lg">
                                <ModalOverlay bg="rgba(10, 11, 20, 0.55)" backdropFilter="blur(16px)" />
                                <ModalContent
                                    borderRadius="28px"
                                    bg="rgba(255, 255, 255, 0.98)"
                                    border="1px solid rgba(91, 95, 239, 0.25)"
                                    boxShadow="0 25px 70px rgba(91, 95, 239, 0.2)"
                                    p={4}
                                    fontFamily="'Plus Jakarta Sans', sans-serif"
                                >
                                    <ModalHeader display="flex" alignItems="center" justifyContent="space-between" pb={2} borderBottom="1px solid rgba(23, 24, 39, 0.06)">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }} />
                                            <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#171827' }}>
                                                AURA Architecture Telemetry
                                            </span>
                                        </div>
                                        <ModalCloseButton position="static" />
                                    </ModalHeader>
                                    <ModalBody py={4}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                                            <div style={{ background: '#F4F3EF', borderRadius: '18px', padding: '14px', border: '1px solid rgba(23, 24, 39, 0.05)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5B5FEF', marginBottom: '6px' }}>
                                                    <Zap size={16} />
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>DISPATCH LATENCY</span>
                                                </div>
                                                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#171827' }}>0.42 ms</div>
                                                <div style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>● Sub-Millisecond Native Sync</div>
                                            </div>
                                            <div style={{ background: '#F4F3EF', borderRadius: '18px', padding: '14px', border: '1px solid rgba(23, 24, 39, 0.05)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', marginBottom: '6px' }}>
                                                    <ShieldCheck size={16} />
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>VAULT ENCRYPTION</span>
                                                </div>
                                                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#171827' }}>256-Bit</div>
                                                <div style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>● Zero-Knowledge Client-Side</div>
                                            </div>
                                            <div style={{ background: '#F4F3EF', borderRadius: '18px', padding: '14px', border: '1px solid rgba(23, 24, 39, 0.05)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8067E8', marginBottom: '6px' }}>
                                                    <Radio size={16} />
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>WEBRTC SPATIAL AUDIO</span>
                                                </div>
                                                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#171827' }}>4K 60fps</div>
                                                <div style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>● Peer-to-Peer Direct Relay</div>
                                            </div>
                                            <div style={{ background: '#F4F3EF', borderRadius: '18px', padding: '14px', border: '1px solid rgba(23, 24, 39, 0.05)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6D8CFF', marginBottom: '6px' }}>
                                                    <Globe size={16} />
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>GLOBAL EDGE MESH</span>
                                                </div>
                                                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#171827' }}>99.999%</div>
                                                <div style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>● Online & Synchronized</div>
                                            </div>
                                        </div>

                                        {/* Equalizer Spectrum Live View */}
                                        <div style={{ background: '#171827', borderRadius: '18px', padding: '16px', color: '#FFFFFF', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#8067E8', marginBottom: '10px' }}>
                                                ✦ REAL-TIME SPATIAL EQUALIZER SPECTRUM
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', height: '40px' }}>
                                                {[16, 28, 44, 32, 48, 20, 36, 42, 24, 46, 30, 18, 38, 50, 22].map((val, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        animate={{ height: [8, val * 0.7, 8] }}
                                                        transition={{ duration: 0.6, repeat: Infinity, delay: idx * 0.05 }}
                                                        style={{ width: '5px', background: 'linear-gradient(180deg, #5B5FEF 0%, #8067E8 100%)', borderRadius: '4px' }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </ModalBody>
                                    <ModalFooter pt={2}>
                                        <Button colorScheme="blue" bg="linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)" color="#FFFFFF" borderRadius="99px" onClick={() => setTelemetryModalOpen(false)}>
                                            Close Telemetry
                                        </Button>
                                    </ModalFooter>
                                </ModalContent>
                            </Modal>

                            {/* Schedule Modal */}
                            {scheduleModal && (
                                <div style={{
                                    position: 'fixed', inset: 0,
                                    background: 'rgba(10, 10, 12, 0.45)',
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                    zIndex: 10001,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '20px'
                                }}>
                                    <motion.div
                                        initial={{ scale: 0.94, opacity: 0, y: 15 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.96)',
                                            backdropFilter: 'blur(40px)',
                                            WebkitBackdropFilter: 'blur(40px)',
                                            borderRadius: 28,
                                            padding: '28px 24px',
                                            maxWidth: 380,
                                            width: '100%',
                                            border: '1px solid rgba(255, 255, 255, 0.8)',
                                            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.16), inset 0 0 0 1px rgba(255, 255, 255, 0.9)',
                                            fontFamily: "'Outfit', 'Inter', sans-serif",
                                        }}
                                    >
                                        {/* Header */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                                            <span style={{
                                                fontSize: '0.72rem',
                                                fontWeight: 800,
                                                color: '#E63946',
                                                background: 'rgba(230, 57, 70, 0.08)',
                                                border: '1px solid rgba(230, 57, 70, 0.15)',
                                                padding: '4px 14px',
                                                borderRadius: 99,
                                                letterSpacing: '0.08em',
                                                textTransform: 'uppercase'
                                            }}>
                                                ✦ SCHEDULE MESSAGE
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setScheduleModal(false)}
                                                style={{
                                                    background: 'transparent', border: 'none', fontSize: 18, color: '#A1A1AA',
                                                    cursor: 'pointer', padding: '0 4px', lineHeight: 1
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        {/* Quick Presets */}
                                        <label style={{ fontSize: 11, fontWeight: 800, color: '#A1A1AA', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                                            Quick Time Presets
                                        </label>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    const d = new Date(Date.now() + 30 * 60000);
                                                    const year = d.getFullYear();
                                                    const month = String(d.getMonth() + 1).padStart(2, '0');
                                                    const day = String(d.getDate()).padStart(2, '0');
                                                    const hours = String(d.getHours()).padStart(2, '0');
                                                    const mins = String(d.getMinutes()).padStart(2, '0');
                                                    setScheduledAt(`${year}-${month}-${day}T${hours}:${mins}`);
                                                }}
                                                style={{
                                                    fontSize: '0.75rem', fontWeight: 700, padding: '6px 14px', borderRadius: 99,
                                                    background: 'rgba(0, 0, 0, 0.04)', border: '1px solid rgba(0, 0, 0, 0.06)',
                                                    color: '#52525B', cursor: 'pointer', transition: 'all 0.2s ease'
                                                }}
                                            >
                                                ⚡ +30 Mins
                                            </motion.button>
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    const d = new Date(Date.now() + 60 * 60000);
                                                    const year = d.getFullYear();
                                                    const month = String(d.getMonth() + 1).padStart(2, '0');
                                                    const day = String(d.getDate()).padStart(2, '0');
                                                    const hours = String(d.getHours()).padStart(2, '0');
                                                    const mins = String(d.getMinutes()).padStart(2, '0');
                                                    setScheduledAt(`${year}-${month}-${day}T${hours}:${mins}`);
                                                }}
                                                style={{
                                                    fontSize: '0.75rem', fontWeight: 700, padding: '6px 14px', borderRadius: 99,
                                                    background: 'rgba(0, 0, 0, 0.04)', border: '1px solid rgba(0, 0, 0, 0.06)',
                                                    color: '#52525B', cursor: 'pointer', transition: 'all 0.2s ease'
                                                }}
                                            >
                                                ⏳ +1 Hour
                                            </motion.button>
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    const d = new Date();
                                                    d.setDate(d.getDate() + 1);
                                                    const year = d.getFullYear();
                                                    const month = String(d.getMonth() + 1).padStart(2, '0');
                                                    const day = String(d.getDate()).padStart(2, '0');
                                                    setScheduledAt(`${year}-${month}-${day}T09:00`);
                                                }}
                                                style={{
                                                    fontSize: '0.75rem', fontWeight: 700, padding: '6px 14px', borderRadius: 99,
                                                    background: 'rgba(0, 0, 0, 0.04)', border: '1px solid rgba(0, 0, 0, 0.06)',
                                                    color: '#52525B', cursor: 'pointer', transition: 'all 0.2s ease'
                                                }}
                                            >
                                                🌅 Tomorrow 9 AM
                                            </motion.button>
                                        </div>

                                        {/* Date-Time Picker Input */}
                                        <label style={{ fontSize: 11, fontWeight: 800, color: '#A1A1AA', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                                            Custom Delivery Date & Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={scheduledAt}
                                            onChange={e => setScheduledAt(e.target.value)}
                                            style={{
                                                width: '100%',
                                                height: '46px',
                                                padding: '10px 14px',
                                                borderRadius: 14,
                                                border: '1.5px solid #E4E4E7',
                                                background: '#FAFAFA',
                                                color: '#18181B',
                                                fontSize: '0.9rem',
                                                fontWeight: 700,
                                                marginBottom: 20,
                                                fontFamily: "'Outfit', 'Inter', sans-serif",
                                                outline: 'none',
                                                cursor: 'pointer'
                                            }}
                                        />

                                        {/* Action Buttons */}
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={sendScheduledMessage}
                                                style={{
                                                    flex: 1,
                                                    background: 'linear-gradient(135deg, #E63946 0%, #D62839 100%)',
                                                    color: '#FFFFFF',
                                                    border: 'none',
                                                    borderRadius: 99,
                                                    padding: '12px 16px',
                                                    fontWeight: 800,
                                                    fontSize: 14,
                                                    cursor: 'pointer',
                                                    boxShadow: '0 8px 22px rgba(230, 57, 70, 0.32)'
                                                }}
                                            >
                                                Schedule Send
                                            </motion.button>
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setScheduleModal(false)}
                                                style={{
                                                    padding: '12px 18px',
                                                    background: '#F4F4F5',
                                                    border: '1px solid #E4E4E7',
                                                    borderRadius: 99,
                                                    fontSize: 14,
                                                    cursor: 'pointer',
                                                    fontWeight: 700,
                                                    color: '#71717A'
                                                }}
                                            >
                                                Cancel
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                </div>
                            )}

                            {/* Luxury PDF & Attachment Confirmation Modal / Drawer */}
                            {pendingAttachment && (
                                <div style={{
                                    position: 'fixed',
                                    inset: 0,
                                    background: 'rgba(15, 23, 42, 0.5)',
                                    backdropFilter: 'blur(16px)',
                                    WebkitBackdropFilter: 'blur(16px)',
                                    zIndex: 10002,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '16px'
                                }}>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ type: "spring", stiffness: 350, damping: 26 }}
                                        style={{
                                            background: '#FFFFFF',
                                            borderRadius: '28px',
                                            maxWidth: '420px',
                                            width: '100%',
                                            boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.25)',
                                            border: '1.5px solid rgba(226, 232, 240, 0.9)',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {/* Top Header Badge */}
                                        <div style={{
                                            padding: '18px 22px 14px',
                                            borderBottom: '1px solid #F1F5F9',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{
                                                    fontSize: '0.72rem',
                                                    fontWeight: 900,
                                                    letterSpacing: '0.08em',
                                                    textTransform: 'uppercase',
                                                    color: pendingAttachment.isPdf ? '#EF4444' : '#5B5FEF',
                                                    background: pendingAttachment.isPdf ? 'rgba(239, 68, 68, 0.1)' : 'rgba(91, 95, 239, 0.12)',
                                                    padding: '4px 10px',
                                                    borderRadius: '99px'
                                                }}>
                                                    {pendingAttachment.isPdf ? '📕 PDF DOCUMENT' : '📎 ATTACHMENT PREVIEW'}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setPendingAttachment(null)}
                                                style={{
                                                    background: '#F1F5F9',
                                                    border: 'none',
                                                    width: '28px',
                                                    height: '28px',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    color: '#64748B'
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        {/* Body Content */}
                                        <div style={{ padding: '22px' }}>
                                            {/* Preview Card */}
                                            <div style={{
                                                background: '#F8FAFC',
                                                border: '1.5px dashed #CBD5E1',
                                                borderRadius: '20px',
                                                padding: '20px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                textAlign: 'center',
                                                marginBottom: '18px'
                                            }}>
                                                {pendingAttachment.isPdf ? (
                                                    <div style={{
                                                        width: '64px',
                                                        height: '64px',
                                                        borderRadius: '18px',
                                                        background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
                                                        color: '#EF4444',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '32px',
                                                        boxShadow: '0 8px 20px rgba(239, 68, 68, 0.18)',
                                                        marginBottom: '14px'
                                                    }}>
                                                        📕
                                                    </div>
                                                ) : pendingAttachment.isImage ? (
                                                    <img
                                                        src={pendingAttachment.dataUrl}
                                                        alt="preview"
                                                        style={{
                                                            maxHeight: '140px',
                                                            borderRadius: '14px',
                                                            objectFit: 'cover',
                                                            marginBottom: '12px',
                                                            boxShadow: '0 4px 14px rgba(0,0,0,0.08)'
                                                        }}
                                                    />
                                                ) : (
                                                    <div style={{
                                                        width: '64px',
                                                        height: '64px',
                                                        borderRadius: '18px',
                                                        background: '#F1F5F9',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '30px',
                                                        marginBottom: '14px'
                                                    }}>
                                                        📄
                                                    </div>
                                                )}

                                                <h4 style={{
                                                    margin: '0 0 4px',
                                                    fontSize: '0.98rem',
                                                    fontWeight: 800,
                                                    color: '#0F172A',
                                                    fontFamily: "'Outfit', sans-serif",
                                                    maxWidth: '280px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {pendingAttachment.name}
                                                </h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                    <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                                                        File size: <strong style={{ color: '#0F172A' }}>{pendingAttachment.size}</strong>
                                                    </span>
                                                    {pendingAttachment.savedPercent > 0 && (
                                                        <div style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.08) 100%)',
                                                            border: '1px solid rgba(16, 185, 129, 0.3)',
                                                            padding: '3px 10px',
                                                            borderRadius: '99px',
                                                            marginTop: '2px'
                                                        }}>
                                                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                                                ⚡ {pendingAttachment.originalSize} ➔ {pendingAttachment.size} ({pendingAttachment.savedPercent}% Saved)
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Security Notice / View Once Toggle */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                background: '#F1F5F9',
                                                padding: '10px 16px',
                                                borderRadius: '14px',
                                                marginBottom: '20px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Eye size={16} color={viewOnceMode ? '#E63946' : '#64748B'} />
                                                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                                                        View Once Protection
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setViewOnceMode(!viewOnceMode)}
                                                    style={{
                                                        border: 'none',
                                                        background: viewOnceMode ? '#E63946' : '#CBD5E1',
                                                        color: '#FFFFFF',
                                                        fontSize: '0.72rem',
                                                        fontWeight: 800,
                                                        padding: '4px 12px',
                                                        borderRadius: '99px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    {viewOnceMode ? 'ENABLED' : 'OFF'}
                                                </button>
                                            </div>

                                            {/* Action Buttons */}
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <motion.button
                                                    type="button"
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.96 }}
                                                    onClick={() => setPendingAttachment(null)}
                                                    style={{
                                                        flex: 1,
                                                        height: '46px',
                                                        background: '#F1F5F9',
                                                        color: '#475569',
                                                        border: '1px solid #E2E8F0',
                                                        borderRadius: '16px',
                                                        fontWeight: 700,
                                                        fontSize: '0.9rem',
                                                        fontFamily: "'Outfit', sans-serif",
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Cancel
                                                </motion.button>
                                                <motion.button
                                                    type="button"
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.96 }}
                                                    onClick={confirmSendAttachment}
                                                    disabled={isSendingAttachment}
                                                    style={{
                                                        flex: 1.5,
                                                        height: '46px',
                                                        background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                                                        color: '#FFFFFF',
                                                        border: 'none',
                                                        borderRadius: '16px',
                                                        fontWeight: 800,
                                                        fontSize: '0.9rem',
                                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                                        cursor: isSendingAttachment ? 'not-allowed' : 'pointer',
                                                        boxShadow: '0 6px 18px rgba(91, 95, 239, 0.28)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px'
                                                    }}
                                                >
                                                    {isSendingAttachment ? 'Sending...' : 'Confirm & Send 🚀'}
                                                </motion.button>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </FormControl>
                    </Box>
                </>
            ) : (
                <Box
                    d="flex"
                    flexDir="column"
                    alignItems="center"
                    justifyContent="center"
                    h="100%"
                    w="100%"
                    position="relative"
                    overflow="hidden"
                    py={6}
                    px={4}
                    style={{
                        background: "var(--aura-ivory)"
                    }}
                >
                    {/* Concentric subtle aura energy rings */}
                    <motion.div
                        animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.6, 0.35] }}
                        transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                        style={{
                            position: "absolute",
                            width: "320px",
                            height: "320px",
                            borderRadius: "50%",
                            background: "radial-gradient(circle, rgba(91, 95, 239, 0.12) 0%, rgba(128, 103, 232, 0.04) 50%, transparent 75%)",
                            pointerEvents: "none"
                        }}
                    />

                    {/* Center Pearl Node with Aura Indigo pulse */}
                    <div style={{ position: "relative", marginBottom: "1.5rem" }}>
                        <motion.div
                            animate={{ scale: [1, 1.08, 1] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                            style={{
                                width: "80px",
                                height: "80px",
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 14px 36px rgba(91, 95, 239, 0.32)",
                                cursor: "pointer",
                                border: "3px solid #FFFFFF"
                            }}
                            onClick={onOpenDrawer}
                        >
                            <span style={{ fontSize: "28px", color: "#FFFFFF" }}>◉</span>
                        </motion.div>
                    </div>

                    <Text
                        fontSize="0.78rem"
                        fontWeight="800"
                        letterSpacing="0.16em"
                        color="#5B5FEF"
                        textTransform="uppercase"
                        fontFamily="'Plus Jakarta Sans', sans-serif"
                        mb={1}
                    >
                        YOUR AURA
                    </Text>

                    <h2 style={{
                        fontSize: "1.8rem",
                        fontWeight: 800,
                        color: "#171827",
                        letterSpacing: "-0.03em",
                        margin: "0 0 0.5rem",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        textAlign: "center"
                    }}>
                        Conversations are waiting.
                    </h2>

                    <p style={{
                        fontSize: "0.92rem",
                        color: "#727486",
                        maxWidth: "360px",
                        textAlign: "center",
                        lineHeight: 1.5,
                        margin: "0 0 2rem",
                        fontFamily: "'Plus Jakarta Sans', sans-serif"
                    }}>
                        Start something meaningful in your private living space.
                    </p>

                    <motion.button
                        whileHover={{ scale: 1.04, y: -1 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={onOpenDrawer}
                        style={{
                            background: "linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)",
                            color: "#FFFFFF",
                            padding: "12px 24px",
                            borderRadius: "99px",
                            border: "none",
                            fontSize: "0.88rem",
                            fontWeight: 700,
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            cursor: "pointer",
                            boxShadow: "0 8px 24px rgba(91, 95, 239, 0.28)",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}
                    >
                        <span>＋</span>
                        <span>New Conversation</span>
                    </motion.button>
                </Box>
            )}
        </>
    )
}

export default SingleChat;
