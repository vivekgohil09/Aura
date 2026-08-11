import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion';
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
import CallIcon from '@mui/icons-material/Call';
import { Phone, Video, Info, MoreVertical, Eye, Clock, Smile, Feather } from 'lucide-react';

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

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size must be less than 10MB");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            let fileDataUrl = event.target.result;
            if (file.type.startsWith('image/')) {
                fileDataUrl = await compressImage(fileDataUrl);
            }
            let rawContent = fileDataUrl;
            if (viewOnceMode) {
                rawContent = '[view-once] ' + fileDataUrl;
                setViewOnceMode(false);
            }
            const contentToSend = await compressData(rawContent);

            try {
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
                socket.emit('new message', data);
                setMessages(prev => [...prev, data]);
                toast.success("Attachment sent!", { autoClose: 1500, hideProgressBar: true });
            } catch (err) {
                toast.error("Failed to send attachment");
            }
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const toggleEmojiPicker = () => setShowPicker(!showPicker);
    const onEmojiClick = (event, emojiObject) => {
        setNewMessage((prev) => prev + (emojiObject?.emoji || ''));
    };

    const [isMuted, setIsMuted] = useState(false);
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
                        pt={1}
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
                            borderBottom: "1.5px solid rgba(212, 175, 55, 0.2)",
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
                                    <div className='d-flex align-items-center' style={{ gap: '8px', minWidth: 0, flex: 1, overflow: 'hidden', marginRight: '8px' }}>
                                        <Box display={{ base: "flex", md: "none" }} mr={2}>
                                            <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}>
                                                <IconButton
                                                    size="sm"
                                                    onClick={() => dispatch(delSelectedChat())}
                                                    icon={<ArrowBackIcon style={{ fontSize: "18px", color: "#0F172A" }} />}
                                                    aria-label="Back to chat list"
                                                    style={{
                                                        background: "#F8FAFC",
                                                        borderRadius: "12px",
                                                        border: "1px solid #E2E8F0",
                                                        width: "38px",
                                                        height: "38px",
                                                        boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)"
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
                                                bg="#0F172A !important"
                                                color="#D4AF37 !important"
                                                fontWeight="800"
                                                style={{ border: "2px solid #D4AF37" }}
                                            />
                                            <span 
                                                style={{
                                                    position: "absolute",
                                                    bottom: "2px",
                                                    right: "2px",
                                                    width: "10px",
                                                    height: "10px",
                                                    backgroundColor: isTargetOnline ? "#10B981" : "#9CA3AF",
                                                    borderRadius: "50%",
                                                    border: "2px solid #FFFFFF",
                                                }}
                                            />
                                        </div>
                                        <div className="d-flex flex-column justify-content-center" style={{ minWidth: 0, overflow: 'hidden' }}>
                                            <p className="fw-bold fs-6 m-0" style={{ color: "#0F172A", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.015em", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {getSender(user, selectedChat.users)}
                                            </p>
                                            {isTargetOnline ? (
                                                <motion.div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        marginTop: "2px",
                                                        whiteSpace: "nowrap",
                                                        background: "linear-gradient(90deg, rgba(16, 185, 129, 0.08) 0%, transparent 100%)",
                                                        paddingLeft: "4px",
                                                        borderRadius: "6px"
                                                    }}
                                                    animate={{ scale: [1, 1.02, 1] }}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                >
                                                    <motion.span
                                                        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                                                        transition={{ repeat: Infinity, duration: 2 }}
                                                        style={{
                                                            width: "6px",
                                                            height: "6px",
                                                            backgroundColor: "#10B981",
                                                            borderRadius: "50%",
                                                            display: "inline-block",
                                                            boxShadow: "0 0 8px rgba(16, 185, 129, 0.8)",
                                                            flexShrink: 0
                                                        }}
                                                    />
                                                    <span style={{ fontSize: "0.72rem", color: "#10B981", fontWeight: 700, letterSpacing: "0.02em" }}>
                                                        Active now
                                                    </span>
                                                </motion.div>
                                            ) : (
                                                <span style={{ fontSize: "0.72rem", color: "#64748B", display: "flex", alignItems: "center", gap: "4px", fontWeight: 500, marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                    <span style={{ width: "6px", height: "6px", backgroundColor: "#9CA3AF", borderRadius: "50%", display: "inline-block", flexShrink: 0 }}></span>
                                                    Last seen {formatLastSeenDate(targetLastSeen)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className='d-flex align-items-center' style={{ gap: '10px', flexShrink: 0 }}>
                                        <Tooltip label="Voice Call" hasArrow placement="bottom-end">
                                            <motion.div whileHover={{ scale: 1.06, y: -1 }} whileTap={{ scale: 0.94 }}>
                                                <IconButton
                                                    size="sm"
                                                    onClick={() => startVideoCall("voice")}
                                                    icon={<Phone size={19} color="#D4AF37" />}
                                                    aria-label="Voice Call"
                                                    style={{
                                                        background: "rgba(212, 175, 55, 0.1)",
                                                        borderRadius: "12px",
                                                        border: "1.5px solid rgba(212, 175, 55, 0.35)",
                                                        width: "40px",
                                                        height: "40px",
                                                        minWidth: "40px",
                                                        boxShadow: "0 2px 8px rgba(212, 175, 55, 0.12)"
                                                    }}
                                                />
                                            </motion.div>
                                        </Tooltip>
                                        <Tooltip label="Video Call" hasArrow placement="bottom-end">
                                            <motion.div whileHover={{ scale: 1.06, y: -1 }} whileTap={{ scale: 0.94 }}>
                                                <IconButton
                                                    size="sm"
                                                    onClick={() => startVideoCall("video")}
                                                    icon={<Video size={19} color="#FFFFFF" />}
                                                    aria-label="Video Call"
                                                    style={{
                                                        background: "linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)",
                                                        borderRadius: "12px",
                                                        border: "none",
                                                        width: "40px",
                                                        height: "40px",
                                                        minWidth: "40px",
                                                        boxShadow: "0 4px 14px rgba(212, 175, 55, 0.35)"
                                                    }}
                                                />
                                            </motion.div>
                                        </Tooltip>
                                    </div>
                                </>
                            );
                        })() : (
                            <>
                                <div className='d-flex flex-column justify-content-start align-items-start'>
                                    <div className='d-flex justify-content-start align-items-center gap-2'>
                                        <Avatar size="sm" cursor="pointer" name={selectedChat.chatName} />
                                        <div className="d-flex flex-column">
                                            <p className="fw-bold fs-6 m-0 font" style={{ color: "#303633" }}>{selectedChat.chatName}</p>
                                            <span style={{ fontSize: "0.72rem", color: "#4F8A82", display: "flex", alignItems: "center", gap: "4px" }}>
                                                🔒 End-to-End Encrypted Group
                                            </span>
                                        </div>
                                    </div>
                                    <div className='grpUser'>
                                        {selectedChat.users.map(name => {
                                            return (
                                                <small> {name.name},</small>
                                            )
                                        })}

                                    </div>
                                </div>
                                {
                                    <Tooltip label="View Group Details" hasArrow placement="bottom-end" bg='rgb(56, 90, 100)'>
                                        <Button onClick={onOpen}
                                        >
                                            <ViewIcon />
                                        </Button>
                                    </Tooltip>
                                }{
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
                                }
                            </>
                        )}
                    </Box>

                    <Box
                        d="flex"
                        flexDir="column"
                        justifyContent="space-between"
                        p={{ base: 2, sm: 3.5 }}
                        bg="linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)"
                        style={{
                            border: "1px solid #E2E8F0",
                            boxShadow: "inset 0 2px 12px rgba(15, 23, 42, 0.03)",
                            borderRadius: "20px"
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
                                <ScrollableChat chatId={(selectedChat && (selectedChat._id || selectedChat.id)) || null} otherUser={selectedChat ? getSenderUser(user, selectedChat.users) : null} messages={messages} setMessages={setMessages} isTyping={istyping} />
                            </Box>
                        )}
                        {/* Video & Voice Call Modal Overlay */}
                        {isVideoCallActive && (
                            <Portal>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                style={{
                                    position: "fixed",
                                    top: 0,
                                    left: 0,
                                    width: "100vw",
                                    height: "100vh",
                                    background: "radial-gradient(ellipse at 50% 0%, #1a1a2e 0%, #0d0d1a 40%, #000000 100%)",
                                    zIndex: 9999,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "32px 20px 28px 20px",
                                    overflow: "hidden"
                                }}
                            >
                                {/* Ambient Glow Effects */}
                                <motion.div
                                    animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    style={{
                                        position: "absolute",
                                        top: "-120px",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        width: "500px",
                                        height: "500px",
                                        borderRadius: "50%",
                                        background: "radial-gradient(circle, rgba(212, 175, 55, 0.12) 0%, transparent 70%)",
                                        pointerEvents: "none"
                                    }}
                                />
                                <motion.div
                                    animate={{ opacity: [0.15, 0.35, 0.15] }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                    style={{
                                        position: "absolute",
                                        bottom: "-80px",
                                        right: "-60px",
                                        width: "400px",
                                        height: "400px",
                                        borderRadius: "50%",
                                        background: "radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, transparent 70%)",
                                        pointerEvents: "none"
                                    }}
                                />

                                {/* Header Section */}
                                <Box display="flex" flexDirection="column" alignItems="center" zIndex={10}>
                                    <Box
                                        display="inline-flex"
                                        alignItems="center"
                                        gap="8px"
                                        bg="rgba(212, 175, 55, 0.08)"
                                        px={4}
                                        py={1.5}
                                        borderRadius="99px"
                                        border="1px solid rgba(212, 175, 55, 0.25)"
                                        mb={3}
                                        style={{ backdropFilter: "blur(16px)" }}
                                    >
                                        <motion.span
                                            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                            style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#D4AF37", boxShadow: "0 0 12px rgba(212, 175, 55, 0.8)", display: "inline-block" }}
                                        />
                                        <Text fontSize="0.72rem" fontWeight="800" color="#D4AF37" letterSpacing="0.1em" margin={0}>
                                            {callType === "video" ? "HD VIDEO • E2E ENCRYPTED" : "HD VOICE • E2E ENCRYPTED"}
                                        </Text>
                                    </Box>
                                    <Text fontSize="1.6rem" fontWeight="800" color="#FFFFFF" fontFamily="'Outfit', sans-serif" letterSpacing="-0.02em" mt={1} margin={0}>
                                        {getSender(user, selectedChat.users)}
                                    </Text>
                                    <Box display="flex" alignItems="center" gap="6px" mt={2}>
                                        {isCallAccepted ? (
                                            <Text fontSize="0.88rem" fontWeight="700" color="#D4AF37" margin={0}>
                                                {formatCallDuration(callDuration)}
                                            </Text>
                                        ) : (
                                            <Box display="flex" alignItems="center" gap="6px">
                                                <Text fontSize="0.88rem" fontWeight="600" color="rgba(255,255,255,0.6)" margin={0}>Calling</Text>
                                                {[0, 1, 2].map((i) => (
                                                    <motion.span
                                                        key={i}
                                                        animate={{ opacity: [0.2, 1, 0.2] }}
                                                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                                                        style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#D4AF37", display: "inline-block" }}
                                                    />
                                                ))}
                                            </Box>
                                        )}
                                    </Box>
                                </Box>

                                {/* Center Hero Content */}
                                {callType === "video" ? (
                                    <Box
                                        position="relative"
                                        width="100%"
                                        maxW="780px"
                                        flex="1"
                                        minH="0"
                                        display="flex"
                                        justifyContent="center"
                                        alignItems="center"
                                        bg="#0a0a0f"
                                        borderRadius="28px"
                                        overflow="hidden"
                                        border="1.5px solid rgba(212, 175, 55, 0.2)"
                                        boxShadow="0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(212, 175, 55, 0.06)"
                                        zIndex={10}
                                        my={3}
                                    >
                                        {/* Remote Participant HD Video Stream */}
                                        <video 
                                            ref={remoteVideoRef} 
                                            autoPlay 
                                            playsInline 
                                            style={{ 
                                                width: '100%', 
                                                height: '100%', 
                                                objectFit: 'cover', 
                                                borderRadius: '28px',
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
                                                    borderRadius: '28px' 
                                                }} 
                                            />
                                        )}

                                        {/* HD LIVE Badge Overlay */}
                                        <Box
                                            position="absolute"
                                            top="16px"
                                            left="16px"
                                            display="flex"
                                            alignItems="center"
                                            gap="6px"
                                            bg="rgba(0, 0, 0, 0.55)"
                                            backdropFilter="blur(16px)"
                                            px={3}
                                            py={1}
                                            borderRadius="99px"
                                            border="1px solid rgba(255, 255, 255, 0.1)"
                                            zIndex={25}
                                        >
                                            <motion.span
                                                animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FF3B5C", display: "inline-block" }}
                                            />
                                            <Text fontSize="0.68rem" fontWeight="800" color="#FFFFFF" letterSpacing="0.06em" margin={0}>
                                                {isCallAccepted ? "HD LIVE" : "CONNECTING"}
                                            </Text>
                                        </Box>

                                        {/* Floating PiP Self View when call is connected */}
                                        {isCallAccepted && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                                style={{
                                                    position: "absolute",
                                                    bottom: "16px",
                                                    right: "16px",
                                                    width: "140px",
                                                    height: "105px",
                                                    borderRadius: "16px",
                                                    overflow: "hidden",
                                                    border: "2px solid rgba(212, 175, 55, 0.5)",
                                                    boxShadow: "0 8px 28px rgba(0, 0, 0, 0.5), 0 0 15px rgba(212, 175, 55, 0.1)",
                                                    zIndex: 20,
                                                    background: "#000"
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
                                                <Box position="absolute" bottom="4px" left="6px" bg="rgba(0, 0, 0, 0.6)" px={1.5} py={0.5} borderRadius="6px">
                                                    <Text fontSize="9px" fontWeight="700" color="#D4AF37" margin={0}>You</Text>
                                                </Box>
                                            </motion.div>
                                        )}

                                        {!isCallAccepted && (
                                            <Box position="absolute" bottom="16px" right="16px" bg="rgba(0, 0, 0, 0.5)" backdropFilter="blur(12px)" px={3} py={1} borderRadius="12px" border="1px solid rgba(255, 255, 255, 0.1)" zIndex={25}>
                                                <Text fontSize="0.72rem" fontWeight="700" color="rgba(255,255,255,0.8)" margin={0}>You (Self View)</Text>
                                            </Box>
                                        )}
                                    </Box>
                                ) : (
                                    <Box display="flex" flexDirection="column" alignItems="center" my="auto" position="relative" zIndex={10}>
                                        {/* Gold Pulse Ring Animations */}
                                        <motion.div
                                            animate={{ scale: [1, 1.5, 1], opacity: [0.25, 0, 0.25] }}
                                            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                                            style={{
                                                position: "absolute",
                                                top: "calc(50% - 85px)",
                                                width: "170px",
                                                height: "170px",
                                                borderRadius: "50%",
                                                background: "rgba(212, 175, 55, 0.15)"
                                            }}
                                        />
                                        <motion.div
                                            animate={{ scale: [1, 1.8, 1], opacity: [0.12, 0, 0.12] }}
                                            transition={{ duration: 2.4, repeat: Infinity, delay: 0.6, ease: "easeInOut" }}
                                            style={{
                                                position: "absolute",
                                                top: "calc(50% - 85px)",
                                                width: "170px",
                                                height: "170px",
                                                borderRadius: "50%",
                                                background: "rgba(212, 175, 55, 0.08)"
                                            }}
                                        />

                                        <Avatar
                                            size="2xl"
                                            name={getSender(user, selectedChat.users)}
                                            src={getPicture(user, selectedChat.users)}
                                            bg="rgba(212, 175, 55, 0.15)"
                                            color="#D4AF37"
                                            fontWeight="800"
                                            fontSize="2.8rem"
                                            style={{
                                                width: "130px",
                                                height: "130px",
                                                border: "3px solid rgba(212, 175, 55, 0.4)",
                                                boxShadow: "0 15px 45px rgba(212, 175, 55, 0.2), 0 0 30px rgba(212, 175, 55, 0.1)",
                                                position: "relative",
                                                zIndex: 2
                                            }}
                                        />

                                        {/* Audio Equalizer Bars */}
                                        <Box display="flex" alignItems="center" gap="5px" mt={7} mb={2}>
                                            {[0, 1, 2, 3, 4].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    animate={{ height: ["10px", "26px", "12px", "32px", "10px"] }}
                                                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                                                    style={{
                                                        width: "4px",
                                                        background: "linear-gradient(180deg, #D4AF37 0%, #F59E0B 100%)",
                                                        borderRadius: "4px"
                                                    }}
                                                />
                                            ))}
                                        </Box>

                                        <Text color="rgba(255, 255, 255, 0.5)" fontSize="0.82rem" fontWeight="600" mt={1} margin={0}>
                                            {isCallAccepted ? "AURA Live HD Audio Stream Active" : "Waiting for contact to answer..."}
                                        </Text>
                                    </Box>
                                )}

                                {/* Real-time Live Subtitles / Captions Container - Transparent Frosted Glass with Typewriter Effect */}
                                {liveCaptionsEnabled && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                        whileHover={{
                                            scale: 1.01,
                                            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35)",
                                            borderColor: "rgba(212, 175, 55, 0.4)"
                                        }}
                                        style={{
                                            width: "95%",
                                            maxWidth: "480px",
                                            margin: "0 auto 12px auto",
                                            background: "rgba(255, 255, 255, 0.06)",
                                            backdropFilter: "blur(24px)",
                                            WebkitBackdropFilter: "blur(24px)",
                                            padding: "14px 18px",
                                            borderRadius: "24px",
                                            textAlign: "left",
                                            border: "1px solid rgba(255, 255, 255, 0.1)",
                                            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.25)",
                                            zIndex: 40,
                                            cursor: "pointer",
                                            transition: "border-color 0.25s ease, box-shadow 0.25s ease"
                                        }}
                                    >
                                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                            <Box display="flex" alignItems="center" gap="6px">
                                                <motion.span
                                                    animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                                    style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#D4AF37", display: "inline-block" }}
                                                />
                                                <Text color="#D4AF37" fontSize="0.72rem" fontWeight="800" letterSpacing="0.08em" textTransform="uppercase" m={0}>
                                                    LIVE AI CAPTIONS & TRANSLATION
                                                </Text>
                                            </Box>
                                            <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "rgba(255,255,255,0.5)", background: "rgba(255, 255, 255, 0.06)", padding: "2px 8px", borderRadius: "99px" }}>
                                                HD REAL-TIME
                                            </span>
                                        </Box>

                                        {captionsLog.length === 0 && !currentTranscript && (
                                            <Text color="rgba(255,255,255,0.45)" fontSize="0.84rem" fontWeight="600" italic m={0}>
                                                🎙️ Speaking to generate live captions...
                                                <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.75 }} style={{ color: "#D4AF37", marginLeft: "4px", fontWeight: "bold" }}>|</motion.span>
                                            </Text>
                                        )}
                                        {captionsLog.map((c, index) => (
                                            <motion.div key={c.id || index} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} style={{ marginBottom: "8px" }}>
                                                <Text color="rgba(255,255,255,0.9)" fontSize="0.92rem" fontWeight="700" m={0} style={{ lineHeight: 1.4 }}>
                                                    <span style={{ color: "#D4AF37", fontWeight: 800 }}>{c.speaker}:</span> {c.original}
                                                </Text>
                                                {c.translated && (
                                                    <Text color="#10B981" fontSize="0.86rem" fontWeight="800" m={0} style={{ marginTop: "2px" }}>
                                                        🌐 {c.translated}
                                                    </Text>
                                                )}
                                            </motion.div>
                                        ))}
                                        {currentTranscript && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                <Text color="rgba(255,255,255,0.7)" fontSize="0.9rem" fontWeight="700" italic m={0}>
                                                    {currentTranscript}
                                                    <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} style={{ color: "#D4AF37", marginLeft: "3px", fontWeight: 900 }}>|</motion.span>
                                                </Text>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                )}

                                {/* Three-Dots More Options Glass Popover Menu */}
                                {showMoreMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        style={{
                                            marginBottom: "12px",
                                            background: "rgba(255, 255, 255, 0.06)",
                                            backdropFilter: "blur(28px)",
                                            WebkitBackdropFilter: "blur(28px)",
                                            borderRadius: "24px",
                                            padding: "12px 16px",
                                            border: "1px solid rgba(255, 255, 255, 0.1)",
                                            boxShadow: "0 20px 45px rgba(0, 0, 0, 0.35)",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            zIndex: 50
                                        }}
                                    >
                                        {/* Captions Toggle */}
                                        <Tooltip label={liveCaptionsEnabled ? "Disable Captions" : "Enable Captions"} hasArrow placement="top">
                                            <motion.div
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setLiveCaptionsEnabled(!liveCaptionsEnabled)}
                                                style={{
                                                    padding: "8px 14px",
                                                    borderRadius: "99px",
                                                    background: liveCaptionsEnabled ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.06)",
                                                    border: liveCaptionsEnabled ? "1.5px solid #10B981" : "1px solid rgba(255, 255, 255, 0.15)",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px"
                                                }}
                                            >
                                                <span>💬</span>
                                                <Text fontSize="0.78rem" fontWeight="800" color={liveCaptionsEnabled ? "#10B981" : "rgba(255,255,255,0.6)"} m={0}>
                                                    Captions {liveCaptionsEnabled ? "ON" : "OFF"}
                                                </Text>
                                            </motion.div>
                                        </Tooltip>

                                        {/* Voice Translation Toggle */}
                                        <Tooltip label={translateEnabled ? "Disable Translation" : "Enable Translation"} hasArrow placement="top">
                                            <motion.div
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setTranslateEnabled(!translateEnabled)}
                                                style={{
                                                    padding: "8px 14px",
                                                    borderRadius: "99px",
                                                    background: translateEnabled ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.06)",
                                                    border: translateEnabled ? "1.5px solid #6366F1" : "1px solid rgba(255, 255, 255, 0.15)",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px"
                                                }}
                                            >
                                                <span>🌐</span>
                                                <Text fontSize="0.78rem" fontWeight="800" color={translateEnabled ? "#818CF8" : "rgba(255,255,255,0.6)"} m={0}>
                                                    Translate {translateEnabled ? "ON" : "OFF"}
                                                </Text>
                                            </motion.div>
                                        </Tooltip>

                                        {/* Noise Filter Toggle */}
                                        <Tooltip label={noiseFilterEnabled ? "Disable Noise Suppression" : "Enable Noise Suppression"} hasArrow placement="top">
                                            <motion.div
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setNoiseFilterEnabled(!noiseFilterEnabled)}
                                                style={{
                                                    padding: "8px 14px",
                                                    borderRadius: "99px",
                                                    background: noiseFilterEnabled ? "rgba(212, 175, 55, 0.15)" : "rgba(255, 255, 255, 0.06)",
                                                    border: noiseFilterEnabled ? "1.5px solid #D4AF37" : "1px solid rgba(255, 255, 255, 0.15)",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px"
                                                }}
                                            >
                                                <span>🎙️</span>
                                                <Text fontSize="0.78rem" fontWeight="800" color={noiseFilterEnabled ? "#D4AF37" : "rgba(255,255,255,0.6)"} m={0}>
                                                    Noise Filter {noiseFilterEnabled ? "ON" : "OFF"}
                                                </Text>
                                            </motion.div>
                                        </Tooltip>
                                    </motion.div>
                                )}

                                {/* Floating Control Bar - 4 Main Buttons (Mute, Video Switch, Three-Dots, End Call) */}
                                <motion.div
                                    initial={{ y: 40, opacity: 0, scale: 0.96 }}
                                    animate={{ y: 0, opacity: 1, scale: 1 }}
                                    exit={{ y: 40, opacity: 0, scale: 0.96 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 26 }}
                                    style={{ width: "100%", display: "flex", justifyContent: "center" }}
                                >
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        bg="rgba(255, 255, 255, 0.78)"
                                        backdropFilter="blur(30px)"
                                        WebkitBackdropFilter="blur(30px)"
                                        px={{ base: 4, sm: 5, md: 6 }}
                                        py={2.5}
                                        borderRadius="99px"
                                        border="1.5px solid rgba(255, 255, 255, 0.95)"
                                        boxShadow="0 20px 50px rgba(255, 42, 84, 0.15), 0 10px 30px rgba(0, 0, 0, 0.08)"
                                        maxW="100%"
                                        mx="auto"
                                        zIndex={30}
                                    >
                                        <Box display="flex" alignItems="center" justifyContent="center" flexWrap="nowrap" gap={{ base: 2.5, sm: 3.5, md: 4 }}>
                                            {/* 1. Mic Toggle Button */}
                                            <Tooltip label={isMuted ? "Unmute Mic" : "Mute Mic"} hasArrow placement="top">
                                                <motion.div
                                                    whileHover={{ scale: 1.12, y: -2 }}
                                                    whileTap={{ scale: 0.88 }}
                                                    onClick={toggleMute}
                                                    style={{
                                                        width: "48px",
                                                        height: "48px",
                                                        minWidth: "48px",
                                                        borderRadius: "50%",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        background: isMuted ? "rgba(255, 42, 84, 0.15)" : "#FFFFFF",
                                                        border: isMuted ? "2px solid #FF2A54" : "1.5px solid #F1F1F4",
                                                        boxShadow: isMuted ? "0 0 18px rgba(255, 42, 84, 0.35)" : "0 5px 15px rgba(0, 0, 0, 0.05)",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    {isMuted ? <MicOffIcon style={{ color: "#FF2A54", fontSize: 20 }} /> : <MicIcon style={{ color: "#1E1B18", fontSize: 20 }} />}
                                                </motion.div>
                                            </Tooltip>

                                            {/* 2. Switch Video / Audio Call Button */}
                                            <Tooltip label={callType === "video" ? (isCameraOff ? "Turn Camera On" : "Turn Camera Off") : "Switch to Video Call"} hasArrow placement="top">
                                                <motion.div
                                                    whileHover={{ scale: 1.12, y: -2 }}
                                                    whileTap={{ scale: 0.88 }}
                                                    onClick={() => {
                                                        if (callType === "video") {
                                                            toggleCamera();
                                                        } else {
                                                            setCallType("video");
                                                            toast.success("Switched to HD Video Call!");
                                                        }
                                                    }}
                                                    style={{
                                                        width: "48px",
                                                        height: "48px",
                                                        minWidth: "48px",
                                                        borderRadius: "50%",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        background: (callType === "video" && isCameraOff) ? "rgba(255, 42, 84, 0.15)" : "#FFFFFF",
                                                        border: (callType === "video" && isCameraOff) ? "2px solid #FF2A54" : "1.5px solid #F1F1F4",
                                                        boxShadow: "0 5px 15px rgba(0, 0, 0, 0.05)",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    {(callType === "video" && isCameraOff) ? (
                                                        <VideocamOffIcon style={{ color: "#FF2A54", fontSize: 20 }} />
                                                    ) : (
                                                        <VideocamIcon style={{ color: "#1E1B18", fontSize: 20 }} />
                                                    )}
                                                </motion.div>
                                            </Tooltip>

                                            {/* 3. Three-Dots More Options Button */}
                                            <Tooltip label="More Options" hasArrow placement="top">
                                                <motion.div
                                                    whileHover={{ scale: 1.12, y: -2 }}
                                                    whileTap={{ scale: 0.88 }}
                                                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                                                    style={{
                                                        width: "48px",
                                                        height: "48px",
                                                        minWidth: "48px",
                                                        borderRadius: "50%",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        background: showMoreMenu ? "rgba(255, 42, 84, 0.15)" : "#FFFFFF",
                                                        border: showMoreMenu ? "2px solid #FF2A54" : "1.5px solid #F1F1F4",
                                                        boxShadow: "0 5px 15px rgba(0, 0, 0, 0.05)",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    <span style={{ fontSize: "1.3rem", fontWeight: 900, color: showMoreMenu ? "#FF2A54" : "#1E1B18", lineHeight: 1 }}>⋮</span>
                                                </motion.div>
                                            </Tooltip>

                                            {/* 4. End Call Button */}
                                            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.94 }}>
                                                <Button 
                                                    onClick={endVideoCall} 
                                                    leftIcon={<CallEndIcon style={{ fontSize: 18 }} />}
                                                    size="md"
                                                    style={{
                                                        background: "linear-gradient(135deg, #FF2A54 0%, #D62839 100%)",
                                                        color: "#FFFFFF",
                                                        borderRadius: "99px",
                                                        padding: "0 20px",
                                                        height: "48px",
                                                        fontWeight: 800,
                                                        fontSize: "0.88rem",
                                                        boxShadow: "0 8px 24px rgba(255, 42, 84, 0.5)",
                                                        border: "none",
                                                        whiteSpace: "nowrap"
                                                    }}
                                                >
                                                    End Call
                                                </Button>
                                            </motion.div>
                                        </Box>
                                    </Box>
                                </motion.div>

                                {/* Secondary Bar for Language Selection when Translate is active */}
                                {translateEnabled && (
                                    <Box display="flex" alignItems="center" gap={2} pt={2}>
                                        <Text fontSize="0.75rem" fontWeight="800" color="#FF2A54" m={0}>
                                            Target Language:
                                        </Text>
                                        <select
                                            value={targetLang}
                                            onChange={(e) => setTargetLang(e.target.value)}
                                            style={{
                                                background: "rgba(255, 255, 255, 0.8)",
                                                color: "#1E1B18",
                                                borderRadius: "10px",
                                                padding: "4px 12px",
                                                fontSize: "0.78rem",
                                                fontWeight: 700,
                                                border: "1px solid #FFE3E6",
                                                outline: "none"
                                            }}
                                        >
                                            <option value="hi">Hindi (हिंदी)</option>
                                            <option value="es">Spanish (Español)</option>
                                            <option value="fr">French (Français)</option>
                                            <option value="de">German (Deutsch)</option>
                                            <option value="ja">Japanese (日本語)</option>
                                            <option value="zh">Chinese (中文)</option>
                                        </select>
                                    </Box>
                                )}
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
                            mt={3}
                            position="sticky"
                            bottom="0"
                            zIndex="100"
                        >

                            {showPicker && (
                                <Box position="absolute" bottom="75px" left="10px" zIndex="1000">
                                    <Picker onEmojiClick={onEmojiClick} />
                                </Box>
                            )}

                            <div 
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    gap: '6px',
                                    background: 'rgba(255, 255, 255, 0.95)',
                                    backdropFilter: 'blur(20px)',
                                    border: '1px solid rgba(226, 232, 240, 0.9)',
                                    borderRadius: '24px',
                                    padding: '6px 10px',
                                    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
                                    WebkitTapHighlightColor: 'transparent'
                                }}
                            >
                                {/* Primary File Attachment Button */}
                                <Tooltip label="Attach File / Photo" hasArrow placement="top">
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.08, y: -1 }}
                                        whileTap={{ scale: 0.92 }}
                                        onClick={() => {
                                            if (showPicker) setShowPicker(false);
                                            if (fileInputRef.current) fileInputRef.current.click();
                                        }}
                                        style={{
                                            background: 'rgba(0, 0, 0, 0.03)',
                                            border: '1px solid rgba(0, 0, 0, 0.05)',
                                            borderRadius: '14px',
                                            width: '36px',
                                            height: '36px',
                                            minWidth: '36px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            marginBottom: '2px',
                                            touchAction: 'manipulation',
                                            WebkitTapHighlightColor: 'transparent',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <AttachFileIcon style={{ fontSize: '18px', color: '#71717A' }} />
                                    </motion.button>
                                </Tooltip>

                                {/* Three Dots Options Menu (More Actions) */}
                                <Menu placement="top-start" isLazy>
                                    <MenuButton
                                        as={motion.button}
                                        type="button"
                                        p={0}
                                        m={0}
                                        whileHover={{ scale: 1.08, y: -1 }}
                                        whileTap={{ scale: 0.92 }}
                                        onClick={() => {
                                            if (showPicker) setShowPicker(false);
                                        }}
                                        style={{
                                            background: (viewOnceMode || showPicker || scheduleModal) ? 'rgba(230, 57, 70, 0.08)' : 'rgba(0, 0, 0, 0.03)',
                                            border: (viewOnceMode || showPicker || scheduleModal) ? '1px solid rgba(230, 57, 70, 0.2)' : '1px solid rgba(0, 0, 0, 0.05)',
                                            borderRadius: '14px',
                                            width: '36px',
                                            height: '36px',
                                            minWidth: '36px',
                                            padding: '0',
                                            margin: '0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            marginBottom: '2px',
                                            touchAction: 'manipulation',
                                            WebkitTapHighlightColor: 'transparent',
                                            transition: 'all 0.2s ease',
                                            position: 'relative'
                                        }}
                                    >
                                        <Box display="flex" alignItems="center" justifyContent="center" width="100%" height="100%">
                                            <MoreVertical size={18} color={(viewOnceMode || showPicker || scheduleModal) ? '#E63946' : '#71717A'} />
                                        </Box>
                                        {viewOnceMode && (
                                            <span style={{
                                                position: 'absolute', top: '3px', right: '3px', width: '6px', height: '6px',
                                                borderRadius: '50%', background: '#E63946', boxShadow: '0 0 6px rgba(230, 57, 70, 0.6)'
                                            }} />
                                        )}
                                    </MenuButton>
                                    <MenuList
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.95)',
                                            backdropFilter: 'blur(24px)',
                                            WebkitBackdropFilter: 'blur(24px)',
                                            borderRadius: '20px',
                                            border: '1px solid rgba(0, 0, 0, 0.06)',
                                            boxShadow: '0 18px 45px rgba(0, 0, 0, 0.12)',
                                            padding: '8px',
                                            minWidth: '200px',
                                            zIndex: 9999
                                        }}
                                    >
                                        <MenuItem
                                            onClick={toggleEmojiPicker}
                                            style={{
                                                borderRadius: '12px',
                                                fontSize: '0.86rem',
                                                fontWeight: 700,
                                                color: showPicker ? '#E63946' : '#18181B',
                                                fontFamily: "'Outfit', 'Inter', sans-serif",
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '10px 14px'
                                            }}
                                            _hover={{ bg: 'rgba(230, 57, 70, 0.06)' }}
                                        >
                                            <Smile size={18} color={showPicker ? '#E63946' : '#71717A'} />
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
                                                color: viewOnceMode ? '#E63946' : '#18181B',
                                                fontFamily: "'Outfit', 'Inter', sans-serif",
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '10px 14px'
                                            }}
                                            _hover={{ bg: 'rgba(230, 57, 70, 0.06)' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <Eye size={18} color={viewOnceMode ? '#E63946' : '#71717A'} />
                                                <span>Send View-Once</span>
                                            </div>
                                            {viewOnceMode && <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#E63946', background: 'rgba(230,57,70,0.1)', padding: '2px 6px', borderRadius: '6px' }}>ON</span>}
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
                                                color: '#18181B',
                                                fontFamily: "'Outfit', 'Inter', sans-serif",
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '10px 14px'
                                            }}
                                            _hover={{ bg: 'rgba(230, 57, 70, 0.06)' }}
                                        >
                                            <Clock size={18} color="#71717A" />
                                            <span>Schedule Message</span>
                                        </MenuItem>
                                    </MenuList>
                                </Menu>

                                {/* Auto-Expanding WhatsApp Style Textarea */}
                                <textarea
                                    rows={1}
                                    placeholder={viewOnceMode ? "👁 View-once message..." : "Type a message..."}
                                    value={newMessage}
                                    onChange={(e) => {
                                        typingHandler(e);
                                        e.target.style.height = '38px';
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
                                            e.target.style.height = '38px';
                                        }
                                    }}
                                    style={{
                                        flex: 1,
                                        border: 'none',
                                        outline: 'none',
                                        fontSize: '0.92rem',
                                        fontFamily: "'Outfit', 'Inter', sans-serif",
                                        fontWeight: 500,
                                        color: '#0F172A',
                                        background: 'transparent',
                                        resize: 'none',
                                        height: '38px',
                                        maxHeight: '120px',
                                        minHeight: '38px',
                                        lineHeight: '1.4',
                                        padding: '8px 10px',
                                        overflowY: newMessage ? 'auto' : 'hidden'
                                    }}
                                />

                                {/* Glowing Send Button */}
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.08, y: -2 }}
                                    whileTap={{ scale: 0.88 }}
                                    onClick={(e) => {
                                        sendMessage({ key: "Enter" });
                                        const textarea = e.currentTarget.parentElement?.querySelector('textarea');
                                        if (textarea) textarea.style.height = '38px';
                                    }}
                                    aria-label="Send Message"
                                    style={{
                                        background: "linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)",
                                        borderRadius: "16px",
                                        width: "40px",
                                        height: "40px",
                                        minWidth: "40px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        border: "none",
                                        cursor: "pointer",
                                        boxShadow: "0 4px 16px rgba(212, 175, 55, 0.4)",
                                        color: "#FFFFFF",
                                        flexShrink: 0,
                                        WebkitTapHighlightColor: 'transparent'
                                    }}
                                >
                                    <SendIcon style={{ fontSize: "19px" }} />
                                </motion.button>
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

                                        {/* Message Preview Card */}
                                        <div style={{
                                            background: 'rgba(230, 57, 70, 0.04)',
                                            border: '1px solid rgba(230, 57, 70, 0.12)',
                                            borderRadius: '16px',
                                            padding: '12px 14px',
                                            marginBottom: '18px'
                                        }}>
                                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#E63946', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                                                Message Payload
                                            </span>
                                            <p style={{ fontSize: '0.88rem', color: '#18181B', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                "{newMessage || 'No message typed...'}"
                                            </p>
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
                                                    fontSize: '0.75rem', fontWeight: 700, padding: '6px 14px', borderRadius: '99px',
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
                                                    fontSize: '0.75rem', fontWeight: 700, padding: '6px 14px', borderRadius: '99px',
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
                                                    fontSize: '0.75rem', fontWeight: 700, padding: '6px 14px', borderRadius: '99px',
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
                                                height: '48px',
                                                padding: '10px 16px',
                                                borderRadius: 16,
                                                border: '1.5px solid #E4E4E7',
                                                background: '#FAFAFA',
                                                color: '#18181B',
                                                fontSize: '0.92rem',
                                                fontWeight: 700,
                                                marginBottom: 24,
                                                fontFamily: "'Outfit', 'Inter', sans-serif",
                                                outline: 'none',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                                                transition: 'all 0.2s ease'
                                            }}
                                        />

                                        {/* Action Buttons */}
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.02, y: -1 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={sendScheduledMessage}
                                                style={{
                                                    flex: 1,
                                                    background: 'linear-gradient(135deg, #E63946 0%, #D62839 100%)',
                                                    color: '#FFFFFF',
                                                    border: 'none',
                                                    borderRadius: 99,
                                                    padding: '13px 18px',
                                                    fontWeight: 800,
                                                    fontSize: 14,
                                                    cursor: 'pointer',
                                                    boxShadow: '0 8px 22px rgba(230, 57, 70, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                                                    touchAction: 'manipulation',
                                                    WebkitTapHighlightColor: 'transparent'
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
                                                    padding: '13px 20px',
                                                    background: '#F4F4F5',
                                                    border: '1px solid #E4E4E7',
                                                    borderRadius: 99,
                                                    fontSize: 14,
                                                    cursor: 'pointer',
                                                    fontWeight: 700,
                                                    color: '#71717A',
                                                    touchAction: 'manipulation',
                                                    WebkitTapHighlightColor: 'transparent'
                                                }}
                                            >
                                                Cancel
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </FormControl>
                    </Box>
                </>
            ) : (
                // to get socket.io on same page
                <Box 
                    d="flex" 
                    alignItems="center" 
                    justifyContent="center" 
                    flexDir="column" 
                    h="100%"
                    w="100%"
                    p={6}
                    textAlign="center"
                    className="page-animate card-3d-wrapper"
                >
                    <motion.div 
                        whileHover={{ rotateX: 4, rotateY: -4, translateY: -6 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        style={{ width: "100%", maxWidth: "520px" }}
                    >
                        <Box 
                            d="flex"
                            flexDir="column"
                            alignItems="center"
                            justifyContent="center"
                            p={{ base: 6, sm: 8 }} 
                            position="relative"
                        >
                            {/* Floating Concentric Glowing Rings & Badge */}
                            <div style={{ position: "relative", marginBottom: "1.75rem" }}>
                                <motion.div
                                    animate={{ scale: [1, 1.25, 1], opacity: [0.35, 0.6, 0.35] }}
                                    transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                                    style={{
                                        position: "absolute",
                                        inset: "-20px",
                                        borderRadius: "50%",
                                        background: "radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, rgba(245, 158, 11, 0.05) 70%, transparent 100%)",
                                        filter: "blur(18px)"
                                    }}
                                />
                                <motion.div
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                >
                                    <Box sx={{
                                        width: '84px',
                                        height: '84px',
                                        borderRadius: '28px',
                                        background: 'linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 15px 35px rgba(212, 175, 55, 0.4)',
                                        border: '3px solid #FFFFFF',
                                        position: 'relative',
                                        zIndex: 2
                                    }}>
                                        <Feather size={40} color="#FFFFFF" strokeWidth={2.2} />
                                    </Box>
                                </motion.div>
                            </div>

                            <h2 style={{
                                fontSize: "2rem",
                                fontWeight: 900,
                                color: "#0F172A",
                                marginBottom: "0.5rem",
                                letterSpacing: "-0.03em",
                                fontFamily: "'Outfit', sans-serif"
                            }}>
                                No Chat Selected
                            </h2>

                            <p style={{
                                color: "#94A3B8",
                                fontSize: "0.95rem",
                                lineHeight: 1.6,
                                marginBottom: "2rem",
                                fontFamily: "'Inter', sans-serif",
                                maxWidth: "340px"
                            }}>
                                Choose a chat from your list or search a friend by username to start messaging.
                            </p>

                            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    onClick={onOpenDrawer}
                                    size="lg"
                                    leftIcon={<SearchIcon style={{ color: "#FFFFFF" }} />}
                                    style={{
                                        background: "linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)",
                                        color: "#FFFFFF",
                                        borderRadius: '99px',
                                        padding: '0 32px',
                                        height: '48px',
                                        fontSize: '0.92rem',
                                        fontWeight: 800,
                                        fontFamily: "'Outfit', sans-serif",
                                        border: "none",
                                        boxShadow: "0 10px 25px rgba(212, 175, 55, 0.35)",
                                        cursor: "pointer"
                                    }}
                                >
                                    Search & Start Chat
                                </Button>
                            </motion.div>
                        </Box>
                    </motion.div>
                </Box>
            )}

            {/* Incoming Call Popup Modal logic removed — ChatPage handles this globally now */}
        </>
    )
}

export default SingleChat
