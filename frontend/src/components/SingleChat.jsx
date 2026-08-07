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
    Portal
} from '@chakra-ui/react'
import { delSelectedChat , setNotification } from "../redux/actions/index"
import { getSender, getPicture } from '../config/ChatsLogic';
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
const ENDPOINT = window.location.protocol + "//" + window.location.hostname + ":9092";
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
import { Phone, Video, Info } from 'lucide-react';

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
        setCallType(type);
        setIsVideoCallActive(true);
        setIsMuted(false);
        setIsCameraOff(false);
        setIsCallAccepted(accepted);
        try {
            const constraints = type === "video" ? { video: true, audio: true } : { video: false, audio: true };
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

    // ── STOMP Connection & Call Signaling Mount ──────────────
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
                        {!selectedChat.isGroupChat ? (
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
                                                backgroundColor: "#10B981",
                                                borderRadius: "50%",
                                                border: "2px solid #FFFFFF",
                                            }}
                                        />
                                    </div>
                                    <div className="d-flex flex-column justify-content-center">
                                        <p className="fw-bold fs-5 m-0" style={{ color: "#18181B", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.015em", lineHeight: 1.2, whiteSpace: "nowrap" }}>
                                            {getSender(user, selectedChat.users)}
                                        </p>
                                        <span style={{ fontSize: "0.75rem", color: "#10B981", display: "flex", alignItems: "center", gap: "5px", fontWeight: 600, marginTop: "2px" }}>
                                            <span style={{ width: "6px", height: "6px", backgroundColor: "#10B981", borderRadius: "50%", display: "inline-block" }}></span>
                                            Online
                                        </span>
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
                        ) : (
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

                                {/* Floating Control Bar */}
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    gap={6}
                                    bg="rgba(255, 255, 255, 0.92)"
                                    backdropFilter="blur(24px)"
                                    px={7}
                                    py={3.5}
                                    borderRadius="99px"
                                    border="1px solid rgba(255, 42, 84, 0.15)"
                                    boxShadow="0 20px 50px rgba(255, 42, 84, 0.18)"
                                >
                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                        <IconButton
                                            aria-label="Toggle Audio"
                                            icon={isMuted ? <MicOffIcon style={{ color: "#FF2A54", fontSize: 24 }} /> : <MicIcon style={{ color: "#1E1B18", fontSize: 24 }} />}
                                            isRound
                                            size="lg"
                                            style={{
                                                background: isMuted ? "#FFE3E6" : "#F4F4F5",
                                                border: isMuted ? "1px solid #FFCDD2" : "1px solid #E4E4E7",
                                                width: "52px",
                                                height: "52px",
                                                boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                                            }}
                                            onClick={toggleMute}
                                        />
                                    </motion.div>

                                    <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}>
                                        <Button 
                                            onClick={endVideoCall} 
                                            leftIcon={callType === "video" ? <VideocamOffIcon style={{ fontSize: 22 }} /> : <CallEndIcon style={{ fontSize: 22 }} />}
                                            size="lg"
                                            style={{
                                                background: "linear-gradient(135deg, #FF2A54 0%, #D62839 100%)",
                                                color: "#FFFFFF",
                                                borderRadius: "99px",
                                                padding: "0 32px",
                                                height: "52px",
                                                fontWeight: 800,
                                                fontSize: "1rem",
                                                boxShadow: "0 8px 25px rgba(255, 42, 84, 0.45)",
                                                border: "none"
                                            }}
                                        >
                                            End Call
                                        </Button>
                                    </motion.div>

                                    {callType === "video" && (
                                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                            <IconButton
                                                aria-label="Toggle Camera"
                                                icon={isCameraOff ? <VideocamOffIcon style={{ color: "#FF2A54", fontSize: 24 }} /> : <VideocamIcon style={{ color: "#1E1B18", fontSize: 24 }} />}
                                                isRound
                                                size="lg"
                                                style={{
                                                    background: isCameraOff ? "#FFE3E6" : "#F4F4F5",
                                                    border: isCameraOff ? "1px solid #FFCDD2" : "1px solid #E4E4E7",
                                                    width: "52px",
                                                    height: "52px",
                                                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                                                }}
                                                onClick={toggleCamera}
                                            />
                                        </motion.div>
                                    )}

                                    {/* AI Live Captions Toggle Button */}
                                    <Tooltip label={liveCaptionsEnabled ? "Live Captions ACTIVE" : "Enable Live Captions"} hasArrow placement="top">
                                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                            <Button
                                                onClick={() => setLiveCaptionsEnabled(!liveCaptionsEnabled)}
                                                style={{
                                                    background: liveCaptionsEnabled ? "linear-gradient(135deg, #10B981 0%, #059669 100%)" : "#F4F4F5",
                                                    color: liveCaptionsEnabled ? "#FFF" : "#71717A",
                                                    border: "none",
                                                    borderRadius: "99px",
                                                    padding: "0 18px",
                                                    height: "52px",
                                                    fontWeight: 700,
                                                    fontSize: "0.85rem",
                                                    boxShadow: liveCaptionsEnabled ? "0 4px 14px rgba(16, 185, 129, 0.35)" : "none"
                                                }}
                                            >
                                                💬 Captions
                                            </Button>
                                        </motion.div>
                                    </Tooltip>

                                    {/* AI Real-time Voice Translation Button */}
                                    <Tooltip label={translateEnabled ? `Translating into ${targetLang.toUpperCase()}` : "Enable AI Voice Translation"} hasArrow placement="top">
                                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                            <Button
                                                onClick={() => setTranslateEnabled(!translateEnabled)}
                                                style={{
                                                    background: translateEnabled ? "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)" : "#F4F4F5",
                                                    color: translateEnabled ? "#FFF" : "#71717A",
                                                    border: "none",
                                                    borderRadius: "99px",
                                                    padding: "0 18px",
                                                    height: "52px",
                                                    fontWeight: 700,
                                                    fontSize: "0.85rem",
                                                    boxShadow: translateEnabled ? "0 4px 14px rgba(99, 102, 241, 0.35)" : "none"
                                                }}
                                            >
                                                🌐 {translateEnabled ? `Translate: ${targetLang.toUpperCase()}` : "Translate"}
                                            </Button>
                                        </motion.div>
                                    </Tooltip>

                                    {translateEnabled && (
                                        <select
                                            value={targetLang}
                                            onChange={(e) => setTargetLang(e.target.value)}
                                            style={{
                                                background: "#1E1B18",
                                                color: "#FFF",
                                                borderRadius: "12px",
                                                padding: "6px 10px",
                                                fontSize: "0.8rem",
                                                fontWeight: 700,
                                                border: "none",
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
                                    )}

                                    {/* Noise Removal & Audio Enhancer DSP Toggle */}
                                    <Tooltip label={noiseFilterEnabled ? "Noise Removal ACTIVE" : "Enable Noise Removal"} hasArrow placement="top">
                                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                            <Button
                                                onClick={() => setNoiseFilterEnabled(!noiseFilterEnabled)}
                                                style={{
                                                    background: noiseFilterEnabled ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" : "#F4F4F5",
                                                    color: noiseFilterEnabled ? "#FFF" : "#71717A",
                                                    border: "none",
                                                    borderRadius: "99px",
                                                    padding: "0 18px",
                                                    height: "52px",
                                                    fontWeight: 700,
                                                    fontSize: "0.85rem",
                                                    boxShadow: noiseFilterEnabled ? "0 4px 14px rgba(245, 158, 11, 0.35)" : "none"
                                                }}
                                            >
                                                🎙️ Noise Filter
                                            </Button>
                                        </motion.div>
                                    </Tooltip>
                                </Box>

                                {/* Real-time Live Subtitles / Captions & Translation Overlay Container */}
                                {liveCaptionsEnabled && (
                                    <Box
                                        position="absolute"
                                        bottom="110px"
                                        left="50%"
                                        transform="translateX(-50%)"
                                        bg="rgba(15, 23, 42, 0.85)"
                                        backdropFilter="blur(16px)"
                                        px={6}
                                        py={3}
                                        borderRadius="20px"
                                        maxWidth="85%"
                                        textAlign="center"
                                        border="1px solid rgba(255, 255, 255, 0.15)"
                                        boxShadow="0 10px 30px rgba(0,0,0,0.5)"
                                        zIndex={20}
                                    >
                                        {captionsLog.length === 0 && !currentTranscript && (
                                            <Text color="#94A3B8" fontSize="0.85rem" fontWeight="600" italic>
                                                🎙️ Speaking to generate Live Captions & Real-Time Translation...
                                            </Text>
                                        )}
                                        {captionsLog.map((c) => (
                                            <Box key={c.id} mb={1}>
                                                <Text color="#F8FAFC" fontSize="0.95rem" fontWeight="700">
                                                    <span style={{ color: "#38BDF8" }}>{c.speaker}:</span> {c.original}
                                                </Text>
                                                {c.translated && (
                                                    <Text color="#A7F3D0" fontSize="0.9rem" fontWeight="800">
                                                        🌐 {c.translated}
                                                    </Text>
                                                )}
                                            </Box>
                                        ))}
                                        {currentTranscript && (
                                            <Text color="#FDE047" fontSize="0.9rem" fontWeight="600" italic>
                                                {currentTranscript} ...
                                            </Text>
                                        )}
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
                                    gap: '10px',
                                    background: 'rgba(255, 255, 255, 0.95)',
                                    backdropFilter: 'blur(20px)',
                                    border: '1px solid rgba(226, 232, 240, 0.9)',
                                    borderRadius: '24px',
                                    padding: '8px 12px',
                                    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)'
                                }}
                            >
                                {/* Emoji Button */}
                                <Tooltip label="Emoji Picker" hasArrow placement="top">
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.12, translateY: -2 }}
                                        whileTap={{ scale: 0.92 }}
                                        onClick={toggleEmojiPicker}
                                        style={{
                                            background: '#FFFBEB',
                                            border: '1px solid #FDE68A',
                                            borderRadius: '16px',
                                            width: '42px',
                                            height: '42px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 8px rgba(217, 119, 6, 0.1)'
                                        }}
                                    >
                                        <EmojiEmotionsIcon style={{ fontSize: '22px', color: '#D97706' }} />
                                    </motion.button>
                                </Tooltip>

                                {/* File Attachment Button */}
                                <Tooltip label="Attach File / Photo" hasArrow placement="top">
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.12, translateY: -2 }}
                                        whileTap={{ scale: 0.92 }}
                                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                        style={{
                                            background: '#F0FDF4',
                                            border: '1px solid #BBF7D0',
                                            borderRadius: '16px',
                                            width: '42px',
                                            height: '42px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 8px rgba(22, 163, 74, 0.1)'
                                        }}
                                    >
                                        <AttachFileIcon style={{ fontSize: '20px', color: '#16A34A' }} />
                                    </motion.button>
                                </Tooltip>

                                {/* View-once toggle */}
                                <Tooltip label={viewOnceMode ? "View-Once ACTIVE (click to cancel)" : "Send as View-Once"} hasArrow placement="top">
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.12, translateY: -2 }}
                                        whileTap={{ scale: 0.92 }}
                                        onClick={() => setViewOnceMode(!viewOnceMode)}
                                        style={{
                                            background: viewOnceMode ? 'linear-gradient(135deg, #FF2A54 0%, #E60044 100%)' : '#FFF0F2',
                                            border: viewOnceMode ? 'none' : '1px solid #FFE3E6',
                                            borderRadius: '16px',
                                            width: '42px',
                                            height: '42px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            color: viewOnceMode ? '#FFFFFF' : '#FF2A54',
                                            fontSize: '18px',
                                            boxShadow: viewOnceMode ? '0 4px 14px rgba(255, 42, 84, 0.35)' : '0 2px 8px rgba(255, 42, 84, 0.1)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        👁
                                    </motion.button>
                                </Tooltip>

                                {/* Schedule button */}
                                <Tooltip label="Schedule Message" hasArrow placement="top">
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.12, translateY: -2 }}
                                        whileTap={{ scale: 0.92 }}
                                        onClick={() => setScheduleModal(true)}
                                        style={{
                                            background: '#EEF2FF',
                                            border: '1px solid #C7D2FE',
                                            borderRadius: '16px',
                                            width: '42px',
                                            height: '42px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            fontSize: '18px',
                                            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.1)'
                                        }}
                                    >
                                        ⏱
                                    </motion.button>
                                </Tooltip>

                                {/* Input text field */}
                                <Input
                                    variant="unstyled"
                                    placeholder={viewOnceMode ? "👁 View-once message..." : "Type a message..."}
                                    value={newMessage}
                                    onChange={typingHandler}
                                    onKeyDown={sendMessage}
                                    px={3}
                                    h="44px"
                                    style={{
                                        border: 'none',
                                        outline: 'none',
                                        fontSize: '0.96rem',
                                        fontFamily: "'Outfit', 'Inter', sans-serif",
                                        fontWeight: 500,
                                        color: '#0F172A',
                                    }}
                                />

                                {/* Glowing Send Button */}
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.08, translateY: -2 }}
                                    whileTap={{ scale: 0.92 }}
                                    onClick={() => sendMessage({ key: "Enter" })}
                                    aria-label="Send Message"
                                    style={{
                                        background: "linear-gradient(135deg, #FF2A54 0%, #E60044 100%)",
                                        borderRadius: "18px",
                                        width: "44px",
                                        height: "44px",
                                        minWidth: "44px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        boxShadow: "0 6px 20px rgba(255, 42, 84, 0.38)",
                                        border: "none",
                                        cursor: "pointer"
                                    }}
                                >
                                    <SendIcon style={{ fontSize: "20px", color: "#FFFFFF", marginLeft: "2px" }} />
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
                                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
                                    zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <div style={{
                                        background: '#FFFFFF', borderRadius: 20, padding: 28, minWidth: 320,
                                        boxShadow: '0 24px 60px rgba(61,43,38,0.18)', fontFamily: "'Inter', sans-serif",
                                    }}>
                                        <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#3D2B26', marginBottom: 16 }}>
                                            🕐 Schedule Message
                                        </h3>
                                        <p style={{ fontSize: 12, color: '#806C65', marginBottom: 12, lineHeight: 1.5 }}>
                                            Message: "{newMessage.slice(0, 60)}{newMessage.length > 60 ? '…' : ''}"
                                        </p>
                                        <label style={{ fontSize: 12, fontWeight: 700, color: '#806C65', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Send At</label>
                                        <input
                                            type="datetime-local"
                                            value={scheduledAt}
                                            onChange={e => setScheduledAt(e.target.value)}
                                            style={{
                                                width: '100%', padding: '10px 14px', borderRadius: 12,
                                                border: '1.5px solid #E63946', fontSize: 14, marginBottom: 20,
                                                fontFamily: "'Inter', sans-serif", outline: 'none',
                                            }}
                                        />
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button
                                                onClick={sendScheduledMessage}
                                                style={{
                                                    flex: 1, background: 'linear-gradient(135deg,#E63946,#d62839)',
                                                    color: '#fff', border: 'none', borderRadius: 12, padding: '11px',
                                                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                                                }}
                                            >Schedule Send</button>
                                            <button
                                                onClick={() => setScheduleModal(false)}
                                                style={{
                                                    padding: '11px 18px', background: '#F5F5F5', border: 'none',
                                                    borderRadius: 12, fontSize: 14, cursor: 'pointer', fontWeight: 600, color: '#806C65',
                                                }}
                                            >Cancel</button>
                                        </div>
                                    </div>
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