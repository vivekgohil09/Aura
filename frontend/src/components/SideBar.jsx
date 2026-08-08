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
import { Search } from 'lucide-react';
import UserListItem from "./UserListItem"
import ChatLoading from "./ChatLoading"
import Stack from '@mui/material/Stack';
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

const url = "http://localhost:8000";

const SideBar = ({ onOpenDrawer: externalOnOpenDrawer }) => {

    const { isOpen, onOpen, onClose } = useDisclosure()
    const {
        isOpen: isOpenDrawer,
        onOpen: internalOnOpenDrawer,
        onClose: onCloseDrawer
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

    const accessChat = async (userId) => {
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
            dispatch(setSelectedChat(data));
            console.log(data);
            setLoadingChat(false);
            onCloseDrawer();
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
            const fullChat = await accessChat(targetId);
            setIsQrScannerOpen(false);
            setScannedUser(null);
            setScannedUsername('');
            toast.success(`Chat connected with @${targetUser.username || targetUser.name}!`, {
                position: 'top-center',
                autoClose: 2500,
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
                const fullChat = await accessChat(senderId);
                if (fullChat) {
                    const existingChats = chats || [];
                    const fullChatId = fullChat._id || fullChat.id;
                    if (!existingChats.some(c => (c._id || c.id) === fullChatId)) {
                        dispatch(setChats([fullChat, ...existingChats]));
                    }
                    dispatch(setSelectedChat(fullChat));
                }
            }
            dispatch(setNotification(notification.filter(n => n !== notif)));
            toast.success("Chat request accepted! Conversation added to list.", {
                position: 'top-center',
                autoClose: 3000,
                hideProgressBar: true
            });
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
                bg="rgba(255, 255, 255, 0.85)"
                position="relative"
                zIndex={100}
                style={{
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
                    padding: "10px 24px"
                }}
            >
                <div className="d-flex align-items-center gap-3" style={{ flex: 1 }}>
                    {/* Brand Logo */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                        onClick={() => history.push("/")}
                    >
                        <Box sx={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #E63946 0%, #d62839 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 6px 16px rgba(230, 57, 70, 0.3)',
                            position: 'relative'
                        }}>
                            <span style={{ fontSize: '1.3rem', color: '#FFFFFF', lineHeight: 1 }}>🪶</span>
                        </Box>
                        <div>
                            <h2 className="gradient-text m-0" style={{ fontSize: "1.45rem", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1 }}>AURA</h2>
                        </div>
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
                                    background: '#F4F4F5',
                                    border: '1px solid #E4E4E7',
                                    borderRadius: '99px',
                                    px: 3,
                                    height: '42px',
                                    cursor: 'pointer',
                                    transition: 'all 0.25s ease',
                                    '&:focus-within': {
                                        background: '#FFFFFF',
                                        borderColor: '#E63946',
                                        boxShadow: '0 6px 20px rgba(230, 57, 70, 0.15)',
                                    }
                                }}
                            >
                                <Search size={16} color="#A1A1AA" style={{ transition: 'all 0.2s' }} />
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
                                        color: '#18181B',
                                        fontWeight: 500,
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
                                            background: 'linear-gradient(135deg, #E63946 0%, #d62839 100%)',
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
                                            boxShadow: '0 3px 10px rgba(230, 57, 70, 0.35)',
                                            touchAction: 'manipulation',
                                            WebkitTapHighlightColor: 'transparent'
                                        }}
                                    >
                                        <QrCodeScannerIcon style={{ fontSize: '17px', color: '#FFFFFF' }} />
                                    </motion.button>
                                </Tooltip>
                            </Box>

                            {/* Dropdown search results centered directly under top search bar */}
                            {search && searchResult && searchResult.length > 0 && (
                                <Box
                                    position="absolute"
                                    top="52px"
                                    left="50%"
                                    transform="translateX(-50%)"
                                    w="100%"
                                    maxW="480px"
                                    minW="320px"
                                    bg="#FFFFFF"
                                    borderRadius="22px"
                                    border="1.5px solid rgba(230, 57, 70, 0.15)"
                                    boxShadow="0 25px 60px rgba(0, 0, 0, 0.18)"
                                    zIndex="99999"
                                    p={2.5}
                                    maxH="360px"
                                    overflowY="auto"
                                >
                                    {searchResult.map((u) => (
                                        <Box
                                            key={u.id || u._id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                sendChatRequest(u);
                                            }}
                                        >
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
                    <Menu>
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
                            <BellIcon fontSize="1.3rem" color="#18181B" />
                            {notification && notification.length > 0 && (
                                <span
                                    style={{
                                        position: 'absolute',
                                        top: '-4px',
                                        right: '-4px',
                                        background: 'linear-gradient(135deg, #E63946 0%, #d62839 100%)',
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
                                        boxShadow: '0 3px 8px rgba(230, 57, 70, 0.4)'
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
                                boxShadow: "0 18px 45px rgba(0, 0, 0, 0.14)",
                                border: "1px solid rgba(0, 0, 0, 0.08)",
                                zIndex: 9999
                            }}
                        >
                            <Box px={3} py={2} borderBottom="1px solid #F4F4F5" display="flex" alignItems="center" justifyContent="space-between">
                                <Text fontWeight="800" fontSize="0.88rem" color="#18181B" margin={0}>
                                    Notifications ({notification.length})
                                </Text>
                                {notification.length > 0 && (
                                    <Text
                                        fontSize="0.75rem"
                                        fontWeight="700"
                                        color="#E63946"
                                        cursor="pointer"
                                        onClick={() => dispatch(setNotification([]))}
                                    >
                                        Clear All
                                    </Text>
                                )}
                            </Box>
                            {!notification.length && (
                                <MenuItem bg="#FFFFFF" cursor="default" _hover={{ bg: "#FFFFFF" }}>
                                    <Text fontSize="0.82rem" color="#A1A1AA" m={0} py={2} textAlign="center" w="100%">
                                        🔔 No new notifications or chat requests
                                    </Text>
                                </MenuItem>
                            )}
                            {notification.map((notif, index) => (
                                <MenuItem
                                    key={notif._id || notif.id || index}
                                    bg="#FFFFFF"
                                    borderRadius="14px"
                                    my={1}
                                    _hover={{ bg: "rgba(230, 57, 70, 0.04)" }}
                                    onClick={() => {
                                        if (notif.isChatRequest) {
                                            acceptChatRequest(notif);
                                        } else if (notif.chat) {
                                            dispatch(setSelectedChat(notif.chat));
                                            dispatch(setNotification(notification.filter((n) => n !== notif)));
                                        }
                                    }}
                                >
                                    {notif.isChatRequest ? (
                                        <Box w="100%">
                                            <Box display="flex" alignItems="center" gap={2} mb={1}>
                                                <Avatar size="xs" name={notif.senderName} src={notif.senderPic} />
                                                <Text fontSize="0.82rem" fontWeight="700" color="#18181B" margin={0}>
                                                    Chat Request from @{notif.senderUsername || notif.senderName}
                                                </Text>
                                            </Box>
                                            <Box display="flex" gap={2} mt={2}>
                                                <Button
                                                    size="xs"
                                                    style={{
                                                        background: "linear-gradient(135deg, #E63946 0%, #D62839 100%)",
                                                        color: "#FFFFFF",
                                                        borderRadius: "99px",
                                                        fontWeight: 700
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
                                                    style={{
                                                        background: "#F4F4F5",
                                                        color: "#71717A",
                                                        borderRadius: "99px",
                                                        fontWeight: 700
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        dispatch(setNotification(notification.filter((n) => n !== notif)));
                                                        toast.info("Chat request declined");
                                                    }}
                                                >
                                                    Decline
                                                </Button>
                                            </Box>
                                        </Box>
                                    ) : (
                                        <Text fontSize="0.82rem" fontWeight="600" color="#18181B" margin={0}>
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
                            rightIcon={<ChevronDownIcon color="#111827" />}
                            bg="#FFFFFF"
                            border="1px solid #E5E7EB"
                            borderRadius="12px"
                            px={2}
                            py={1}
                            h="40px"
                            _hover={{ bg: "#F3F4F6", borderColor: "#9CA3AF" }}
                            _active={{ bg: "#E5E7EB" }}
                            style={{ boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)" }}
                        >
                            <Avatar size="sm" cursor="pointer" name={user && user.name} src={(!user?.pic || user?.pic.includes("icon-library.com")) ? "https://cdn-icons-png.flaticon.com/512/149/149071.png" : user.pic} bg="#111827" color="#FFFFFF" />
                        </MenuButton>
                        <MenuList
                            bg="#FFFFFF"
                            borderColor="#FFDAC8"
                            color="#1E1B18"
                            borderRadius="18px"
                            p={1.5}
                            style={{ boxShadow: "0 12px 36px rgba(224, 122, 95, 0.12)", border: "1px solid #FFDAC8" }}
                        >
                            <MenuItem
                                bg="#FFFFFF"
                                color="#1E1B18"
                                borderRadius="12px"
                                _hover={{ bg: "#FDF3F0", color: "#E07A5F" }}
                                onClick={onOpen}
                                style={{ transition: "all 0.15s ease" }}
                            >
                                <i className="fa fa-user me-3" style={{ color: "#E07A5F" }} aria-hidden="true"></i> Profile
                            </MenuItem>
                            <MenuItem
                                bg="#FFFFFF"
                                color="#1E1B18"
                                borderRadius="12px"
                                _hover={{ bg: "#FFF0EE", color: "#DC2626" }}
                                onClick={() => setIsLogoutConfirmOpen(true)}
                                style={{ transition: "all 0.15s ease" }}
                            >
                                <i className="fas fa-sign-out-alt me-3" style={{ color: "#DC2626" }}></i> Logout
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </div>
            </Box>
            <Drawer
                isOpen={isOpenDrawer}
                placement='left'
                onClose={onCloseDrawer}
            >
                <DrawerOverlay style={{ backdropFilter: "blur(10px)", background: "rgba(48, 54, 51, 0.25)" }} />
                <DrawerContent style={{ background: "#FFFFFF", color: "#303633", borderRight: "1px solid #ECE9E1", boxShadow: "0 20px 50px rgba(57, 115, 107, 0.12)" }}>
                    {loadingChat && (<Progress size='xs' height='3px' colorScheme='teal' isIndeterminate />)}
                    <DrawerHeader style={{ borderBottom: "1px solid #ECE9E1", padding: "18px 24px" }}>
                        <div className='d-flex justify-content-between align-items-center'>
                            <div className="d-flex align-items-center gap-2">
                                <Box sx={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #FFF0F2 0%, #FFF9FA 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid #FFE3E6'
                                }}>
                                    <span style={{ fontSize: '1rem', color: '#E63946' }}>🔍</span>
                                </Box>
                                <h3 className="m-0" style={{ fontSize: "1.35rem", fontWeight: 800, color: "#303633" }}>Add User by Username</h3>
                            </div>
                        </div>
                    </DrawerHeader>

                    <DrawerBody px={4} py={3}>
                        <form onSubmit={handleSearch}>
                            <Box d="flex" flexDirection="column" gap={3} py={2}>
                                <div style={{ position: 'relative', width: '100%' }}>
                                    <Search size={18} color="#E63946" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
                                    <Input
                                        placeholder="Enter exact @username (e.g. @vicky123)"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        bg="#FCFBF8"
                                        color="#303633"
                                        pl="42px"
                                        h="46px"
                                        _focus={{ borderColor: "#E63946", bg: "#FFFFFF", boxShadow: "0 4px 15px rgba(230, 57, 70, 0.15)" }}
                                        borderRadius="14px"
                                        style={{ border: "1px solid #E5E1D8", fontSize: "0.95rem" }}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    width="100%"
                                    h="44px"
                                    borderRadius="12px"
                                    bg="linear-gradient(135deg, #E63946 0%, #d62839 100%)"
                                    color="#FFFFFF"
                                    fontWeight="700"
                                    _hover={{ bg: "#d62839" }}
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
                                            bg="#E63946"
                                            color="#FFFFFF"
                                            fontWeight="700"
                                            _hover={{ bg: "#d62839" }}
                                            onClick={() => accessChat(u.id || u._id)}
                                        >
                                            💬 Start Chat
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
                <ModalOverlay style={{ backdropFilter: "blur(24px)", background: "rgba(10, 10, 12, 0.65)" }} />
                <ModalContent style={{
                    background: "rgba(255, 255, 255, 0.85)",
                    backdropFilter: "blur(40px)",
                    color: "#18181B",
                    border: "1px solid rgba(255, 255, 255, 0.4)",
                    borderRadius: "32px",
                    boxShadow: "0 40px 100px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.5)",
                    overflow: "hidden"
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                        {/* ── LUXURIOUS MESH GRADIENT COVER BANNER ── */}
                        <Box sx={{
                            height: '140px',
                            width: '100%',
                            background: 'radial-gradient(circle at 100% 0%, rgba(230, 57, 70, 0.15) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(230, 57, 70, 0.1) 0%, transparent 50%), #FFFFFF',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            p: 4,
                            px: 5,
                            borderBottom: '1px solid rgba(0, 0, 0, 0.03)'
                        }}>
                            <Badge
                                sx={{
                                    bg: 'rgba(0, 0, 0, 0.05)',
                                    backdropFilter: 'blur(12px)',
                                    color: '#18181B',
                                    borderRadius: '12px',
                                    px: 3.5,
                                    py: 1.2,
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.12em',
                                    border: '1px solid rgba(0, 0, 0, 0.05)',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)'
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
                                            background: 'rgba(230, 57, 70, 0.08)',
                                            backdropFilter: 'blur(10px)',
                                            color: '#E63946',
                                            borderRadius: '20px',
                                            padding: '6px 16px',
                                            fontSize: '0.78rem',
                                            fontWeight: 700,
                                            border: '1px solid rgba(230, 57, 70, 0.15)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            boxShadow: '0 4px 12px rgba(230, 57, 70, 0.05)'
                                        }}
                                    >
                                        <QrCode2Icon style={{ fontSize: 16 }} />
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
                                            bg: 'rgba(0, 0, 0, 0.04)',
                                            backdropFilter: 'blur(10px)',
                                            color: '#71717A',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            border: '1px solid rgba(0, 0, 0, 0.05)',
                                            transition: 'all 0.2s ease',
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
                        </Box>

                        <ModalBody className="text-center pb-8 pt-0 px-8">
                            {/* ── OVERLAY AVATAR HERO ── */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 5, position: 'relative', marginTop: '-55px' }}>
                                <Box sx={{
                                    position: 'relative',
                                    display: 'inline-block'
                                }}>
                                    <Tooltip label="Click to preview picture" hasArrow placement="top">
                                        <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                                            <Box sx={{
                                                padding: '6px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, rgba(230, 57, 70, 0.2) 0%, rgba(255, 255, 255, 0.8) 100%)',
                                                backdropFilter: 'blur(10px)',
                                                boxShadow: '0 8px 32px rgba(230, 57, 70, 0.15)'
                                            }}>
                                                <Avatar
                                                    size="2xl"
                                                    name={user && user.name}
                                                    src={user && user.pic}
                                                    bg="#F4F4F5"
                                                    color="#E63946"
                                                    onClick={() => setIsPreviewPicOpen(true)}
                                                    style={{
                                                        width: '110px',
                                                        height: '110px',
                                                        border: "3px solid #FFFFFF",
                                                        cursor: 'pointer'
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
                                                    bottom: '4px',
                                                    right: '4px',
                                                    bg: '#FFFFFF',
                                                    color: '#E63946',
                                                    borderRadius: '50%',
                                                    width: '36px',
                                                    height: '36px',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s ease',
                                                    border: '1px solid rgba(230, 57, 70, 0.15)',
                                                    '&:hover': {
                                                        bg: '#FFF0F2'
                                                    }
                                                }}
                                            >
                                                <CameraAltIcon style={{ fontSize: 16 }} />
                                            </Box>
                                        </motion.div>
                                    </Tooltip>
                                </Box>

                                {/* User Hero Titles */}
                                <h3 style={{ margin: '16px 0 4px', fontSize: "1.5rem", fontWeight: 800, color: "#18181B", fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>
                                    {user?.name || "Aura User"}
                                </h3>
                                <Text sx={{
                                    color: '#71717A',
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                    letterSpacing: '0.01em',
                                    margin: 0
                                }}>
                                    @{user?.username || (user?.email ? user.email.split('@')[0] : 'aura_user')}
                                </Text>
                            </Box>

                            {/* ── PROFILE DETAILS EDITABLE CARDS ── */}
                            <VStack spacing={4} width="100%" mb={6}>
                                {/* 1. DISPLAY NAME CARD */}
                                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} transition={{ duration: 0.2 }} style={{ width: '100%' }}>
                                    <Box sx={{
                                        width: '100%',
                                        p: 3,
                                        px: 4,
                                        borderRadius: '20px',
                                        background: 'rgba(255, 255, 255, 0.6)',
                                        border: '1px solid rgba(0, 0, 0, 0.04)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.02)'
                                    }}>
                                        <Box sx={{
                                            width: '42px',
                                            height: '42px',
                                            borderRadius: '12px',
                                            background: 'linear-gradient(135deg, rgba(230,57,70,0.05) 0%, rgba(230,57,70,0.01) 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            border: '1px solid rgba(230,57,70,0.05)'
                                        }}>
                                            <PersonOutlineIcon style={{ color: '#E63946', fontSize: 20 }} />
                                        </Box>
                                        <span style={{ flexGrow: 1, textAlign: 'left' }}>
                                            <strong style={{ color: '#A1A1AA', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '2px' }}>Display Name</strong>
                                            {isEditingName ? (
                                                <Input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    autoFocus
                                                    size="sm"
                                                    mt={1}
                                                    borderRadius="8px"
                                                    border="1.5px solid rgba(230, 57, 70, 0.4)"
                                                    focusBorderColor="#E63946"
                                                    bg="#FFFFFF"
                                                    fontWeight="600"
                                                />
                                            ) : (
                                                <span style={{ fontWeight: 700, color: '#18181B', fontSize: '1rem' }}>{user && user.name}</span>
                                            )}
                                        </span>
                                        {isEditingName ? (
                                            <Box display="flex" gap={1.5}>
                                                <Button
                                                    size="sm"
                                                    onClick={handleSaveName}
                                                    style={{ background: '#E63946', color: '#FFF', borderRadius: '10px', minW: '32px', padding: '0 10px', boxShadow: '0 4px 10px rgba(230,57,70,0.2)' }}
                                                >
                                                    <CheckIcon fontSize="12px" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => setIsEditingName(false)}
                                                    style={{ background: '#F4F4F5', color: '#71717A', borderRadius: '10px', minW: '32px', padding: '0 10px' }}
                                                >
                                                    <CloseIcon fontSize="10px" />
                                                </Button>
                                            </Box>
                                        ) : (
                                            <Tooltip label="Edit Name" hasArrow placement="top">
                                                <Button
                                                    size="sm"
                                                    onClick={() => { setEditName(user?.name || ''); setIsEditingName(true); }}
                                                    style={{ background: 'transparent', color: '#A1A1AA', borderRadius: '12px', padding: '0', minW: '36px', height: '36px' }}
                                                    _hover={{ background: 'rgba(0,0,0,0.04)', color: '#18181B' }}
                                                >
                                                    <EditIcon fontSize="14px" />
                                                </Button>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </motion.div>

                                {/* 2. UNIQUE USERNAME CARD */}
                                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} transition={{ duration: 0.2 }} style={{ width: '100%' }}>
                                    <Box sx={{
                                        width: '100%',
                                        p: 3,
                                        px: 4,
                                        borderRadius: '20px',
                                        background: 'rgba(255, 255, 255, 0.6)',
                                        border: '1px solid rgba(0, 0, 0, 0.04)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.02)'
                                    }}>
                                        <Box sx={{
                                            width: '42px',
                                            height: '42px',
                                            borderRadius: '12px',
                                            background: 'linear-gradient(135deg, rgba(230,57,70,0.05) 0%, rgba(230,57,70,0.01) 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            border: '1px solid rgba(230,57,70,0.05)'
                                        }}>
                                            <AlternateEmailIcon style={{ color: '#E63946', fontSize: 19 }} />
                                        </Box>
                                        <span style={{ flexGrow: 1, textAlign: 'left', wordBreak: 'break-all' }}>
                                            <strong style={{ color: '#A1A1AA', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '2px' }}>Username</strong>
                                            {isEditingUsername ? (
                                                <Input
                                                    value={editUsername}
                                                    onChange={(e) => setEditUsername(e.target.value)}
                                                    autoFocus
                                                    size="sm"
                                                    mt={1}
                                                    borderRadius="8px"
                                                    border="1.5px solid rgba(230, 57, 70, 0.4)"
                                                    focusBorderColor="#E63946"
                                                    bg="#FFFFFF"
                                                    fontWeight="600"
                                                    placeholder="e.g. vicky123"
                                                />
                                            ) : (
                                                <span style={{ fontWeight: 600, color: '#18181B', fontSize: '0.95rem' }}>@{user?.username || (user?.email ? user.email.split('@')[0] : 'aura_user')}</span>
                                            )}
                                        </span>
                                        {isEditingUsername ? (
                                            <Box display="flex" gap={1.5}>
                                                <Button
                                                    size="sm"
                                                    onClick={handleSaveUsername}
                                                    style={{ background: '#E63946', color: '#FFF', borderRadius: '10px', minW: '32px', padding: '0 10px', boxShadow: '0 4px 10px rgba(230,57,70,0.2)' }}
                                                >
                                                    <CheckIcon fontSize="12px" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => setIsEditingUsername(false)}
                                                    style={{ background: '#F4F4F5', color: '#71717A', borderRadius: '10px', minW: '32px', padding: '0 10px' }}
                                                >
                                                    <CloseIcon fontSize="10px" />
                                                </Button>
                                            </Box>
                                        ) : (
                                            <Box display="flex" gap={1}>
                                                <Tooltip label="Edit Username" hasArrow placement="top">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => { setEditUsername(user?.username || ''); setIsEditingUsername(true); }}
                                                        style={{ background: 'transparent', color: '#A1A1AA', borderRadius: '12px', padding: '0', minW: '36px', height: '36px' }}
                                                        _hover={{ background: 'rgba(0,0,0,0.04)', color: '#18181B' }}
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
                                                        style={{ background: 'transparent', color: '#A1A1AA', borderRadius: '12px', padding: '0', minW: '36px', height: '36px' }}
                                                        _hover={{ background: 'rgba(0,0,0,0.04)', color: '#18181B' }}
                                                    >
                                                        <ContentCopyIcon style={{ fontSize: 14 }} />
                                                    </Button>
                                                </Tooltip>
                                            </Box>
                                        )}
                                    </Box>
                                </motion.div>

                                {/* 3. EMAIL ADDRESS CARD */}
                                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} transition={{ duration: 0.2 }} style={{ width: '100%' }}>
                                    <Box sx={{
                                        width: '100%',
                                        p: 3,
                                        px: 4,
                                        borderRadius: '20px',
                                        background: 'rgba(255, 255, 255, 0.6)',
                                        border: '1px solid rgba(0, 0, 0, 0.04)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.02)'
                                    }}>
                                        <Box sx={{
                                            width: '42px',
                                            height: '42px',
                                            borderRadius: '12px',
                                            background: 'linear-gradient(135deg, rgba(230,57,70,0.05) 0%, rgba(230,57,70,0.01) 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            border: '1px solid rgba(230,57,70,0.05)'
                                        }}>
                                            <EmailIcon style={{ color: '#E63946', fontSize: 20 }} />
                                        </Box>
                                        <span style={{ flexGrow: 1, textAlign: 'left', wordBreak: 'break-all' }}>
                                            <strong style={{ color: '#A1A1AA', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '2px' }}>Email Address</strong>
                                            {isEditingEmail ? (
                                                <Input
                                                    value={editEmail}
                                                    onChange={(e) => setEditEmail(e.target.value)}
                                                    autoFocus
                                                    size="sm"
                                                    mt={1}
                                                    borderRadius="8px"
                                                    border="1.5px solid rgba(230, 57, 70, 0.4)"
                                                    focusBorderColor="#E63946"
                                                    bg="#FFFFFF"
                                                    fontWeight="600"
                                                />
                                            ) : (
                                                <span style={{ fontWeight: 600, color: '#18181B', fontSize: '0.95rem' }}>{user && user.email}</span>
                                            )}
                                        </span>
                                        {isEditingEmail ? (
                                            <Box display="flex" gap={1.5}>
                                                <Button
                                                    size="sm"
                                                    onClick={handleSaveEmail}
                                                    style={{ background: '#E63946', color: '#FFF', borderRadius: '10px', minW: '32px', padding: '0 10px', boxShadow: '0 4px 10px rgba(230,57,70,0.2)' }}
                                                >
                                                    <CheckIcon fontSize="12px" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => setIsEditingEmail(false)}
                                                    style={{ background: '#F4F4F5', color: '#71717A', borderRadius: '10px', minW: '32px', padding: '0 10px' }}
                                                >
                                                    <CloseIcon fontSize="10px" />
                                                </Button>
                                            </Box>
                                        ) : (
                                            <Tooltip label="Edit Email" hasArrow placement="top">
                                                <Button
                                                    size="sm"
                                                    onClick={() => { setEditEmail(user?.email || ''); setIsEditingEmail(true); }}
                                                    style={{ background: 'transparent', color: '#A1A1AA', borderRadius: '12px', padding: '0', minW: '36px', height: '36px' }}
                                                    _hover={{ background: 'rgba(0,0,0,0.04)', color: '#18181B' }}
                                                >
                                                    <EditIcon fontSize="14px" />
                                                </Button>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </motion.div>
                            </VStack>

                            {/* ── MODAL FOOTER ACTION PILL BUTTON ── */}
                            <Box display="flex" gap={3} justifyContent="center" width="100%" mt={2}>
                                <motion.div style={{ width: '100%' }} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.95 }}>
                                    <MDBBtn
                                        onClick={onClose}
                                        style={{
                                            width: '100%',
                                            background: 'linear-gradient(135deg, #18181B 0%, #27272A 100%)',
                                            color: '#FFFFFF',
                                            fontWeight: 800,
                                            height: '50px',
                                            borderRadius: '99px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            fontSize: '0.95rem',
                                            fontFamily: "'Outfit', 'Inter', sans-serif",
                                            letterSpacing: '0.02em',
                                            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                                            textTransform: 'none',
                                            cursor: 'pointer',
                                            touchAction: 'manipulation',
                                            WebkitTapHighlightColor: 'transparent',
                                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
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
                            p: 5,
                            pb: 2
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
                                background: '#F4F4F5',
                                borderRadius: '99px',
                                p: 1,
                                mb: 4,
                                border: '1px solid #E4E4E7'
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
                                        color: qrTab === 'scan' ? '#E63946' : '#71717A',
                                        fontWeight: 800,
                                        fontSize: '0.82rem',
                                        cursor: 'pointer',
                                        boxShadow: qrTab === 'scan' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
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
                                        color: qrTab === 'myQr' ? '#E63946' : '#71717A',
                                        fontWeight: 800,
                                        fontSize: '0.82rem',
                                        cursor: 'pointer',
                                        boxShadow: qrTab === 'myQr' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
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
                                        border: isScanning ? '3px solid #10B981' : '3px solid #E63946',
                                        background: '#09090B',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: isScanning ? '0 12px 35px rgba(16, 185, 129, 0.4)' : '0 12px 35px rgba(230, 57, 70, 0.2)',
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
                                                <QrCode2Icon style={{ fontSize: 46, color: isScanning ? '#10B981' : '#E63946', opacity: 0.85 }} />
                                                <Text fontSize="0.75rem" fontWeight="800" color={cameraError ? '#EF4444' : '#A1A1AA'} m={0} mt={1}>
                                                    {cameraError ? cameraError : 'Initializing Camera...'}
                                                </Text>
                                                {cameraError && (
                                                    <button
                                                        onClick={startCamera}
                                                        style={{
                                                            marginTop: '8px',
                                                            background: '#E63946',
                                                            color: '#FFF',
                                                            border: 'none',
                                                            padding: '4px 10px',
                                                            borderRadius: '6px',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 700,
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
                                                : 'linear-gradient(90deg, transparent, #FF4D6D, transparent)',
                                            boxShadow: isScanning ? '0 0 20px #10B981' : '0 0 15px #FF4D6D',
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
                                            background: '#F4F4F5',
                                            borderRadius: '99px',
                                            border: '1px solid #E4E4E7',
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
                                                    fontWeight: 600,
                                                    color: '#18181B'
                                                }}
                                            />
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleScanQrCode(scannedUsername)}
                                                style={{
                                                    background: 'linear-gradient(135deg, #E63946 0%, #D62839 100%)',
                                                    color: '#FFFFFF',
                                                    border: 'none',
                                                    borderRadius: '99px',
                                                    padding: '8px 16px',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 800,
                                                    cursor: 'pointer',
                                                    boxShadow: '0 3px 10px rgba(230, 57, 70, 0.3)'
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
                                                padding: '5px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, rgba(230, 57, 70, 0.25) 0%, rgba(255, 255, 255, 0.9) 100%)',
                                                boxShadow: '0 8px 25px rgba(230, 57, 70, 0.12)'
                                            }}>
                                                <Avatar
                                                    size="lg"
                                                    name={user && user.name}
                                                    src={user && user.pic}
                                                    bg="#E63946"
                                                    color="#FFFFFF"
                                                    style={{
                                                        width: '80px',
                                                        height: '80px',
                                                        border: "3px solid #FFFFFF"
                                                    }}
                                                />
                                            </Box>
                                        </motion.div>
                                        <h4 style={{ margin: '10px 0 2px', fontSize: '1.3rem', fontWeight: 800, color: '#18181B', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>
                                            {user?.name || "Aura User"}
                                        </h4>
                                        <Badge
                                            sx={{
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
                                            border: '1px solid rgba(0, 0, 0, 0.04)',
                                            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.04)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            mb: 4
                                        }}>
                                            <Box sx={{
                                                p: 3,
                                                borderRadius: '22px',
                                                background: 'linear-gradient(135deg, rgba(230, 57, 70, 0.03) 0%, #FFFFFF 100%)',
                                                border: '1.5px solid rgba(230, 57, 70, 0.1)',
                                                boxShadow: '0 6px 20px rgba(230, 57, 70, 0.04)',
                                                mb: 2
                                            }}>
                                                <img
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=@${user?.username || (user?.email ? user.email.split('@')[0] : 'aura_user')}`}
                                                    alt="User QR Code"
                                                    style={{ width: '155px', height: '155px', borderRadius: '14px', display: 'block' }}
                                                />
                                            </Box>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#71717A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <QrCode2Icon style={{ fontSize: 16, color: '#E63946' }} /> Scan QR to quickly connect or view profile
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
                                            color: '#E63946',
                                            fontWeight: 800,
                                            height: '46px',
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
                                        <ContentCopyIcon style={{ fontSize: 15 }} /> Copy Handle
                                    </Button>
                                </motion.div>
                                <motion.div style={{ flex: 1 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Button
                                        onClick={() => setIsQrScannerOpen(false)}
                                        style={{
                                            width: '100%',
                                            background: '#18181B',
                                            color: '#FFFFFF',
                                            fontWeight: 800,
                                            height: '46px',
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
                <ModalOverlay backdropFilter="blur(8px)" bg="rgba(0, 0, 0, 0.4)" />
                <ModalContent
                    borderRadius="28px"
                    border="1px solid #ECE9E1"
                    bg="#FAF8F5"
                    p={4}
                    style={{
                        boxShadow: "0 15px 40px rgba(0, 0, 0, 0.15)",
                        maxWidth: "420px",
                        margin: "12px"
                    }}
                >
                    <ModalBody className="text-center py-4">
                        <Box
                            mx="auto"
                            w="50px"
                            h="50px"
                            borderRadius="50%"
                            bg="#FFF0EE"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            color="#DC2626"
                            mb={4}
                            style={{ boxShadow: "0 4px 12px rgba(220, 38, 38, 0.15)" }}
                        >
                            <i className="fas fa-sign-out-alt" style={{ fontSize: "20px" }}></i>
                        </Box>
                        <Text fontSize="1.35rem" fontWeight="800" color="#303633" mb={2}>
                            Confirm Log Out
                        </Text>
                        <Text fontSize="0.9rem" color="#707772" mb={6}>
                            Are you sure you want to end your current session? You will need to log in again to access your conversations.
                        </Text>
                        <Box display="flex" gap={3} justifyContent="center" width="100%">
                            <MDBBtn
                                onClick={() => setIsLogoutConfirmOpen(false)}
                                style={{
                                    flex: 1,
                                    background: '#EAEBE9',
                                    color: '#707772',
                                    fontWeight: 600,
                                    height: '46px',
                                    borderRadius: '12px',
                                    textTransform: 'none',
                                    boxShadow: 'none'
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
                                    history.push("/login");
                                }}
                                style={{
                                    flex: 1,
                                    background: '#DC2626',
                                    color: '#FFFFFF',
                                    fontWeight: 600,
                                    height: '46px',
                                    borderRadius: '12px',
                                    textTransform: 'none',
                                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)'
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