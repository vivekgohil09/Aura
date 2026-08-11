import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion';
import { Box, Text, VStack } from "@chakra-ui/layout"
import { Tooltip } from "@chakra-ui/tooltip";
import { Button } from "@chakra-ui/button";
import { BellIcon, ChevronDownIcon, EditIcon, CheckIcon, CloseIcon } from "@chakra-ui/icons";
import { Avatar } from '@chakra-ui/react'
import { useSelector } from 'react-redux';
import { useDisclosure } from "@chakra-ui/hooks";
import { MDBTypography } from 'mdb-react-ui-kit';
import EmailIcon from '@mui/icons-material/Email';
import { MDBBtn } from 'mdb-react-ui-kit';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useHistory } from 'react-router-dom';
import { getJwtToken, handleAuthError } from '../config/getJwt';
import { logout, setSelectedChat, setChats, delSelectedChat, delChats, setNotification } from '../redux/actions';
import { useDispatch } from 'react-redux';
import { Input } from "@chakra-ui/input";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { Search, Feather } from 'lucide-react';
import UserListItem from "./UserListItem"
import ChatLoading from "./ChatLoading"
import Stack from '@mui/material/Stack';
import { stompService } from '../config/stompService2';
import LinearProgress from '@mui/material/LinearProgress';
import { Progress } from '@chakra-ui/react'
import { Badge } from '@chakra-ui/react';

import {
    Drawer,
    DrawerBody,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
} from '@chakra-ui/react';
import AvatarCameraModal from './AvatarCameraModal';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VerifiedIcon from '@mui/icons-material/Verified';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import StarsIcon from '@mui/icons-material/Stars';
import { setUserDetails } from '../redux/actions';

import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Image,
} from '@chakra-ui/react'

import {
    Menu,
    MenuButton,
    MenuDivider,
    MenuItem,
    MenuList,
} from "@chakra-ui/menu";

const url = "https://aura-vdcq.onrender.com";

const SideBar = ({ onOpenDrawer: externalOnOpenDrawer }) => {

    const { isOpen, onOpen, onClose } = useDisclosure()
    const {
        isOpen: isOpenDrawer,
        onOpen: internalOnOpenDrawer,
        onClose: onCloseDrawer
    } = useDisclosure()
    const {
        isOpen: isNotifOpen,
        onOpen: onNotifOpen,
        onClose: onNotifClose
    } = useDisclosure()

    const onOpenDrawer = externalOnOpenDrawer || internalOnOpenDrawer;
    const user = useSelector(state => state.user);
    const notification = useSelector(state => state.notification);
    const chats = useSelector(state => state.chats);
    const [search, setSearch] = useState("");
    const [searchResult, setSearchResult] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingChat, setLoadingChat] = useState(false);
    const [isAvatarStudioOpen, setIsAvatarStudioOpen] = useState(false);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
    const dispatch = useDispatch();
    const searchContainerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setSearchResult([]);
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setSearchResult([]);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
    const [qrScanInput, setQrScanInput] = useState('');
    const [qrTab, setQrTab] = useState('scan');
    const [scannedUsername, setScannedUsername] = useState('');
    const [scannedUser, setScannedUser] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const videoRef = useRef(null);
    const mediaStreamRef = useRef(null);

    const startCamera = async () => {
        setCameraError('');
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } }
                });
                mediaStreamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setCameraActive(true);
            } else {
                setCameraError('Camera access not supported by browser.');
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setCameraError('Camera permission denied or camera not available.');
            setCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        setCameraActive(false);
    };

    const scanIntervalRef = useRef(null);

    useEffect(() => {
        if (isQrScannerOpen && qrTab === 'scan') {
            startCamera();
        } else {
            stopCamera();
        }
        return () => {
            stopCamera();
        };
    }, [isQrScannerOpen, qrTab]);

    useEffect(() => {
        if (isQrScannerOpen && qrTab === 'scan' && cameraActive && videoRef.current) {
            let detector = null;
            if ('BarcodeDetector' in window) {
                try {
                    detector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13', 'data_matrix', 'aztec', 'pdf417'] });
                } catch (e) {}
            }

            scanIntervalRef.current = setInterval(async () => {
                try {
                    if (videoRef.current && videoRef.current.readyState >= 2) {
                        if (detector) {
                            const barcodes = await detector.detect(videoRef.current);
                            if (barcodes && barcodes.length > 0) {
                                const detectedVal = barcodes[0].rawValue;
                                if (detectedVal && detectedVal.trim()) {
                                    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
                                    setScannedUsername(detectedVal.trim());
                                    handleScanQrCode(detectedVal.trim());
                                }
                            }
                        }
                    }
                } catch (e) {}
            }, 350);
        }
        return () => {
            if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        };
    }, [isQrScannerOpen, qrTab, cameraActive]);

    const handleScanQrCode = async (inputVal) => {
        let clean = (inputVal || scannedUsername).trim();
        if (clean.startsWith('@')) clean = clean.substring(1);
        if (!clean) {
            toast.error("Please enter or paste a user QR barcode handle!");
            return;
        }
        setScannedUser(null);
        setIsScanning(true);
        try {
            const config = { headers: { Authorization: "Bearer " + getJwtToken() } };
            const { data } = await axios.get(`/api/user/all-users?search=${clean}`, config);
            
            setTimeout(() => {
                setIsScanning(false);
                if (data && data.length > 0) {
                    setScannedUser(data[0]);
                    toast.success(`✓ Barcode Verified: @${data[0].username || data[0].name}!`, {
                        position: 'top-center',
                        autoClose: 2500,
                        hideProgressBar: true
                    });
                } else {
                    setScannedUser(null);
                    toast.error("No user found for this scanned barcode.");
                }
            }, 1200);
        } catch (err) {
            setIsScanning(false);
            toast.error("Scan error");
        }
    };

    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState('');
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [editEmail, setEditEmail] = useState('');
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [editUsername, setEditUsername] = useState('');
    const [isPreviewPicOpen, setIsPreviewPicOpen] = useState(false);

    const handleSaveName = async () => {
        if (!editName || editName.trim() === '') {
            toast.error('Name cannot be empty!');
            return;
        }

        const updatedUser = {
            ...user,
            name: editName.trim()
        };

        localStorage.setItem('userInfo', JSON.stringify(updatedUser));
        dispatch(setUserDetails(updatedUser));
        setIsEditingName(false);

        toast.success('Name updated successfully!', {
            position: 'top-center',
            autoClose: 2000,
            hideProgressBar: true
        });
    };

    const handleSaveUsername = async () => {
        if (!editUsername || !editUsername.trim()) {
            toast.error('Username cannot be empty!');
            return;
        }

        try {
            const token = getJwtToken();
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            };

            const { data } = await axios.put('/api/user/update-username', {
                userId: user._id || user.id,
                username: editUsername.trim()
            }, config);

            const updatedUser = {
                ...user,
                username: data.username
            };

            localStorage.setItem('userInfo', JSON.stringify(updatedUser));
            dispatch(setUserDetails(updatedUser));
            setIsEditingUsername(false);

            toast.success(`Username updated to @${data.username}!`, {
                position: 'top-center',
                autoClose: 2000,
                hideProgressBar: true
            });
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Username is already taken or invalid!';
            toast.error(errorMsg, {
                position: 'top-center',
                autoClose: 3000,
                hideProgressBar: true
            });
        }
    };

    const handleSaveEmail = async () => {
        if (!editEmail || editEmail.trim() === '') {
            toast.error('Email cannot be empty!');
            return;
        }

        const updatedUser = {
            ...user,
            email: editEmail.trim()
        };

        localStorage.setItem('userInfo', JSON.stringify(updatedUser));
        dispatch(setUserDetails(updatedUser));
        setIsEditingEmail(false);

        toast.success('Email updated successfully!', {
            position: 'top-center',
            autoClose: 2000,
            hideProgressBar: true
        });
    };

    const handleUpdatePic = async (newPic) => {
        try {
            const token = getJwtToken();
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            };
            const { data } = await axios.put('/api/user/update-pic', {
                userId: user?._id || user?.id,
                pic: newPic
            }, config);

            const updatedUser = {
                ...user,
                pic: data.pic || newPic
            };

            localStorage.setItem('userInfo', JSON.stringify(updatedUser));
            dispatch(setUserDetails(updatedUser));

            toast.success('Profile picture updated successfully!', {
                position: 'top-center',
                autoClose: 2000,
                hideProgressBar: true,
                theme: 'colored'
            });
        } catch (err) {
            console.error('Failed to update profile pic:', err);
            toast.error('Failed to save profile picture. Saved locally.', {
                position: 'top-center',
                autoClose: 2000,
                hideProgressBar: true
            });
            const updatedUser = { ...user, pic: newPic };
            localStorage.setItem('userInfo', JSON.stringify(updatedUser));
            dispatch(setUserDetails(updatedUser));
        }
    };

    const [qrModalTab, setQrModalTab] = useState('my_pass');
    const [searchError, setSearchError] = useState('');

    const handleScanQrPayload = async (rawPayload) => {
        const inputStr = rawPayload || qrScanInput;
        if (!inputStr || !inputStr.trim()) {
            toast.error("Please enter or scan a QR payload / username (e.g. @wewewe)");
            return;
        }

        let cleanUsername = inputStr.trim();
        if (cleanUsername.startsWith('@')) {
            cleanUsername = cleanUsername.substring(1);
        }

        try {
            setLoadingChat(true);
            const config = {
                headers: {
                    Authorization: "Bearer " + getJwtToken(),
                },
            };
            const { data } = await axios.get(`/api/v1/users/by-username/${cleanUsername}`, config);
            const targetUserId = data.publicId || data.id || data._id;

            if (targetUserId) {
                await accessChat(targetUserId);
                setIsQrScannerOpen(false);
                if (onClose) onClose();
                toast.success(`Chat connected with ${data.displayName || '@' + cleanUsername}!`, { autoClose: 2000, hideProgressBar: true });
            }
        } catch (error) {
            setLoadingChat(false);
            const msg = error.response?.data?.message || `No user found for @${cleanUsername}`;
            toast.error(msg, { autoClose: 2500, hideProgressBar: true });
        }
    };

    useEffect(() => {
        if (isOpenDrawer) {
            setSearch("");
            setSearchResult([]);
            setSearchError("");
        }
    }, [isOpenDrawer]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!search || !search.trim()) {
                setSearchResult([]);
                return;
            }
            let cleanTerm = search.trim();
            if (cleanTerm.startsWith('@')) {
                cleanTerm = cleanTerm.substring(1);
            }
            try {
                setLoading(true);
                const config = {
                    headers: {
                        Authorization: "Bearer " + getJwtToken(),
                    },
                };
                const { data } = await axios.get(`/api/user/all-users?search=${cleanTerm}`, config);
                setLoading(false);
                setSearchResult(data || []);
            } catch (err) {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    const handleSearch = async (e) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        setSearchError('');
        if (!search || !search.trim()) {
            toast.error("Please enter a username to search (e.g. @vicky123)");
            return;
        }

        let cleanUsername = search.trim();
        if (cleanUsername.startsWith('@')) {
            cleanUsername = cleanUsername.substring(1);
        }

        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: "Bearer " + getJwtToken(),
                },
            };
            const { data } = await axios.get(`/api/user/all-users?search=${cleanUsername}`, config);
            setLoading(false);
            setSearchResult(data || []);
        } catch (error) {
            if (handleAuthError(error, history)) return;
            setLoading(false);
            const errResponse = error.response?.data;
            const msg = errResponse?.message || "No user found with this username.";
            setSearchError(msg);
            toast.error(msg, {
                position: "top-center",
                autoClose: 2500,
                hideProgressBar: true,
                theme: 'colored'
            });
        }
    }

    const accessChat = async (userId, autoSelect = true) => {
        console.log(userId);
        try {
            setLoadingChat(true);
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
            if (autoSelect) {
                dispatch(setSelectedChat(data));
                onCloseDrawer();
            }
            console.log(data);
            setLoadingChat(false);
            return data;
        } catch (error) {
            if (handleAuthError(error, history)) return;
            if (!toast.isActive("failed-to-create-chat-toast")) {
                toast.error('Failed to create chat!', {
                    toastId: "failed-to-create-chat-toast",
                    position: "top-right",
                    autoClose: 2000,
                    hideProgressBar: true,
                    closeOnClick: true,
                    pauseOnHover: false,
                    draggable: true,
                    theme: 'colored'
                });
            }
            setLoadingChat(false);
        }
    };

    const sendChatRequest = async (targetUser) => {
        if (!targetUser) return;
        const targetId = targetUser._id || targetUser.id;
        const myId = user?._id || user?.id;

        if (myId && String(targetId) === String(myId)) {
            toast.info("This is your own profile!");
            return;
        }

        try {
            // Save to sent requests in localStorage scoped by logged user ID
            if (targetId) {
                try {
                    const storageKey = myId ? `aura_sent_requests_${myId}` : "aura_sent_requests";
                    const sentList = JSON.parse(localStorage.getItem(storageKey) || "[]");
                    if (!sentList.includes(String(targetId))) {
                        localStorage.setItem(storageKey, JSON.stringify([...sentList, String(targetId)]));
                    }
                } catch (e) {}
            }

            // Call Option A Backend Persistence API
            try {
                const config = { headers: { "Content-Type": "application/json", Authorization: "Bearer " + getJwtToken() } };
                await axios.post("/api/chat/request/send", { targetUserId: String(targetId) }, config);
            } catch (e) {}

            setIsQrScannerOpen(false);
            setScannedUser(null);
            setScannedUsername('');
            toast.success(`Request Sent to @${targetUser.username || targetUser.name}! Waiting for them to accept.`, {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: true
            });
        } catch (err) {
            toast.error("Failed to send chat request");
        }
    };

    const acceptChatRequest = async (notif) => {
        try {
            const senderId = notif.senderId || (notif.chat ? (notif.chat._id || notif.chat.id) : null);
            if (senderId) {
                // Call Option A DB respond endpoint if requestId exists
                if (notif.requestId) {
                    try {
                        const config = { headers: { Authorization: "Bearer " + getJwtToken() } };
                        await axios.post(`/api/chat/request/respond?requestId=${notif.requestId}&action=ACCEPT`, {}, config);
                    } catch (e) {}
                }

                const fullChat = await accessChat(senderId, false);
                if (fullChat) {
                    const existingChats = chats || [];
                    const fullChatId = fullChat._id || fullChat.id;
                    if (!existingChats.some(c => (c._id || c.id) === fullChatId)) {
                        dispatch(setChats([fullChat, ...existingChats]));
                    }
                    // Do NOT auto open mychat when accepting request

                }
            }
            const updatedNotifs = notification.filter(n => n !== notif);
            dispatch(setNotification(updatedNotifs));
            try {
                const myId = user?._id || user?.id;
                const storageKey = myId ? `aura_received_requests_${myId}` : "aura_received_requests";
                const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
                const filtered = stored.filter(n => n.senderId !== notif.senderId);
                localStorage.setItem(storageKey, JSON.stringify(filtered));
            } catch (e) {}

            toast.success("Chat request accepted! Conversation added to list.", {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: true
            });

            // Auto close notification drawer/menu after 2 seconds when accepted
            setTimeout(() => {
                onNotifClose();
            }, 2000);
        } catch (err) {
            toast.error("Error accepting chat request");
        }
    };

    return (
        <>
            <Box
                d="flex"
                justifyContent="space-between"
                alignItems="center"
                bg="rgba(255, 255, 255, 0.9)"
                position="sticky"
                top="0"
                zIndex={100}
                flexShrink={0}
                px={{ base: 2, sm: 4, md: 6 }}
                py={2.5}
                style={{
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    borderBottom: "1.5px solid rgba(212, 175, 55, 0.25)",
                    boxShadow: "0 8px 30px rgba(15, 23, 42, 0.04)"
                }}
            >
                <div className="d-flex align-items-center gap-2 gap-sm-3" style={{ flex: 1, minWidth: 0 }}>
                    {/* Brand Logo */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }}
                        onClick={() => history.push("/")}
                    >
                        <Box sx={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 6px 18px rgba(212, 175, 55, 0.35)',
                            position: 'relative'
                        }}>
                            <Feather size={20} color="#FFFFFF" strokeWidth={2.2} />
                        </Box>
                        <Box display={{ base: "none", sm: "block" }}>
                            <h2 className="gradient-text m-0" style={{ fontSize: "1.35rem", fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1, fontFamily: "'Outfit', sans-serif" }}>AURA</h2>
                        </Box>
                    </motion.div>

                    {/* Modern Light Grey Pill Search Bar */}
                    <Tooltip label="Click or type to search users and open drawer" hasArrow placement="bottom-start">
                        <Box ref={searchContainerRef} style={{ flex: 1, maxWidth: '520px', position: 'relative' }}>
                            <Box
                                onClick={onOpenDrawer}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    background: '#F8FAFC',
                                    border: '1.5px solid rgba(226, 232, 240, 0.9)',
                                    borderRadius: '99px',
                                    px: 3,
                                    height: '42px',
                                    cursor: 'pointer',
                                    transition: 'all 0.25s ease',
                                    '&:focus-within': {
                                        background: '#FFFFFF',
                                        borderColor: '#D4AF37',
                                        boxShadow: '0 6px 20px rgba(212, 175, 55, 0.18)',
                                    }
                                }}
                            >
                                <Search size={16} color="#94A3B8" style={{ transition: 'all 0.2s' }} />
                                <input
                                    type="text"
                                    placeholder="Search users by @username..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        onOpenDrawer();
                                    }}
                                    onFocus={onOpenDrawer}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSearch(e);
                                    }}
                                    style={{
                                        width: '100%',
                                        minWidth: 0,
                                        border: 'none',
                                        outline: 'none',
                                        background: 'transparent',
                                        fontSize: '0.875rem',
                                        color: '#0F172A',
                                        fontWeight: 600,
                                        fontFamily: "'Inter', sans-serif"
                                    }}
                                />
                                <Tooltip label="Scan QR Code to Add User" hasArrow placement="top">
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.1, y: -1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsQrScannerOpen(true);
                                        }}
                                        style={{
                                            background: 'linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)',
                                            color: '#FFFFFF',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '32px',
                                            height: '32px',
                                            minWidth: '32px',
                                            cursor: 'pointer',
                                            flexShrink: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 3px 12px rgba(212, 175, 55, 0.4)',
                                            touchAction: 'manipulation',
                                            WebkitTapHighlightColor: 'transparent'
                                        }}
                                    >
                                        <QrCodeScannerIcon style={{ fontSize: '17px', color: '#FFFFFF' }} />
                                    </motion.button>
                                </Tooltip>
                            </Box>

                            {/* Dropdown search results aligned directly under top search bar */}
                            {search && searchResult && searchResult.length > 0 && (
                                <Box
                                    position="absolute"
                                    top="52px"
                                    left="0"
                                    w={{ base: "320px", sm: "380px" }}
                                    bg="rgba(255, 255, 255, 0.98)"
                                    borderRadius="24px"
                                    border="1.5px solid rgba(212, 175, 55, 0.35)"
                                    boxShadow="0 25px 60px rgba(15, 23, 42, 0.16), 0 0 30px rgba(212, 175, 55, 0.12)"
                                    backdropFilter="blur(28px)"
                                    WebkitBackdropFilter="blur(28px)"
                                    zIndex="99999"
                                    p={2.5}
                                    maxH="380px"
                                    overflowY="auto"
                                >
                                    <Box px={2} py={1} mb={1} display="flex" alignItems="center" justifyContent="space-between" borderBottom="1px solid #F1F5F9">
                                        <Text fontSize="0.68rem" fontWeight="900" color="#D4AF37" letterSpacing="0.1em" textTransform="uppercase" margin={0}>
                                            ✦ Search Results ({searchResult.length})
                                        </Text>
                                        <Text fontSize="0.68rem" fontWeight="700" color="#94A3B8" margin={0} cursor="pointer" onClick={() => setSearch("")}>
                                            Close ✕
                                        </Text>
                                    </Box>
                                    {searchResult.map((u) => (
                                        <Box key={u.id || u._id}>
                                            <UserListItem user={u} handleFunction={() => sendChatRequest(u)} />
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </Box>
                    </Tooltip>
                </div>


                <div className="d-flex align-items-center gap-2">
                    {/* Notification Bell Menu */}
                    <Menu isOpen={isNotifOpen} onOpen={onNotifOpen} onClose={onNotifClose}>
                        <MenuButton
                            as={motion.button}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                background: '#FFFFFF',
                                border: '1px solid #E5E7EB',
                                borderRadius: '12px',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                            }}
                        >
                            <BellIcon fontSize="1.3rem" color="#0F172A" />
                            {notification && notification.length > 0 && (
                                <span
                                    style={{
                                        position: 'absolute',
                                        top: '-4px',
                                        right: '-4px',
                                        background: 'linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)',
                                        color: '#FFFFFF',
                                        fontSize: '0.65rem',
                                        fontWeight: 800,
                                        borderRadius: '99px',
                                        minWidth: '18px',
                                        height: '18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '0 4px',
                                        border: '2px solid #FFFFFF',
                                        boxShadow: '0 3px 8px rgba(212, 175, 55, 0.4)'
                                    }}
                                >
                                    {notification.length}
                                </span>
                            )}
                        </MenuButton>
                        <MenuList
                            bg="#FFFFFF"
                            borderRadius="20px"
                            p={2}
                            minW="300px"
                            maxW="360px"
                            style={{
                                boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)",
                                border: "1.5px solid rgba(212, 175, 55, 0.25)",
                                zIndex: 9999
                            }}
                        >
                            <Box px={3} py={2} borderBottom="1px solid #F1F5F9" display="flex" alignItems="center" justifyContent="space-between">
                                <Text fontWeight="800" fontSize="0.88rem" color="#0F172A" margin={0} fontFamily="'Outfit', sans-serif">
                                    Notifications ({notification.length})
                                </Text>
                                {notification.length > 0 && (
                                    <Text
                                        fontSize="0.75rem"
                                        color="#D4AF37"
                                        fontWeight="700"
                                        cursor="pointer"
                                        onClick={() => dispatch(setNotification([]))}
                                    >
                                        Clear All
                                    </Text>
                                )}
                            </Box>
                            {(!notification || notification.length === 0) && (
                                <Box p={4} textAlign="center">
                                    <Text fontSize="0.82rem" color="#94A3B8" margin={0} fontFamily="'Inter', sans-serif">
                                        No new notifications
                                    </Text>
                                </Box>
                            )}
                            {notification && notification.map((notif, idx) => (
                                <MenuItem
                                    key={idx}
                                    bg="#FFFFFF"
                                    _hover={{ bg: "#F8FAFC" }}
                                    borderRadius="12px"
                                    my={1}
                                    onClick={() => {
                                        if (notif.chat) {
                                            dispatch(setSelectedChat(notif.chat));
                                            dispatch(setNotification(notification.filter((n) => n !== notif)));
                                        }
                                    }}
                                >
                                    {notif.isRequest || notif.isChatRequest || notif.type === 'chat-request' ? (
                                        <Box w="100%">
                                            <Text fontSize="0.82rem" fontWeight="700" color="#0F172A" margin={0}>
                                                📩 Chat Request from @{notif.senderUsername || notif.senderName}
                                            </Text>
                                            <Box display="flex" alignItems="center" gap="10px" mt={2}>
                                                <Button
                                                    size="xs"
                                                    h="30px"
                                                    px={3}
                                                    style={{
                                                        background: "linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)",
                                                        color: "#FFFFFF",
                                                        borderRadius: "99px",
                                                        fontWeight: 800,
                                                        fontSize: "0.75rem",
                                                        boxShadow: "0 2px 8px rgba(212, 175, 55, 0.3)"
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        acceptChatRequest(notif);
                                                    }}
                                                >
                                                    Accept & Chat
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    h="30px"
                                                    px={3}
                                                    style={{
                                                        background: "#F1F5F9",
                                                        color: "#64748B",
                                                        borderRadius: "99px",
                                                        fontWeight: 700,
                                                        fontSize: "0.75rem",
                                                        border: "1px solid #E2E8F0"
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const filtered = notification.filter((n) => n !== notif);
                                                        dispatch(setNotification(filtered));
                                                        try {
                                                            const myId = user?._id || user?.id;
                                                            const storageKey = myId ? `aura_received_requests_${myId}` : "aura_received_requests";
                                                            const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
                                                            const rem = stored.filter(n => n.senderId !== notif.senderId);
                                                            localStorage.setItem(storageKey, JSON.stringify(rem));
                                                        } catch (err) {}
                                                        toast.info("Chat request declined");
                                                    }}
                                                >
                                                    Decline
                                                </Button>
                                            </Box>
                                        </Box>
                                    ) : (
                                        <Text fontSize="0.82rem" fontWeight="600" color="#0F172A" margin={0}>
                                            {notif.chat?.isGroupChat
                                                ? `💬 New message in ${notif.chat.chatName}`
                                                : `💬 New message from ${notif.senderName || 'user'}`}
                                        </Text>
                                    )}
                                </MenuItem>
                            ))}
                        </MenuList>
                    </Menu>

                    <Menu>
                        <MenuButton
                            as={Button}
                            rightIcon={<ChevronDownIcon color="#0F172A" />}
                            bg="#FFFFFF"
                            border="1.5px solid rgba(226, 232, 240, 0.9)"
                            borderRadius="14px"
                            px={2}
                            py={1}
                            h="42px"
                            _hover={{ bg: "#F8FAFC", borderColor: "#D4AF37" }}
                            _active={{ bg: "#F1F5F9" }}
                            style={{ boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)" }}
                        >
                            <Avatar size="sm" cursor="pointer" name={user && user.name} src={(!user?.pic || user?.pic.includes("icon-library.com")) ? "https://cdn-icons-png.flaticon.com/512/149/149071.png" : user.pic} bg="#0F172A" color="#D4AF37" fontWeight="800" style={{ border: "2px solid #D4AF37" }} />
                        </MenuButton>
                        <MenuList
                            bg="#FFFFFF"
                            borderColor="rgba(212, 175, 55, 0.3)"
                            color="#0F172A"
                            borderRadius="20px"
                            p={1.5}
                            style={{
                                boxShadow: "0 16px 45px rgba(15, 23, 42, 0.12)",
                                border: "1.5px solid rgba(212, 175, 55, 0.3)"
                            }}
                        >
                            <MenuItem
                                bg="#FFFFFF"
                                color="#0F172A"
                                borderRadius="14px"
                                fontFamily="'Outfit', sans-serif"
                                fontWeight="700"
                                _hover={{ bg: "rgba(212, 175, 55, 0.08)", color: "#D4AF37" }}
                                onClick={onOpen}
                                style={{ transition: "all 0.15s ease", padding: "10px 14px" }}
                            >
                                <i className="fa fa-user me-3" style={{ color: "#D4AF37" }} aria-hidden="true"></i> Profile
                            </MenuItem>
                            <MenuItem
                                bg="#FFFFFF"
                                color="#0F172A"
                                borderRadius="14px"
                                fontFamily="'Outfit', sans-serif"
                                fontWeight="700"
                                _hover={{ bg: "#FEF2F2", color: "#EF4444" }}
                                onClick={() => setIsLogoutConfirmOpen(true)}
                                style={{ transition: "all 0.15s ease", padding: "10px 14px" }}
                            >
                                <i className="fas fa-sign-out-alt me-3" style={{ color: "#EF4444" }}></i> Logout
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </div>
            </Box>
            <Drawer
                isOpen={isOpenDrawer}
                placement='left'
                onClose={onCloseDrawer}
                size="md"
            >
                <DrawerOverlay style={{ backdropFilter: "blur(12px)", background: "rgba(15, 23, 42, 0.35)" }} />
                <DrawerContent style={{ background: "#FFFFFF", color: "#0F172A", borderRight: "1.5px solid rgba(212, 175, 55, 0.25)", boxShadow: "0 25px 60px rgba(15, 23, 42, 0.15)", maxWidth: "440px" }}>
                    {loadingChat && (<Progress size='xs' height='3px' colorScheme='teal' isIndeterminate />)}
                    <DrawerHeader style={{ borderBottom: "1px solid #F1F5F9", padding: "20px 24px" }}>
                        <div className='d-flex justify-content-between align-items-center'>
                            <div className="d-flex align-items-center gap-2.5">
                                <Box sx={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(245, 158, 11, 0.04) 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid rgba(212, 175, 55, 0.3)'
                                }}>
                                    <Search size={18} color="#D4AF37" />
                                </Box>
                                <h3 className="m-0" style={{ fontSize: "1.25rem", fontWeight: 900, color: "#0F172A", fontFamily: "'Outfit', sans-serif" }}>Add User by Username</h3>
                            </div>
                        </div>
                    </DrawerHeader>

                    <DrawerBody px={4} py={3}>
                        <form onSubmit={handleSearch}>
                            <Box d="flex" flexDirection="column" gap={3} py={2}>
                                <div style={{ position: 'relative', width: '100%' }}>
                                    <Search size={18} color="#D4AF37" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
                                    <Input
                                        placeholder="Enter exact @username (e.g. @vicky123)"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        bg="#FFFFFF"
                                        color="#0F172A"
                                        pl="42px"
                                        h="46px"
                                        fontWeight="600"
                                        fontFamily="'Inter', sans-serif"
                                        _focus={{ borderColor: "#D4AF37", bg: "#FFFFFF", boxShadow: "0 4px 15px rgba(212, 175, 55, 0.18)" }}
                                        borderRadius="16px"
                                        style={{ border: "1.5px solid rgba(226, 232, 240, 0.9)", fontSize: "0.92rem" }}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    width="100%"
                                    h="46px"
                                    borderRadius="16px"
                                    bg="linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)"
                                    color="#FFFFFF"
                                    fontWeight="800"
                                    fontFamily="'Outfit', sans-serif"
                                    boxShadow="0 4px 15px rgba(212, 175, 55, 0.35)"
                                    _hover={{ opacity: 0.95 }}
                                    isLoading={loading}
                                >
                                    🔍 Search Username
                                </Button>
                            </Box>
                        </form>

                        {searchError && (
                            <Box p={3} mt={2} bg="#FFF0F2" color="#E63946" borderRadius="12px" border="1px solid #FFE3E6" textAlign="center" fontSize="0.85rem" fontWeight="600">
                                ❌ {searchError}
                            </Box>
                        )}

                        {loading ? <ChatLoading /> :
                            (
                                searchResult?.map((u) => (
                                    <Box key={u.id || u._id} mt={4} p={4} borderRadius="18px" bg="#FFFFFF" border="1.5px solid #FFE3E6" boxShadow="0 10px 30px rgba(230, 57, 70, 0.08)" textAlign="center">
                                        <Avatar size="xl" name={u.name} src={u.pic} mb={2} style={{ border: '3px solid #E63946' }} />
                                        <h4 style={{ margin: '4px 0 0', fontWeight: 800, color: '#303633', fontSize: '1.2rem' }}>{u.name}</h4>
                                        <p style={{ margin: '0 0 16px', color: '#E63946', fontWeight: 700, fontSize: '0.9rem' }}>@{u.username}</p>
                                        <Button
                                            width="100%"
                                            h="42px"
                                            borderRadius="12px"
                                            bg={(() => {
                                                try {
                                                    const targetId = String(u.id || u._id);
                                                    const myId = user?._id || user?.id;
                                                    const storageKey = myId ? `aura_sent_requests_${myId}` : "aura_sent_requests";
                                                    const sentList = JSON.parse(localStorage.getItem(storageKey) || "[]");
                                                    return sentList.includes(targetId) ? "#10B981" : "#E63946";
                                                } catch { return "#E63946"; }
                                            })()}
                                            color="#FFFFFF"
                                            fontWeight="700"
                                            _hover={{ opacity: 0.9 }}
                                            onClick={() => sendChatRequest(u)}
                                        >
                                            {(() => {
                                                try {
                                                    const targetId = String(u.id || u._id);
                                                    const myId = user?._id || user?.id;
                                                    const storageKey = myId ? `aura_sent_requests_${myId}` : "aura_sent_requests";
                                                    const sentList = JSON.parse(localStorage.getItem(storageKey) || "[]");
                                                    return sentList.includes(targetId) ? "✓ Requested" : "+ Send Chat Request";
                                                } catch { return "+ Send Chat Request"; }
                                            })()}
                                        </Button>
                                    </Box>
                                ))
                            )
                        }
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
            {/* ── MY PROFILE MODAL (CLASSY ULTRA-AESTHETIC DESIGN WITH FRAMER MOTION) ── */}
            <Modal size="md" isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay style={{ backdropFilter: "blur(24px)", background: "rgba(15, 23, 42, 0.45)" }} />
                <ModalContent style={{
                    background: "#FFFFFF",
                    color: "#0F172A",
                    border: "1.5px solid rgba(212, 175, 55, 0.3)",
                    borderRadius: "32px",
                    boxShadow: "0 40px 100px rgba(15, 23, 42, 0.2)",
                    overflow: "hidden"
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                        {/* ── LUXURIOUS AMBIENT BANNER ── */}
                        <Box sx={{
                            height: '110px',
                            width: '100%',
                            background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.1) 0%, rgba(255, 255, 255, 0) 100%), #FFFFFF',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            p: 3.5,
                            px: 4,
                            borderBottom: '1px solid rgba(212, 175, 55, 0.2)'
                        }}>
                            <Badge
                                sx={{
                                    bg: 'rgba(212, 175, 55, 0.12)',
                                    color: '#D4AF37',
                                    borderRadius: '99px',
                                    px: 3,
                                    py: 1,
                                    fontSize: '0.7rem',
                                    fontWeight: 900,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    border: '1px solid rgba(212, 175, 55, 0.35)'
                                }}
                            >
                                ✦ Aura Profile
                            </Badge>

                            <Box display="flex" gap={2} alignItems="center">
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                        size="sm"
                                        onClick={() => setIsQrScannerOpen(true)}
                                        style={{
                                            background: 'rgba(212, 175, 55, 0.1)',
                                            color: '#D4AF37',
                                            borderRadius: '99px',
                                            padding: '6px 14px',
                                            fontSize: '0.78rem',
                                            fontWeight: 800,
                                            fontFamily: "'Outfit', sans-serif",
                                            border: '1px solid rgba(212, 175, 55, 0.35)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <QrCode2Icon style={{ fontSize: 15 }} />
                                        Profile QR
                                    </Button>
                                </motion.div>
                                
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Box
                                        onClick={onClose}
                                        sx={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            bg: '#F8FAFC',
                                            color: '#64748B',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            border: '1px solid #E2E8F0',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                bg: '#E2E8F0',
                                                color: '#0F172A'
                                            }
                                        }}
                                    >
                                        <CloseIcon style={{ fontSize: 11 }} />
                                    </Box>
                                </motion.div>
                            </Box>
                        </Box>

                        <ModalBody className="text-center pb-6 pt-0 px-6">
                            {/* ── OVERLAY AVATAR HERO ── */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4, position: 'relative', marginTop: '-48px' }}>
                                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                    <Tooltip label="Click to preview picture" hasArrow placement="top">
                                        <motion.div whileHover={{ scale: 1.04 }} transition={{ type: "spring", stiffness: 300 }}>
                                            <Box sx={{
                                                padding: '4px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)',
                                                boxShadow: '0 0 0 3px #FFFFFF, 0 0 0 5px rgba(212, 175, 55, 0.4), 0 10px 25px rgba(212, 175, 55, 0.3)'
                                            }}>
                                                <Avatar
                                                    size="2xl"
                                                    name={user && user.name}
                                                    src={user && user.pic}
                                                    bg="#0F172A !important"
                                                    color="#D4AF37 !important"
                                                    fontWeight="900"
                                                    onClick={() => setIsPreviewPicOpen(true)}
                                                    style={{
                                                        width: '98px',
                                                        height: '98px',
                                                        border: "3px solid #FFFFFF",
                                                        cursor: 'pointer',
                                                        backgroundColor: '#0F172A'
                                                    }}
                                                />
                                            </Box>
                                        </motion.div>
                                    </Tooltip>
                                    
                                    {/* Floating Camera Change Badge */}
                                    <Tooltip label="Change Avatar Photo" hasArrow placement="bottom">
                                        <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                                            <Box
                                                onClick={() => setIsAvatarStudioOpen(true)}
                                                sx={{
                                                    position: 'absolute',
                                                    bottom: '2px',
                                                    right: '2px',
                                                    bg: 'linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)',
                                                    color: '#FFFFFF',
                                                    borderRadius: '50%',
                                                    width: '34px',
                                                    height: '34px',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 4px 14px rgba(212, 175, 55, 0.4)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s ease',
                                                    border: '2.5px solid #FFFFFF'
                                                }}
                                            >
                                                <CameraAltIcon style={{ fontSize: 15 }} />
                                            </Box>
                                        </motion.div>
                                    </Tooltip>
                                </Box>

                                {/* User Hero Titles */}
                                <h3 style={{ margin: '14px 0 2px', fontSize: "1.45rem", fontWeight: 900, color: "#0F172A", fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>
                                    {user?.name || "Aura User"}
                                </h3>
                                <span style={{
                                    background: 'rgba(212, 175, 55, 0.1)',
                                    color: '#D4AF37',
                                    fontSize: '0.82rem',
                                    fontWeight: 800,
                                    padding: '3px 14px',
                                    borderRadius: '99px',
                                    border: '1px solid rgba(212, 175, 55, 0.3)',
                                    fontFamily: "'Inter', sans-serif"
                                }}>
                                    @{user?.username || (user?.email ? user.email.split('@')[0] : 'aura_user')}
                                </span>
                            </Box>

                            {/* ── PROFILE DETAILS EDITABLE CARDS ── */}
                            <VStack spacing={3} width="100%" mb={5}>
                                {/* 1. DISPLAY NAME CARD */}
                                <Box sx={{
                                    width: '100%',
                                    p: 2.5,
                                    px: 3.5,
                                    borderRadius: '18px',
                                    background: '#FFFFFF',
                                    border: '1.5px solid #F1F5F9',
                                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.02)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderColor: 'rgba(212, 175, 55, 0.4)',
                                        boxShadow: '0 6px 20px rgba(212, 175, 55, 0.1)'
                                    }
                                }}>
                                    <Box sx={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        background: 'rgba(212, 175, 55, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        border: '1px solid rgba(212, 175, 55, 0.3)'
                                    }}>
                                        <PersonOutlineIcon style={{ color: '#D4AF37', fontSize: 19 }} />
                                    </Box>
                                    <span style={{ flexGrow: 1, textAlign: 'left' }}>
                                        <strong style={{ color: '#94A3B8', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '1px' }}>Display Name</strong>
                                        {isEditingName ? (
                                            <Input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                autoFocus
                                                size="sm"
                                                mt={1}
                                                borderRadius="10px"
                                                border="1.5px solid #D4AF37"
                                                focusBorderColor="#D4AF37"
                                                bg="#FFFFFF"
                                                color="#0F172A"
                                                fontWeight="700"
                                            />
                                        ) : (
                                            <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem', fontFamily: "'Outfit', sans-serif" }}>{user && user.name}</span>
                                        )}
                                    </span>
                                    {isEditingName ? (
                                        <Box display="flex" gap={1.5}>
                                            <Button
                                                size="sm"
                                                onClick={handleSaveName}
                                                style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)', color: '#FFF', borderRadius: '8px', minW: '30px', padding: '0 8px' }}
                                            >
                                                <CheckIcon fontSize="12px" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => setIsEditingName(false)}
                                                style={{ background: '#F1F5F9', color: '#64748B', borderRadius: '8px', minW: '30px', padding: '0 8px' }}
                                            >
                                                <CloseIcon fontSize="10px" />
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Tooltip label="Edit Name" hasArrow placement="top">
                                            <Button
                                                size="sm"
                                                onClick={() => { setEditName(user?.name || ''); setIsEditingName(true); }}
                                                style={{ background: 'transparent', color: '#94A3B8', borderRadius: '10px', padding: '0', minW: '32px', height: '32px' }}
                                                _hover={{ background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37' }}
                                            >
                                                <EditIcon fontSize="14px" />
                                            </Button>
                                        </Tooltip>
                                    )}
                                </Box>

                                {/* 2. UNIQUE USERNAME CARD */}
                                <Box sx={{
                                    width: '100%',
                                    p: 2.5,
                                    px: 3.5,
                                    borderRadius: '18px',
                                    background: '#FFFFFF',
                                    border: '1.5px solid #F1F5F9',
                                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.02)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderColor: 'rgba(212, 175, 55, 0.4)',
                                        boxShadow: '0 6px 20px rgba(212, 175, 55, 0.1)'
                                    }
                                }}>
                                    <Box sx={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        background: 'rgba(212, 175, 55, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        border: '1px solid rgba(212, 175, 55, 0.3)'
                                    }}>
                                        <AlternateEmailIcon style={{ color: '#D4AF37', fontSize: 19 }} />
                                    </Box>
                                    <span style={{ flexGrow: 1, textAlign: 'left', wordBreak: 'break-all' }}>
                                        <strong style={{ color: '#94A3B8', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '1px' }}>Username</strong>
                                        {isEditingUsername ? (
                                            <Input
                                                value={editUsername}
                                                onChange={(e) => setEditUsername(e.target.value)}
                                                autoFocus
                                                size="sm"
                                                mt={1}
                                                borderRadius="10px"
                                                border="1.5px solid #D4AF37"
                                                focusBorderColor="#D4AF37"
                                                bg="#FFFFFF"
                                                color="#0F172A"
                                                fontWeight="700"
                                                placeholder="e.g. vicky123"
                                            />
                                        ) : (
                                            <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem', fontFamily: "'Outfit', sans-serif" }}>@{user?.username || (user?.email ? user.email.split('@')[0] : 'aura_user')}</span>
                                        )}
                                    </span>
                                    {isEditingUsername ? (
                                        <Box display="flex" gap={1.5}>
                                            <Button
                                                size="sm"
                                                onClick={handleSaveUsername}
                                                style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)', color: '#FFF', borderRadius: '8px', minW: '30px', padding: '0 8px' }}
                                            >
                                                <CheckIcon fontSize="12px" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => setIsEditingUsername(false)}
                                                style={{ background: '#F1F5F9', color: '#64748B', borderRadius: '8px', minW: '30px', padding: '0 8px' }}
                                            >
                                                <CloseIcon fontSize="10px" />
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Box display="flex" gap={0.5}>
                                            <Tooltip label="Edit Username" hasArrow placement="top">
                                                <Button
                                                    size="sm"
                                                    onClick={() => { setEditUsername(user?.username || ''); setIsEditingUsername(true); }}
                                                    style={{ background: 'transparent', color: '#94A3B8', borderRadius: '10px', padding: '0', minW: '32px', height: '32px' }}
                                                    _hover={{ background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37' }}
                                                >
                                                    <EditIcon fontSize="14px" />
                                                </Button>
                                            </Tooltip>
                                            <Tooltip label="Copy Username" hasArrow placement="top">
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        const uName = user?.username || (user?.email ? user.email.split('@')[0] : 'aura_user');
                                                        navigator.clipboard.writeText(`@${uName}`);
                                                        toast.success('Username copied!', { autoClose: 3000, hideProgressBar: true });
                                                    }}
                                                    style={{ background: 'transparent', color: '#94A3B8', borderRadius: '10px', padding: '0', minW: '32px', height: '32px' }}
                                                    _hover={{ background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37' }}
                                                >
                                                    <ContentCopyIcon style={{ fontSize: 14 }} />
                                                </Button>
                                            </Tooltip>
                                        </Box>
                                    )}
                                </Box>

                                {/* 3. EMAIL ADDRESS CARD */}
                                <Box sx={{
                                    width: '100%',
                                    p: 2.5,
                                    px: 3.5,
                                    borderRadius: '18px',
                                    background: '#FFFFFF',
                                    border: '1.5px solid #F1F5F9',
                                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.02)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderColor: 'rgba(212, 175, 55, 0.4)',
                                        boxShadow: '0 6px 20px rgba(212, 175, 55, 0.1)'
                                    }
                                }}>
                                    <Box sx={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        background: 'rgba(212, 175, 55, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        border: '1px solid rgba(212, 175, 55, 0.3)'
                                    }}>
                                        <EmailIcon style={{ color: '#D4AF37', fontSize: 19 }} />
                                    </Box>
                                    <span style={{ flexGrow: 1, textAlign: 'left', wordBreak: 'break-all' }}>
                                        <strong style={{ color: '#94A3B8', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '1px' }}>Email Address</strong>
                                        {isEditingEmail ? (
                                            <Input
                                                value={editEmail}
                                                onChange={(e) => setEditEmail(e.target.value)}
                                                autoFocus
                                                size="sm"
                                                mt={1}
                                                borderRadius="10px"
                                                border="1.5px solid #D4AF37"
                                                focusBorderColor="#D4AF37"
                                                bg="#FFFFFF"
                                                color="#0F172A"
                                                fontWeight="700"
                                            />
                                        ) : (
                                            <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem', fontFamily: "'Outfit', sans-serif" }}>{user && user.email}</span>
                                        )}
                                    </span>
                                    {isEditingEmail ? (
                                        <Box display="flex" gap={1.5}>
                                            <Button
                                                size="sm"
                                                onClick={handleSaveEmail}
                                                style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)', color: '#FFF', borderRadius: '8px', minW: '30px', padding: '0 8px' }}
                                            >
                                                <CheckIcon fontSize="12px" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => setIsEditingEmail(false)}
                                                style={{ background: '#F1F5F9', color: '#64748B', borderRadius: '8px', minW: '30px', padding: '0 8px' }}
                                            >
                                                <CloseIcon fontSize="10px" />
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Tooltip label="Edit Email" hasArrow placement="top">
                                            <Button
                                                size="sm"
                                                onClick={() => { setEditEmail(user?.email || ''); setIsEditingEmail(true); }}
                                                style={{ background: 'transparent', color: '#94A3B8', borderRadius: '10px', padding: '0', minW: '32px', height: '32px' }}
                                                _hover={{ background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37' }}
                                            >
                                                <EditIcon fontSize="14px" />
                                            </Button>
                                        </Tooltip>
                                    )}
                                </Box>
                            </VStack>

                            {/* ── MODAL FOOTER ACTION PILL BUTTON ── */}
                            <Box display="flex" gap={3} justifyContent="center" width="100%" mt={1}>
                                <motion.div style={{ width: '100%' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}>
                                    <MDBBtn
                                        onClick={onClose}
                                        style={{
                                            width: '100%',
                                            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                                            color: '#FFFFFF',
                                            fontWeight: 800,
                                            height: '46px',
                                            borderRadius: '16px',
                                            border: '1.5px solid rgba(212, 175, 55, 0.4)',
                                            fontSize: '0.9rem',
                                            fontFamily: "'Outfit', sans-serif",
                                            letterSpacing: '0.02em',
                                            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.2)',
                                            textTransform: 'none',
                                            cursor: 'pointer',
                                            touchAction: 'manipulation',
                                            WebkitTapHighlightColor: 'transparent'
                                        }}
                                    >
                                        Close Profile
                                    </MDBBtn>
                                </motion.div>
                            </Box>
                        </ModalBody>
                    </motion.div>
                </ModalContent>
            </Modal>

            {/* ── DIGITAL VIP QR PASS MODAL (ULTRA-CLEAN PRISTINE LIGHT GLASS DESIGN) ── */}
            <Modal isOpen={isQrScannerOpen} onClose={() => setIsQrScannerOpen(false)} size="md" isCentered>
                <ModalOverlay style={{ backdropFilter: "blur(20px)", background: "rgba(15, 23, 42, 0.45)" }} />
                <ModalContent style={{
                    borderRadius: '32px',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    border: '1.5px solid rgba(212, 175, 55, 0.3)',
                    boxShadow: '0 30px 80px rgba(15, 23, 42, 0.2)',
                    overflow: 'hidden'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 320, damping: 25 }}
                    >
                        {/* Top Header Bar */}
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 4,
                            px: 5,
                            pb: 2,
                            borderBottom: '1px solid #F1F5F9'
                        }}>
                            <Badge
                                sx={{
                                    bg: 'rgba(212, 175, 55, 0.12)',
                                    color: '#D4AF37',
                                    borderRadius: '99px',
                                    px: 3.5,
                                    py: 1.2,
                                    fontSize: '0.72rem',
                                    fontWeight: 900,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.12em',
                                    border: '1px solid rgba(212, 175, 55, 0.3)',
                                    boxShadow: '0 2px 8px rgba(212, 175, 55, 0.08)'
                                }}
                            >
                                ✦ AURA BARCODE SCANNER
                            </Badge>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Box
                                    onClick={() => setIsQrScannerOpen(false)}
                                    sx={{
                                        width: '34px',
                                        height: '34px',
                                        borderRadius: '50%',
                                        bg: 'rgba(0, 0, 0, 0.04)',
                                        backdropFilter: 'blur(10px)',
                                        color: '#71717A',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        border: '1px solid rgba(0, 0, 0, 0.05)',
                                        '&:hover': {
                                            bg: 'rgba(0, 0, 0, 0.08)',
                                            color: '#18181B'
                                        }
                                    }}
                                >
                                    <CloseIcon style={{ fontSize: 11 }} />
                                </Box>
                            </motion.div>
                        </Box>

                        <ModalBody className="text-center pb-7 pt-2 px-6">
                            {/* Mode Tab Switcher */}
                            <Box sx={{
                                display: 'flex',
                                background: '#F8FAFC',
                                borderRadius: '99px',
                                p: 1,
                                mb: 4,
                                border: '1.5px solid #F1F5F9'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setQrTab('scan')}
                                    style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        borderRadius: '99px',
                                        border: 'none',
                                        background: qrTab === 'scan' ? '#FFFFFF' : 'transparent',
                                        color: qrTab === 'scan' ? '#D4AF37' : '#64748B',
                                        fontWeight: 800,
                                        fontSize: '0.82rem',
                                        fontFamily: "'Outfit', sans-serif",
                                        cursor: 'pointer',
                                        boxShadow: qrTab === 'scan' ? '0 4px 12px rgba(212, 175, 55, 0.15)' : 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    📷 Scan Barcode
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setQrTab('myQr')}
                                    style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        borderRadius: '99px',
                                        border: 'none',
                                        background: qrTab === 'myQr' ? '#FFFFFF' : 'transparent',
                                        color: qrTab === 'myQr' ? '#D4AF37' : '#64748B',
                                        fontWeight: 800,
                                        fontSize: '0.82rem',
                                        fontFamily: "'Outfit', sans-serif",
                                        cursor: 'pointer',
                                        boxShadow: qrTab === 'myQr' ? '0 4px 12px rgba(212, 175, 55, 0.15)' : 'none',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    🪪 My QR Code
                                </button>
                            </Box>

                            {qrTab === 'scan' ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    {/* Animated Camera Viewfinder Frame */}
                                    <Box sx={{
                                        width: '230px',
                                        height: '230px',
                                        borderRadius: '24px',
                                        border: isScanning ? '3px solid #10B981' : '3px solid #D4AF37',
                                        background: '#0F172A',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: isScanning ? '0 12px 35px rgba(16, 185, 129, 0.3)' : '0 12px 35px rgba(212, 175, 55, 0.25)',
                                        transition: 'all 0.3s ease',
                                        mb: 3
                                    }}>
                                        {/* Video Stream Element */}
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                display: cameraActive ? 'block' : 'none'
                                            }}
                                        />

                                        {/* Fallback Overlay if Camera is Loading / Off */}
                                        {!cameraActive && (
                                            <Box textAlign="center" color="#FFFFFF" p={2}>
                                                <QrCode2Icon style={{ fontSize: 46, color: isScanning ? '#10B981' : '#D4AF37', opacity: 0.85 }} />
                                                <Text fontSize="0.75rem" fontWeight="800" color={cameraError ? '#EF4444' : '#94A3B8'} m={0} mt={1}>
                                                    {cameraError ? cameraError : 'Initializing Camera...'}
                                                </Text>
                                                {cameraError && (
                                                    <button
                                                        onClick={startCamera}
                                                        style={{
                                                            marginTop: '8px',
                                                            background: 'linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)',
                                                            color: '#FFF',
                                                            border: 'none',
                                                            padding: '4px 12px',
                                                            borderRadius: '8px',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 800,
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Retry Camera
                                                    </button>
                                                )}
                                            </Box>
                                        )}

                                        {/* Scanning Line Overlay */}
                                        <Box sx={{
                                            position: 'absolute',
                                            top: 0, left: 0, right: 0,
                                            height: '4px',
                                            background: isScanning
                                                ? 'linear-gradient(90deg, transparent, #10B981, transparent)'
                                                : 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
                                            boxShadow: isScanning ? '0 0 20px #10B981' : '0 0 18px #D4AF37',
                                            animation: 'scanLine 1.8s linear infinite',
                                            zIndex: 3
                                        }} />
                                        <style>{`
                                            @keyframes scanLine {
                                                0% { top: 0; }
                                                50% { top: 100%; }
                                                100% { top: 0; }
                                            }
                                        `}</style>
                                    </Box>

                                    {/* Barcode Input & Scan Trigger */}
                                    <Box sx={{ width: '100%', mb: 3 }}>
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            background: '#F8FAFC',
                                            borderRadius: '99px',
                                            border: '1.5px solid #F1F5F9',
                                            p: '4px 6px 4px 14px',
                                            mb: 2
                                        }}>
                                            <input
                                                type="text"
                                                placeholder="Enter or paste scanned @username..."
                                                value={scannedUsername}
                                                onChange={(e) => setScannedUsername(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleScanQrCode(scannedUsername);
                                                }}
                                                style={{
                                                    flex: 1,
                                                    border: 'none',
                                                    outline: 'none',
                                                    background: 'transparent',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 700,
                                                    color: '#0F172A',
                                                    fontFamily: "'Inter', sans-serif"
                                                }}
                                            />
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleScanQrCode(scannedUsername)}
                                                style={{
                                                    background: 'linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)',
                                                    color: '#FFFFFF',
                                                    border: 'none',
                                                    borderRadius: '99px',
                                                    padding: '8px 16px',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 800,
                                                    fontFamily: "'Outfit', sans-serif",
                                                    cursor: 'pointer',
                                                    boxShadow: '0 3px 10px rgba(212, 175, 55, 0.35)'
                                                }}
                                            >
                                                {isScanning ? 'Scanning...' : 'Scan Barcode'}
                                            </motion.button>
                                        </Box>
                                    </Box>

                                    {/* Scanned User Result Card */}
                                    {scannedUser && !isScanning && (
                                        <motion.div initial={{ opacity: 0, scale: 0.94, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 350, damping: 25 }} style={{ width: '100%', marginBottom: '16px' }}>
                                            <Box sx={{
                                                p: 3,
                                                borderRadius: '22px',
                                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%)',
                                                border: '1.5px solid rgba(16, 185, 129, 0.3)',
                                                boxShadow: '0 10px 30px rgba(16, 185, 129, 0.12)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: 2
                                            }}>
                                                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#10B981', background: 'rgba(16, 185, 129, 0.12)', padding: '3px 10px', borderRadius: '99px', letterSpacing: '0.06em' }}>
                                                    ✓ SCANNED BARCODE VERIFIED
                                                </span>
                                                <Box display="flex" alignItems="center" justifyContent="space-between" w="100%">
                                                    <Box display="flex" alignItems="center" gap={3}>
                                                        <Avatar size="md" name={scannedUser.name} src={scannedUser.pic} bg="#10B981" color="#FFFFFF" />
                                                        <Box textAlign="left">
                                                            <Text fontWeight="800" fontSize="0.9rem" color="#18181B" m={0}>
                                                                {scannedUser.name}
                                                            </Text>
                                                            <Text fontWeight="700" fontSize="0.75rem" color="#10B981" m={0}>
                                                                @{scannedUser.username || (scannedUser.email ? scannedUser.email.split('@')[0] : 'user')}
                                                            </Text>
                                                        </Box>
                                                    </Box>
                                                    <UserListItem user={scannedUser} handleFunction={() => sendChatRequest(scannedUser)} />
                                                </Box>
                                            </Box>
                                        </motion.div>
                                    )}
                                </Box>
                            ) : (
                                <>
                                    {/* Profile Hero Avatar */}
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                                        <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                                            <Box sx={{
                                                padding: '4px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)',
                                                boxShadow: '0 8px 25px rgba(212, 175, 55, 0.25)'
                                            }}>
                                                <Avatar
                                                    size="lg"
                                                    name={user && user.name}
                                                    src={user && user.pic}
                                                    bg="#0F172A !important"
                                                    color="#D4AF37 !important"
                                                    fontWeight="900"
                                                    style={{
                                                        width: '80px',
                                                        height: '80px',
                                                        border: "3px solid #FFFFFF",
                                                        backgroundColor: '#0F172A'
                                                    }}
                                                />
                                            </Box>
                                        </motion.div>
                                        <h4 style={{ margin: '10px 0 2px', fontSize: '1.3rem', fontWeight: 900, color: '#0F172A', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>
                                            {user?.name || "Aura User"}
                                        </h4>
                                        <Badge
                                            sx={{
                                                bg: 'rgba(212, 175, 55, 0.12)',
                                                color: '#D4AF37',
                                                borderRadius: '99px',
                                                px: 3.5,
                                                py: 0.8,
                                                fontSize: '0.8rem',
                                                fontWeight: 800,
                                                border: '1px solid rgba(212, 175, 55, 0.3)'
                                            }}
                                        >
                                            @{user?.username || (user?.email ? user.email.split('@')[0] : 'aura_user')}
                                        </Badge>
                                    </Box>

                                    {/* Pristine Light QR Container */}
                                    <motion.div
                                        initial={{ scale: 0.96, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                        whileHover={{ y: -2 }}
                                    >
                                        <Box sx={{
                                            p: 4,
                                            borderRadius: '28px',
                                            background: '#FFFFFF',
                                            border: '1.5px solid #F1F5F9',
                                            boxShadow: '0 12px 35px rgba(15, 23, 42, 0.04)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            mb: 4
                                        }}>
                                            <Box sx={{
                                                p: 3,
                                                borderRadius: '22px',
                                                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, #FFFFFF 100%)',
                                                border: '1.5px solid rgba(212, 175, 55, 0.2)',
                                                boxShadow: '0 6px 20px rgba(212, 175, 55, 0.08)',
                                                mb: 2
                                            }}>
                                                <img
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=@${user?.username || (user?.email ? user.email.split('@')[0] : 'aura_user')}`}
                                                    alt="User QR Code"
                                                    style={{ width: '155px', height: '155px', borderRadius: '14px', display: 'block' }}
                                                />
                                            </Box>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <QrCode2Icon style={{ fontSize: 16, color: '#D4AF37' }} /> Scan QR to quickly connect or view profile
                                            </p>
                                        </Box>
                                    </motion.div>
                                </>
                            )}

                            {/* Action Buttons */}
                            <Box display="flex" gap={3} width="100%">
                                <motion.div style={{ flex: 1 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Button
                                        onClick={() => {
                                            const uName = user?.username || (user?.email ? user.email.split('@')[0] : 'aura_user');
                                            navigator.clipboard.writeText(`@${uName}`);
                                            toast.success('Username handle copied!', { autoClose: 3000, hideProgressBar: true });
                                        }}
                                        style={{
                                            width: '100%',
                                            background: '#FFFFFF',
                                            color: '#D4AF37',
                                            fontWeight: 800,
                                            height: '46px',
                                            borderRadius: '16px',
                                            border: '1.5px solid rgba(212, 175, 55, 0.3)',
                                            fontSize: '0.88rem',
                                            fontFamily: "'Outfit', sans-serif",
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '7px',
                                            boxShadow: '0 4px 12px rgba(212, 175, 55, 0.08)'
                                        }}
                                    >
                                        <ContentCopyIcon style={{ fontSize: 15, color: '#D4AF37' }} /> Copy Handle
                                    </Button>
                                </motion.div>
                                <motion.div style={{ flex: 1 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Button
                                        onClick={() => setIsQrScannerOpen(false)}
                                        style={{
                                            width: '100%',
                                            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                                            color: '#FFFFFF',
                                            fontWeight: 800,
                                            height: '46px',
                                            borderRadius: '16px',
                                            border: '1.5px solid rgba(212, 175, 55, 0.4)',
                                            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.2)',
                                            fontSize: '0.88rem',
                                            fontFamily: "'Outfit', sans-serif",
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        Done
                                    </Button>
                                </motion.div>
                            </Box>
                        </ModalBody>
                    </motion.div>
                </ModalContent>
            </Modal>

            <AvatarCameraModal
                isOpen={isAvatarStudioOpen}
                onClose={() => setIsAvatarStudioOpen(false)}
                onSelectMedia={handleUpdatePic}
                currentPic={user?.pic}
            />

            {/* ── HIGH-RES PROFILE PICTURE PREVIEW LIGHTBOX MODAL (PRISTINE LIGHT GLASS DESIGN) ── */}
            <Modal isOpen={isPreviewPicOpen} onClose={() => setIsPreviewPicOpen(false)} size="md" isCentered>
                <ModalOverlay style={{ backdropFilter: "blur(20px)", background: "rgba(10, 10, 12, 0.45)" }} />
                <ModalContent style={{
                    borderRadius: '32px',
                    background: 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(40px)',
                    color: '#18181B',
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.9)',
                    overflow: 'hidden'
                }}>
                    {/* Header */}
                    <Box sx={{
                        p: 5,
                        pb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <Badge
                            sx={{
                                bg: 'rgba(230, 57, 70, 0.06)',
                                color: '#E63946',
                                borderRadius: '14px',
                                px: 3.5,
                                py: 1.2,
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.12em',
                                border: '1px solid rgba(230, 57, 70, 0.12)',
                                boxShadow: '0 2px 8px rgba(230, 57, 70, 0.04)'
                            }}
                        >
                            ✦ PROFILE PHOTO
                        </Badge>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Box
                                onClick={() => setIsPreviewPicOpen(false)}
                                sx={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '50%',
                                    bg: 'rgba(0, 0, 0, 0.04)',
                                    backdropFilter: 'blur(10px)',
                                    color: '#71717A',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    border: '1px solid rgba(0, 0, 0, 0.05)',
                                    '&:hover': {
                                        bg: 'rgba(0, 0, 0, 0.08)',
                                        color: '#18181B'
                                    }
                                }}
                            >
                                <CloseIcon style={{ fontSize: 11 }} />
                            </Box>
                        </motion.div>
                    </Box>

                    <ModalBody display="flex" flexDirection="column" alignItems="center" justifyContent="center" pb={7} pt={2} px={7}>
                        {/* Avatar High-Res Photo Container */}
                        <motion.div
                            initial={{ scale: 0.94, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            <Box sx={{
                                p: '6px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(230, 57, 70, 0.3) 0%, rgba(255, 255, 255, 0.9) 100%)',
                                boxShadow: '0 12px 35px rgba(230, 57, 70, 0.15)',
                                display: 'inline-block'
                            }}>
                                <img
                                    src={user?.pic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                    alt={user?.name || "Profile Picture"}
                                    style={{
                                        width: '230px',
                                        height: '230px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        display: 'block'
                                    }}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                                    }}
                                />
                            </Box>
                        </motion.div>

                        {/* Identity Tag */}
                        <Box mt={4} textAlign="center">
                            <Text color="#18181B" fontSize="1.35rem" fontWeight="800" fontFamily="'Outfit', sans-serif" letterSpacing="-0.02em" m={0}>
                                {user?.name}
                            </Text>
                            <Badge
                                sx={{
                                    mt: 1.5,
                                    bg: 'rgba(230, 57, 70, 0.06)',
                                    color: '#E63946',
                                    borderRadius: '20px',
                                    px: 3.5,
                                    py: 0.8,
                                    fontSize: '0.8rem',
                                    fontWeight: 800,
                                    border: '1px solid rgba(230, 57, 70, 0.12)',
                                    boxShadow: '0 2px 8px rgba(230, 57, 70, 0.03)'
                                }}
                            >
                                @{user?.username || (user?.email ? user.email.split('@')[0] : 'aura_user')}
                            </Badge>
                        </Box>

                        {/* Action Pill Buttons */}
                        <Box display="flex" gap={3} mt={6} width="100%">
                            <motion.div style={{ flex: 1 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button
                                    onClick={() => {
                                        setIsPreviewPicOpen(false);
                                        setIsAvatarStudioOpen(true);
                                    }}
                                    style={{
                                        width: '100%',
                                        background: '#FFFFFF',
                                        color: '#E63946',
                                        fontWeight: 800,
                                        height: '48px',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(230, 57, 70, 0.15)',
                                        fontSize: '0.88rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '7px',
                                        boxShadow: '0 4px 12px rgba(230, 57, 70, 0.05)'
                                    }}
                                >
                                    📷 Change Photo
                                </Button>
                            </motion.div>
                            <motion.div style={{ flex: 1 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button
                                    onClick={() => setIsPreviewPicOpen(false)}
                                    style={{
                                        width: '100%',
                                        background: '#18181B',
                                        color: '#FFFFFF',
                                        fontWeight: 800,
                                        height: '48px',
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                                        fontSize: '0.88rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    Close Preview
                                </Button>
                            </motion.div>
                        </Box>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Premium Logout Confirmation Centered Dialog */}
            <Modal
                isOpen={isLogoutConfirmOpen}
                onClose={() => setIsLogoutConfirmOpen(false)}
                isCentered
            >
                <ModalOverlay backdropFilter="blur(20px)" bg="rgba(15, 23, 42, 0.45)" />
                <ModalContent
                    borderRadius="32px"
                    border="1.5px solid rgba(212, 175, 55, 0.3)"
                    bg="#FFFFFF"
                    p={4}
                    style={{
                        boxShadow: "0 25px 70px rgba(15, 23, 42, 0.2)",
                        maxWidth: "420px",
                        margin: "12px"
                    }}
                >
                    <ModalBody className="text-center py-5 px-4">
                        <Box
                            mx="auto"
                            w="58px"
                            h="58px"
                            borderRadius="20px"
                            bg="linear-gradient(135deg, rgba(212, 175, 55, 0.14) 0%, rgba(245, 158, 11, 0.05) 100%)"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            color="#D4AF37"
                            mb={4}
                            style={{ border: "1px solid rgba(212, 175, 55, 0.3)", boxShadow: "0 6px 20px rgba(212, 175, 55, 0.15)" }}
                        >
                            <i className="fas fa-sign-out-alt" style={{ fontSize: "22px" }}></i>
                        </Box>
                        <Text fontSize="1.35rem" fontWeight="900" color="#0F172A" mb={2} fontFamily="'Outfit', sans-serif">
                            Confirm Log Out
                        </Text>
                        <Text fontSize="0.9rem" color="#64748B" mb={6} fontFamily="'Inter', sans-serif" lineHeight="1.5">
                            Are you sure you want to end your current session? You will need to log in again to access your conversations.
                        </Text>
                        <Box display="flex" gap={3} justifyContent="center" width="100%">
                            <MDBBtn
                                onClick={() => setIsLogoutConfirmOpen(false)}
                                style={{
                                    flex: 1,
                                    background: '#F1F5F9',
                                    color: '#64748B',
                                    fontWeight: 800,
                                    height: '48px',
                                    borderRadius: '16px',
                                    textTransform: 'none',
                                    boxShadow: 'none',
                                    fontFamily: "'Outfit', sans-serif"
                                }}
                            >
                                Cancel
                            </MDBBtn>
                            <MDBBtn
                                onClick={() => {
                                    dispatch(logout());
                                    localStorage.removeItem("userInfo");
                                    localStorage.removeItem("jwt");
                                    localStorage.removeItem("chats");
                                    dispatch(delSelectedChat());
                                    dispatch(delChats());
                                    
                                    // DISCONNECT WEBSOCKETS TO PREVENT MEMORY/SECURITY LEAKS
                                    stompService.disconnect();
                                    if (window.__auraSocket) {
                                        window.__auraSocket.disconnect();
                                        window.__auraSocket = null;
                                    }
                                    
                                    history.push("/login");
                                }}
                                style={{
                                    flex: 1,
                                    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                                    color: '#FFFFFF',
                                    fontWeight: 800,
                                    height: '48px',
                                    borderRadius: '16px',
                                    border: '1.5px solid rgba(212, 175, 55, 0.4)',
                                    textTransform: 'none',
                                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.2)',
                                    fontFamily: "'Outfit', sans-serif"
                                }}
                            >
                                Yes, Logout
                            </MDBBtn>
                        </Box>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    )
}

export default SideBar