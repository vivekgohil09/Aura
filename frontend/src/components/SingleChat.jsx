import React, { useEffect, useState } from 'react'
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
import { setSelectedChat } from '../redux/actions/index';
import ScrollableChat from './ScrollableChat';
import io from "socket.io-client"
import Lottie from "react-lottie";
import animationData from "../animations/typing.json";
import { compressData } from '../config/dataCompressor';
import { stompService } from '../config/stompService';
const url = window.location.origin;
const ENDPOINT = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? window.location.protocol + "//" + window.location.hostname + ":9092"
  : "https://aura-vdcq.onrender.com";
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
import { Phone, Video, Info, MoreVertical, Eye, Clock, Smile } from 'lucide-react';

const SingleChat = ({ fetchAgain, setFetchAgain, onOpenDrawer }) => {
    const history = useHistory();
    const dispatch = useDispatch()
    const selectedChat = useSelector(state => state.selectedChats)
    const notification = useSelector(state => state.notification);
    const user = useSelector(state => state.users)
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
    // View-once & Schedule
    const [viewOnceMode, setViewOnceMode] = useState(false);
    const [scheduleModal, setScheduleModal] = useState(false);
    const [scheduledAt, setScheduledAt] = useState('');
    const [pendingScheduled, setPendingScheduled] = useState([]);
    const [userStatuses, setUserStatuses] = useState({});

    const formatLastSeenDate = (lastSeenRaw) => {
        if (!lastSeenRaw) return "recently";
        try {
            const date = new Date(lastSeenRaw);
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

    useEffect(() => {
        let interval = null;
        if (isVideoCallActive && isCallAccepted) {
            interval = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            setCallDuration(0);
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

    const startVideoCall = async (type = "video", accepted = false) => {
        // Prevent calling yourself
        if (selectedChat && !selectedChat.isGroupChat && selectedChat.users) {
            const otherUser = selectedChat.users.find((u) => (u._id || u.id) !== (user._id || user.id));
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
        try {
            const constraints = type === "video" ? {
                video: {
                    width: { ideal: 3840, max: 3840, min: 1280 },
                    height: { ideal: 2160, max: 2160, min: 720 },
                    frameRate: { ideal: 60, max: 60, min: 30 },
                    facingMode: "user"
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000
                }
            } : {
                video: false,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000
                }
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            if (noiseFilterEnabled) {
                applyNoiseFilter(stream);
            }

            // Emit call signal over WebSocket
            const chatId = selectedChat.id || selectedChat._id;
            if (socket && !accepted) {
                socket.emit("call-user", {
                    chatId,
                    fromUser: user?.name || "User",
                    callType: type
                });
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
        if (localVideoRef.current && localVideoRef.current.srcObject) {
            localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        const chatId = selectedChat.id || selectedChat._id;
        if (socket) {
            socket.emit("end-call", { chatId });
        }
        setIsVideoCallActive(false);
        setIsCallAccepted(false);
    };

    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: animationData,
        rendererSettings: {
            preserveAspectRatio: "xMidYMid slice",
        },
    };

    useEffect(() => {
        // Chat UI initialization
    }, [])

    const handleAlert = () => {
        toast.info('This feature is available soon!', {
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
    const typingHandler = (e) => {
        setNewMessage(e.target.value);

        if (!socketConnected) return;

        if (!typing) {
            setTyping(true);
            socket.emit("typing", selectedChat._id);
        }
        let lastTypingTime = new Date().getTime();
        var timerLength = 3000;
        setTimeout(() => {
            var timeNow = new Date().getTime();
            var timeDiff = timeNow - lastTypingTime;
            if (timeDiff >= timerLength && typing) {
                socket.emit("stop typing", selectedChat._id);
                setTyping(false);
            }
        }, timerLength);
    }

    const sendMessage = async (e) => {
        if (e.key === "Enter" && newMessage) {
            const chatId = selectedChat.id || selectedChat._id;
            if (socket) { socket.emit("stop typing", chatId); }
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
            }
        }
    }

    const sendScheduledMessage = async () => {
        if (!newMessage.trim() || !scheduledAt) {
            toast.warning('Enter a message and pick a time!', { autoClose: 2000, hideProgressBar: true });
            return;
        }
        const delay = new Date(scheduledAt).getTime() - Date.now();
        if (delay <= 0) { toast.error('Pick a future time!', { autoClose: 2000, hideProgressBar: true }); return; }
        const msgText = newMessage;
        const scheduled = { id: Date.now(), content: msgText, scheduledAt, chatId: selectedChat.id || selectedChat._id };
        setPendingScheduled(prev => [...prev, scheduled]);
        setScheduleModal(false);
        setNewMessage('');
        toast.success(`⏰ Message scheduled for ${new Date(scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, { autoClose: 3000, hideProgressBar: true });
        // Send after delay
        setTimeout(async () => {
            try {
                const config = { headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getJwtToken() } };
                const { data } = await axios.post('/api/message', { content: msgText, chatId: selectedChat.id || selectedChat._id }, config);
                if (socket) { socket.emit('new message', data); }
                setMessages(prev => [...prev, data]);
                setPendingScheduled(prev => prev.filter(s => s.id !== scheduled.id));
            } catch { /* silent */ }
        }, delay);
    };

    const fetchMessages = async (e) => {
        if (!selectedChat) return;

        setMessageloading(true)

        try {
            const config = {
                headers: {
                    Authorization: "Bearer " + getJwtToken(),
                },
            };
            const chatId = selectedChat.id || selectedChat._id;
            const { data } = await axios.get(`/api/message/${chatId}`, config);


            setMessages(data);
            setMessageloading(false);
            if (socket) {
                socket.emit("join chat", chatId);
            }


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
                socket.off("user status change").on("user status change", (data) => {
                    if (data && data.userId) {
                        setUserStatuses(prev => ({
                            ...prev,
                            [data.userId]: {
                                isOnline: Boolean(data.isOnline),
                                lastSeen: data.lastSeen
                            }
                        }));
                    }
                });
                socket.off("end-call").on("end-call", () => {
                    if (localVideoRef.current && localVideoRef.current.srcObject) {
                        localVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
                    }
                    setIsVideoCallActive(false);
                    setIsCallAccepted(false);
                    setIncomingCall(null);
                });
                socket.off("accept-call").on("accept-call", () => setIsCallAccepted(true));
            } else if (!socket) {
                try {
                    socket = io(ENDPOINT, { transports: ["websocket", "polling"] });
                    socket.emit("setup", userInfo);
                    socket.on("connected", () => setSocketConnected(true));
                    socket.on("user status change", (data) => {
                        if (data && data.userId) {
                            setUserStatuses(prev => ({
                                ...prev,
                                [data.userId]: {
                                    isOnline: Boolean(data.isOnline),
                                    lastSeen: data.lastSeen
                                }
                            }));
                        }
                    });
                    window.__auraSocket = socket;
                } catch (e) {}
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
            }

            const unsubscribe = stompService.subscribeToConversation(chatId, (newMessageReceived) => {
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
            });

            return () => {
                if (unsubscribe) unsubscribe();
            };
        }
    }, [selectedChat]);




    return (
        <>
            {selectedChat ? (
                <>
                    <Box
                        pb={3}
                        pt={1}
                        px={3}
                        w="100%"
                        d="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", marginBottom: "10px" }}
                    >
                        {!selectedChat.isGroupChat ? (() => {
                            const targetUser = getSenderUser(user, selectedChat.users);
                            const targetUserId = targetUser?._id || targetUser?.id;
                            const statusObj = targetUserId && userStatuses[targetUserId] ? userStatuses[targetUserId] : null;
                            const isTargetOnline = statusObj != null 
                                ? statusObj.isOnline 
                                : Boolean(targetUser?.isOnline || targetUser?.online);
                            const targetLastSeen = statusObj != null && statusObj.lastSeen != null
                                ? statusObj.lastSeen
                                : targetUser?.lastSeen;

                            return (
                                <>
                                    <div className='d-flex align-items-center' style={{ gap: '12px' }}>
                                        <Box display={{ base: "inline-block", md: "none" }}>
                                            <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                                                <IconButton
                                                    size="sm"
                                                    icon={<ArrowBackIcon color="#E63946" fontSize="20px" />}
                                                    onClick={() => dispatch(delSelectedChat())}
                                                    aria-label="Back to conversations"
                                                    style={{
                                                        background: "#FFF0F2",
                                                        borderRadius: "12px",
                                                        border: "1px solid #FFE3E6",
                                                        width: "38px",
                                                        height: "38px",
                                                        boxShadow: "0 2px 8px rgba(230, 57, 70, 0.1)"
                                                    }}
                                                />
                                            </motion.div>
                                        </Box>
                                        <div style={{ position: "relative" }}>
                                            <Avatar 
                                                size="md" 
                                                cursor="pointer" 
                                                src={getPicture(user, selectedChat.users)} 
                                                name={getSender(user, selectedChat.users)} 
                                                bg="#FFE3E6"
                                                color="#E63946"
                                                fontWeight="700"
                                                style={{ border: "2px solid #FFE3E6" }}
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
                                        <div className="d-flex flex-column justify-content-center">
                                            <p className="fw-bold fs-5 m-0" style={{ color: "#18181B", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.015em", lineHeight: 1.2, whiteSpace: "nowrap" }}>
                                                {getSender(user, selectedChat.users)}
                                            </p>
                                            {isTargetOnline ? (
                                                <span style={{ fontSize: "0.75rem", color: "#10B981", display: "flex", alignItems: "center", gap: "5px", fontWeight: 600, marginTop: "2px" }}>
                                                    <span style={{ width: "6px", height: "6px", backgroundColor: "#10B981", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 6px rgba(16, 185, 129, 0.6)" }}></span>
                                                    Online
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: "0.75rem", color: "#71717A", display: "flex", alignItems: "center", gap: "5px", fontWeight: 500, marginTop: "2px" }}>
                                                    <span style={{ width: "6px", height: "6px", backgroundColor: "#9CA3AF", borderRadius: "50%", display: "inline-block" }}></span>
                                                    Last seen {formatLastSeenDate(targetLastSeen)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className='d-flex align-items-center gap-2'>
                                        <Tooltip label="Voice Call" hasArrow placement="bottom-end">
                                            <motion.div whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.92 }}>
                                                <IconButton
                                                    size="sm"
                                                    onClick={() => startVideoCall("voice")}
                                                    icon={<Phone size={18} color="#E63946" />}
                                                    aria-label="Voice Call"
                                                    style={{
                                                        background: "#FFFFFF",
                                                        borderRadius: "12px",
                                                        border: "1px solid #F1F1F4",
                                                        width: "38px",
                                                        height: "38px",
                                                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
                                                    }}
                                                />
                                            </motion.div>
                                        </Tooltip>
                                        <Tooltip label="Video Call" hasArrow placement="bottom-end">
                                            <motion.div whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.92 }}>
                                                <IconButton
                                                    size="sm"
                                                    onClick={() => startVideoCall("video")}
                                                    icon={<Video size={18} color="#FFFFFF" />}
                                                    aria-label="Video Call"
                                                    style={{
                                                        background: "linear-gradient(135deg, #E63946 0%, #d62839 100%)",
                                                        borderRadius: "12px",
                                                        border: "none",
                                                        width: "38px",
                                                        height: "38px",
                                                        boxShadow: "0 4px 14px rgba(230, 57, 70, 0.3)"
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
                        justifyContent="flex-end"
                        p={3.5}
                        bg="linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)"
                        style={{
                            border: "1px solid #E2E8F0",
                            boxShadow: "inset 0 2px 12px rgba(15, 23, 42, 0.03)",
                            borderRadius: "24px"
                        }}
                        w="100%"
                        h="100%"
                        overflowY="hidden"
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
                            <div>
                            <ScrollableChat messages={messages} setMessages={setMessages} />
                            </div>
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
                                    background: "radial-gradient(circle at 50% 30%, #FFFFFF 0%, #FFF3F5 60%, #FFE9ED 100%)",
                                    zIndex: 9999,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "48px 24px 40px 24px",
                                    backdropFilter: "blur(40px)"
                                }}
                            >
                                {/* Header Section */}
                                <Box display="flex" flexDirection="column" alignItems="center">
                                    <Box
                                        display="inline-flex"
                                        alignItems="center"
                                        gap="8px"
                                        bg="rgba(255, 42, 84, 0.08)"
                                        px={4}
                                        py={1.5}
                                        borderRadius="99px"
                                        border="1px solid rgba(255, 42, 84, 0.15)"
                                        mb={3}
                                    >
                                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FF2A54", boxShadow: "0 0 12px #FF2A54" }}></span>
                                        <Text fontSize="0.75rem" fontWeight="800" color="#FF2A54" letterSpacing="0.08em">
                                            {callType === "video" ? "4K HD VIDEO ENCRYPTED" : "HD VOICE ENCRYPTED"}
                                        </Text>
                                    </Box>
                                    <Text fontSize="1.8rem" fontWeight="800" color="#1E1B18" fontFamily="'Outfit', sans-serif" letterSpacing="-0.02em" mt={1}>
                                        {getSender(user, selectedChat.users)}
                                    </Text>
                                    <Text fontSize="0.9rem" fontWeight="600" color="#FF2A54" mt={1}>
                                        {isCallAccepted ? formatCallDuration(callDuration) : "🔔 Calling..."}
                                    </Text>
                                </Box>

                                {/* Center Hero Content */}
                                {callType === "video" ? (
                                    <Box position="relative" width="100%" maxW="720px" height="420px" display="flex" justifyContent="center" alignItems="center">
                                        <video 
                                            ref={localVideoRef} 
                                            autoPlay 
                                            playsInline 
                                            muted 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '32px', border: '4px solid #FFFFFF', boxShadow: "0 25px 60px rgba(255, 42, 84, 0.18)" }} 
                                        />
                                        <Box position="absolute" bottom="20px" right="20px" bg="rgba(255, 255, 255, 0.95)" backdropFilter="blur(16px)" px={4} py={1.5} borderRadius="16px" color="#1E1B18" border="1px solid #FFE3E6" boxShadow="0 8px 24px rgba(0,0,0,0.08)">
                                            <Text fontSize="xs" fontWeight="800">You (Self View)</Text>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Box display="flex" flexDirection="column" alignItems="center" my="auto" position="relative">
                                        <motion.div
                                            animate={{ scale: [1, 1.45, 1], opacity: [0.35, 0.05, 0.35] }}
                                            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                                            style={{
                                                position: "absolute",
                                                top: "calc(50% - 85px)",
                                                width: "170px",
                                                height: "170px",
                                                borderRadius: "50%",
                                                background: "rgba(255, 42, 84, 0.18)"
                                            }}
                                        />
                                        <motion.div
                                            animate={{ scale: [1, 1.75, 1], opacity: [0.2, 0, 0.2] }}
                                            transition={{ duration: 2.4, repeat: Infinity, delay: 0.6, ease: "easeInOut" }}
                                            style={{
                                                position: "absolute",
                                                top: "calc(50% - 85px)",
                                                width: "170px",
                                                height: "170px",
                                                borderRadius: "50%",
                                                background: "rgba(255, 42, 84, 0.1)"
                                            }}
                                        />

                                        <Avatar
                                            size="2xl"
                                            name={getSender(user, selectedChat.users)}
                                            src={getPicture(user, selectedChat.users)}
                                            bg="#FFE3E6"
                                            color="#FF2A54"
                                            fontWeight="800"
                                            fontSize="2.8rem"
                                            style={{
                                                width: "130px",
                                                height: "130px",
                                                border: "5px solid #FFFFFF",
                                                boxShadow: "0 15px 45px rgba(255, 42, 84, 0.28)",
                                                position: "relative",
                                                zIndex: 2
                                            }}
                                        />

                                        <Box display="flex" alignItems="center" gap="5px" mt={7} mb={2}>
                                            {[0, 1, 2, 3, 4].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    animate={{ height: ["10px", "26px", "12px", "32px", "10px"] }}
                                                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                                                    style={{
                                                        width: "4px",
                                                        background: "#FF2A54",
                                                        borderRadius: "4px"
                                                    }}
                                                />
                                            ))}
                                        </Box>

                                        <Text color="#71717A" fontSize="0.85rem" fontWeight="600" mt={1}>
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
                                            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.14)",
                                            borderColor: "rgba(255, 42, 84, 0.4)"
                                        }}
                                        style={{
                                            width: "95%",
                                            maxWidth: "480px",
                                            margin: "0 auto 12px auto",
                                            background: "rgba(255, 255, 255, 0.45)",
                                            backdropFilter: "blur(24px)",
                                            WebkitBackdropFilter: "blur(24px)",
                                            padding: "14px 18px",
                                            borderRadius: "24px",
                                            textAlign: "left",
                                            border: "1.5px solid rgba(255, 255, 255, 0.75)",
                                            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.08)",
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
                                                    style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FF2A54", display: "inline-block" }}
                                                />
                                                <Text color="#FF2A54" fontSize="0.72rem" fontWeight="800" letterSpacing="0.08em" textTransform="uppercase" m={0}>
                                                    LIVE AI CAPTIONS & TRANSLATION
                                                </Text>
                                            </Box>
                                            <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#475569", background: "rgba(0, 0, 0, 0.06)", padding: "2px 8px", borderRadius: "99px" }}>
                                                HD REAL-TIME
                                            </span>
                                        </Box>

                                        {captionsLog.length === 0 && !currentTranscript && (
                                            <Text color="#475569" fontSize="0.84rem" fontWeight="600" italic m={0}>
                                                🎙️ Speaking to generate live captions...
                                                <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.75 }} style={{ color: "#FF2A54", marginLeft: "4px", fontWeight: "bold" }}>|</motion.span>
                                            </Text>
                                        )}
                                        {captionsLog.map((c, index) => (
                                            <motion.div key={c.id || index} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} style={{ marginBottom: "8px" }}>
                                                <Text color="#0F172A" fontSize="0.92rem" fontWeight="700" m={0} style={{ lineHeight: 1.4 }}>
                                                    <span style={{ color: "#FF2A54", fontWeight: 800 }}>{c.speaker}:</span> {c.original}
                                                </Text>
                                                {c.translated && (
                                                    <Text color="#059669" fontSize="0.86rem" fontWeight="800" m={0} style={{ marginTop: "2px" }}>
                                                        🌐 {c.translated}
                                                    </Text>
                                                )}
                                            </motion.div>
                                        ))}
                                        {currentTranscript && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                <Text color="#0284C7" fontSize="0.9rem" fontWeight="700" italic m={0}>
                                                    {currentTranscript}
                                                    <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} style={{ color: "#FF2A54", marginLeft: "3px", fontWeight: 900 }}>|</motion.span>
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
                                            background: "rgba(255, 255, 255, 0.88)",
                                            backdropFilter: "blur(28px)",
                                            WebkitBackdropFilter: "blur(28px)",
                                            borderRadius: "24px",
                                            padding: "12px 16px",
                                            border: "1.5px solid rgba(255, 255, 255, 0.95)",
                                            boxShadow: "0 20px 45px rgba(0, 0, 0, 0.12)",
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
                                                    background: liveCaptionsEnabled ? "rgba(16, 185, 129, 0.15)" : "rgba(0, 0, 0, 0.05)",
                                                    border: liveCaptionsEnabled ? "1.5px solid #10B981" : "1px solid #E2E8F0",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px"
                                                }}
                                            >
                                                <span>💬</span>
                                                <Text fontSize="0.78rem" fontWeight="800" color={liveCaptionsEnabled ? "#059669" : "#475569"} m={0}>
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
                                                    background: translateEnabled ? "rgba(99, 102, 241, 0.15)" : "rgba(0, 0, 0, 0.05)",
                                                    border: translateEnabled ? "1.5px solid #6366F1" : "1px solid #E2E8F0",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px"
                                                }}
                                            >
                                                <span>🌐</span>
                                                <Text fontSize="0.78rem" fontWeight="800" color={translateEnabled ? "#4F46E5" : "#475569"} m={0}>
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
                                                    background: noiseFilterEnabled ? "rgba(245, 158, 11, 0.15)" : "rgba(0, 0, 0, 0.05)",
                                                    border: noiseFilterEnabled ? "1.5px solid #F59E0B" : "1px solid #E2E8F0",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px"
                                                }}
                                            >
                                                <span>🎙️</span>
                                                <Text fontSize="0.78rem" fontWeight="800" color={noiseFilterEnabled ? "#D97706" : "#475569"} m={0}>
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
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            style={{ display: "none" }}
                            accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                        />

                        {/* Premium Floating Input Bar */}
                        <FormControl
                            onKeyDown={sendMessage}
                            id="first-name"
                            isRequired
                            mt={3}
                            position="relative"
                        >
                            {istyping && (
                                <div>
                                    <Lottie
                                        options={defaultOptions}
                                        width={70}
                                        style={{ marginBottom: 15, marginLeft: 0 }}
                                    />
                                </div>
                            )}

                            {showPicker && (
                                <Box position="absolute" bottom="75px" left="10px" zIndex="1000">
                                    <Picker onEmojiClick={onEmojiClick} />
                                </Box>
                            )}

                            <div 
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
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
                                                justifyContent: 'space-between',
                                                padding: '10px 14px'
                                            }}
                                            _hover={{ bg: 'rgba(230, 57, 70, 0.06)' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <Eye size={18} color={viewOnceMode ? '#E63946' : '#71717A'} />
                                                <span>Send as View-Once</span>
                                            </div>
                                            {viewOnceMode && (
                                                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#E63946', background: 'rgba(230, 57, 70, 0.1)', padding: '2px 6px', borderRadius: '6px' }}>
                                                    ON
                                                </span>
                                            )}
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

                                {/* Input text field */}
                                <Input
                                    variant="unstyled"
                                    placeholder={viewOnceMode ? "👁 View-once message..." : "Type a message..."}
                                    value={newMessage}
                                    onChange={typingHandler}
                                    onKeyDown={sendMessage}
                                    px={2}
                                    h="40px"
                                    style={{
                                        border: 'none',
                                        outline: 'none',
                                        fontSize: '0.92rem',
                                        fontFamily: "'Outfit', 'Inter', sans-serif",
                                        fontWeight: 500,
                                        color: '#0F172A',
                                    }}
                                />

                                {/* Glowing Send Button */}
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.08, y: -2 }}
                                    whileTap={{ scale: 0.88 }}
                                    onClick={() => sendMessage({ key: "Enter" })}
                                    aria-label="Send Message"
                                    style={{
                                        background: "linear-gradient(135deg, #FF2A54 0%, #E60044 100%)",
                                        borderRadius: "16px",
                                        width: "40px",
                                        height: "40px",
                                        minWidth: "40px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        boxShadow: "0 6px 20px rgba(255, 42, 84, 0.38)",
                                        border: "none",
                                        cursor: "pointer",
                                        touchAction: 'manipulation',
                                        WebkitTapHighlightColor: 'transparent'
                                    }}
                                >
                                    <SendIcon style={{ fontSize: "18px", color: "#FFFFFF", marginLeft: "2px" }} />
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
                            p={{ base: 6, sm: 8 }} 
                            borderRadius="32px" 
                            bg="#FFFFFF" 
                            border="1.5px solid #FFDAC8"
                            className="vfx-pulse-glow"
                            style={{ boxShadow: "0 25px 60px rgba(255, 107, 107, 0.12)", position: "relative" }}
                        >
                            <Box sx={{
                                width: '84px',
                                height: '84px',
                                borderRadius: '28px',
                                background: '#111827',
                                border: '1px solid #E5E7EB',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem auto',
                                boxShadow: '0 12px 30px rgba(17, 24, 39, 0.25)'
                            }}>
                                <span style={{ fontSize: '2.6rem', color: '#FFFFFF' }}>🪶</span>
                            </Box>

                            <h2 style={{
                                fontSize: "2.5rem",
                                fontWeight: 800,
                                color: "#111827",
                                marginBottom: "0.5rem",
                                letterSpacing: "-0.03em"
                            }}>
                                Welcome to <span className="gradient-text">AURA</span>
                            </h2>

                            <p style={{
                                color: "#5C5248",
                                fontSize: "0.98rem",
                                lineHeight: 1.6,
                                marginBottom: "1.75rem"
                            }}>
                                Experience next-generation messaging, crystal-clear 4K WebRTC video calling, and instant P2P security.
                            </p>

                            {/* Ultra Attractive Feature Badges */}
                            <Box d="flex" justifyContent="center" gap={2} mb={4} flexWrap="wrap">
                                <span style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    color: "#FF6B6B",
                                    background: "#FFEADF",
                                    border: "1px solid #FFDAC8",
                                    padding: "6px 14px",
                                    borderRadius: "99px"
                                }}>📹 4K HD Video Calls</span>
                                <span style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    color: "#FF8E53",
                                    background: "#FFF4EE",
                                    border: "1px solid #FFDAC8",
                                    padding: "6px 14px",
                                    borderRadius: "99px"
                                }}>🔒 End-to-End P2P</span>
                                <span style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    color: "#1E1B18",
                                    background: "#FFEADF",
                                    border: "1px solid #FFDAC8",
                                    padding: "6px 14px",
                                    borderRadius: "99px"
                                }}>⚡ 0ms Socket Sync</span>
                            </Box>

                            <Button
                                onClick={onOpenDrawer}
                                size="lg"
                                className="btn-primary-aura"
                                leftIcon={<SearchIcon />}
                                style={{
                                    borderRadius: '16px',
                                    padding: '0 28px',
                                    height: '48px',
                                    fontSize: '0.95rem'
                                }}
                            >
                                Start Messaging
                            </Button>
                        </Box>
                    </motion.div>
                </Box>
            )}

            {/* Incoming Call Popup Modal with Framer Motion Ringing Special Effects */}
            {incomingCall && (
                <Portal>
                    <Modal isOpen={true} onClose={() => setIncomingCall(null)} isCentered>
                        <ModalOverlay backdropFilter="blur(20px)" bg="rgba(24, 24, 27, 0.75)" />
                        <ModalContent borderRadius="32px" bg="linear-gradient(145deg, #18181B 0%, #09090B 100%)" border="1.5px solid rgba(230, 57, 70, 0.3)" p={6} style={{ boxShadow: "0 30px 70px rgba(230, 57, 70, 0.3)", maxWidth: "400px" }}>
                            <ModalBody display="flex" flexDirection="column" alignItems="center" py={6} position="relative">
                                {/* Pulsing Ringing Waves */}
                                <motion.div
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0.05, 0.6] }}
                                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                                    style={{
                                        position: "absolute",
                                        top: "40px",
                                        width: "110px",
                                        height: "110px",
                                        borderRadius: "50%",
                                        background: "rgba(230, 57, 70, 0.35)"
                                    }}
                                />
                                <motion.div
                                    animate={{ scale: [1, 1.85, 1], opacity: [0.35, 0, 0.35] }}
                                    transition={{ duration: 1.8, repeat: Infinity, delay: 0.4, ease: "easeInOut" }}
                                    style={{
                                        position: "absolute",
                                        top: "40px",
                                        width: "110px",
                                        height: "110px",
                                        borderRadius: "50%",
                                        background: "rgba(230, 57, 70, 0.2)"
                                    }}
                                />

                                <motion.div animate={{ rotate: [0, -8, 8, -8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                                    <Avatar size="2xl" name={incomingCall.fromUser} bg="#FFE3E6" color="#E63946" fontWeight="800" fontSize="2.2rem" style={{ border: "4px solid #E63946", boxShadow: "0 0 35px rgba(230, 57, 70, 0.6)", position: "relative", zIndex: 2 }} />
                                </motion.div>

                                <Text color="#FFFFFF" fontSize="1.45rem" fontWeight="800" mt={5} fontFamily="'Outfit', sans-serif">
                                    {incomingCall.fromUser}
                                </Text>
                                <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.2, repeat: Infinity }}>
                                    <Text color="#F87171" fontSize="0.92rem" fontWeight="700" mt={1}>
                                        {incomingCall.callType === "video" ? "📹 Incoming HD Video Call..." : "🎙️ Incoming HD Voice Call..."}
                                    </Text>
                                </motion.div>

                                <Box display="flex" gap={4} mt={7} width="100%">
                                    <motion.div style={{ flex: 1 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button
                                            onClick={() => {
                                                if (socket) socket.emit("end-call", { chatId: incomingCall.chatId });
                                                setIncomingCall(null);
                                            }}
                                            width="100%"
                                            height="48px"
                                            borderRadius="16px"
                                            bg="#EF4444"
                                            color="#FFF"
                                            leftIcon={<CallEndIcon />}
                                            fontWeight="800"
                                            boxShadow="0 6px 20px rgba(239, 68, 68, 0.4)"
                                        >
                                            Decline
                                        </Button>
                                    </motion.div>
                                    <motion.div style={{ flex: 1 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                        <Button
                                            onClick={async () => {
                                                const type = incomingCall.callType || "video";
                                                setIncomingCall(null);
                                                if (socket) socket.emit("accept-call", { chatId: incomingCall.chatId });
                                                await startVideoCall(type, true);
                                            }}
                                            width="100%"
                                            height="48px"
                                            borderRadius="16px"
                                            bg="linear-gradient(135deg, #10B981 0%, #059669 100%)"
                                            color="#FFF"
                                            leftIcon={<CallIcon />}
                                            fontWeight="800"
                                            boxShadow="0 6px 20px rgba(16, 185, 129, 0.45)"
                                        >
                                            Accept Call
                                        </Button>
                                    </motion.div>
                                </Box>
                            </ModalBody>
                        </ModalContent>
                    </Modal>
                </Portal>
            )}
        </>
    )
}

export default SingleChat