import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion';
import { Box, Text, VStack } from "@chakra-ui/layout"
import { Tooltip } from "@chakra-ui/tooltip";
import { Button } from "@chakra-ui/button";
import { BellIcon, ChevronDownIcon, EditIcon, CheckIcon, CloseIcon } from "@chakra-ui/icons";
import jsQR from 'jsqr';
import { Avatar } from '@chakra-ui/react'
import { useSelector } from 'react-redux';
import { useDisclosure, useToast } from "@chakra-ui/react";
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

    const onOpenDrawer = () => {
        internalOnOpenDrawer();
        if (externalOnOpenDrawer && typeof externalOnOpenDrawer === 'function') {
            try { externalOnOpenDrawer(); } catch (e) {}
        }
    };
    const user = useSelector(state => state.user);
    const notification = useSelector(state => state.notification);
    const chats = useSelector(state => state.chats);
    const userStatuses = useSelector(state => state.userStatuses) || {};
    const [search, setSearch] = useState("");
    const [searchResult, setSearchResult] = useState([]);
    const [allUsersCache, setAllUsersCache] = useState([]);
    const [drawerFilter, setDrawerFilter] = useState('all');
    const [friendIds, setFriendIds] = useState(new Set());
    const [sentRequestUserIds, setSentRequestUserIds] = useState(new Set());
    const [pendingReceivedRequests, setPendingReceivedRequests] = useState([]);
    const [requestLoadingId, setRequestLoadingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingChat, setLoadingChat] = useState(false);
    const [isAvatarStudioOpen, setIsAvatarStudioOpen] = useState(false);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
    const [themeMode, setThemeMode] = useState(() => localStorage.getItem('aura_theme') || 'pearl');

    useEffect(() => {
        if (themeMode === 'midnight') {
            document.body.classList.add('theme-midnight');
        } else {
            document.body.classList.remove('theme-midnight');
        }
        localStorage.setItem('aura_theme', themeMode);
    }, [themeMode]);

    const toggleThemeMode = () => {
        setThemeMode(prev => prev === 'pearl' ? 'midnight' : 'pearl');
    };
    const dispatch = useDispatch();
    const searchContainerRef = useRef(null);
    const drawerSearchInputRef = useRef(null);

    const fetchFriendData = async () => {
        try {
            const token = getJwtToken();
            if (!token) return;
            const config = { headers: { Authorization: "Bearer " + token } };

            // 1. Fetch friend IDs
            try {
                const { data: fData } = await axios.get('/api/user/friends/ids', config);
                if (Array.isArray(fData)) {
                    setFriendIds(new Set(fData.map(String)));
                } else if (fData && typeof fData === 'object') {
                    setFriendIds(new Set(Object.values(fData).map(String)));
                }
            } catch (e) {}

            // 2. Fetch sent pending requests
            try {
                const { data: sData } = await axios.get('/api/chat/requests/sent', config);
                if (Array.isArray(sData)) {
                    const ids = sData.map(r => String(r.receiver?.id || r.receiver?._id || '')).filter(Boolean);
                    setSentRequestUserIds(new Set(ids));
                }
            } catch (e) {}

            // 3. Fetch incoming pending requests
            try {
                const { data: pData } = await axios.get('/api/chat/requests/pending', config);
                if (Array.isArray(pData)) {
                    setPendingReceivedRequests(pData);
                }
            } catch (e) {}
        } catch (e) {
            console.warn("Could not fetch friend data", e);
        }
    };

    const handleSendFriendRequest = async (targetUser) => {
        if (!targetUser) return;
        const targetId = String(targetUser._id || targetUser.id || targetUser.publicId || targetUser.userId || targetUser.username || targetUser.email || '');
        const targetName = targetUser.name || targetUser.displayName || targetUser.username || targetUser.email || 'User';
        const targetPayload = targetId || targetUser.email || targetUser.username;
        if (!targetPayload) return;

        try {
            setRequestLoadingId(targetId || targetPayload);
            const token = getJwtToken();
            if (!token) {
                toast.error("Please login again to send friend requests.");
                return;
            }
            const config = { headers: { Authorization: "Bearer " + token } };
            await axios.post('/api/chat/request/send', { 
                targetUserId: targetPayload,
                userId: targetPayload,
                _id: targetPayload,
                publicId: targetUser.publicId ? String(targetUser.publicId) : undefined,
                username: targetUser.username,
                email: targetUser.email
            }, config);

            setSentRequestUserIds(prev => {
                const next = new Set(prev);
                if (targetId) next.add(targetId);
                if (targetUser.id) next.add(String(targetUser.id));
                if (targetUser._id) next.add(String(targetUser._id));
                if (targetUser.publicId) next.add(String(targetUser.publicId));
                if (targetUser.username) next.add(String(targetUser.username));
                return next;
            });

            toast.success(`✨ Friend request sent to ${targetName} successfully! 📨`, {
                position: "bottom-center",
                autoClose: 3000
            });
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to send friend request";
            toast.error(msg, { position: "bottom-center", autoClose: 3000 });
        } finally {
            setRequestLoadingId(null);
        }
    };

    const handleRespondFriendRequest = async (requestId, action, senderUser) => {
        try {
            const token = getJwtToken();
            if (!token) return;
            const config = { headers: { Authorization: "Bearer " + token } };
            const { data: newChat } = await axios.post(`/api/chat/request/respond?requestId=${requestId}&action=${action}`, {}, config);
            
            // Remove from pending received requests
            setPendingReceivedRequests(prev => prev.filter(r => String(r.id || r._id) !== String(requestId)));

            if (action === 'ACCEPT') {
                const sId = String(senderUser?._id || senderUser?.id);
                if (sId) {
                    setFriendIds(prev => new Set([...prev, sId]));
                }
                toast.success(`🤝 You and ${senderUser?.name || 'User'} are now friends!`, {
                    position: "bottom-center",
                    autoClose: 2500
                });
                if (newChat) {
                    dispatch(setChats([newChat, ...(chats || []).filter(c => String(c.id || c._id) !== String(newChat.id || newChat._id))]));
                    dispatch(setSelectedChat(newChat));
                    onCloseDrawer();
                }
            } else {
                toast.info("Friend request declined", { position: "bottom-center", autoClose: 2000 });
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to process friend request");
        }
    };

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
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                onOpenDrawer();
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

    const hiddenCanvasRef = useRef(null);

    useEffect(() => {
        if (isQrScannerOpen && qrTab === 'scan' && cameraActive && videoRef.current) {
            let detector = null;
            if ('BarcodeDetector' in window) {
                try {
                    detector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13', 'data_matrix', 'aztec', 'pdf417'] });
                } catch (e) {}
            }

            let isProcessing = false;

            scanIntervalRef.current = setInterval(async () => {
                if (isProcessing) return;
                try {
                    const video = videoRef.current;
                    if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
                        isProcessing = true;
                        let foundCode = null;

                        // 1. Try Native BarcodeDetector if available
                        if (detector) {
                            try {
                                const barcodes = await detector.detect(video);
                                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                                    foundCode = barcodes[0].rawValue;
                                }
                            } catch (err) {}
                        }

                        // 2. High-speed jsQR fallback for guaranteed cross-browser auto-scanning
                        if (!foundCode && typeof jsQR === 'function') {
                            if (!hiddenCanvasRef.current) {
                                hiddenCanvasRef.current = document.createElement('canvas');
                            }
                            const canvas = hiddenCanvasRef.current;
                            const ctx = canvas.getContext('2d', { willReadFrequently: true });
                            if (ctx) {
                                canvas.width = video.videoWidth;
                                canvas.height = video.videoHeight;
                                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                                    inversionAttempts: 'dontInvert',
                                });
                                if (code && code.data && code.data.trim()) {
                                    foundCode = code.data.trim();
                                }
                            }
                        }

                        if (foundCode && foundCode.trim()) {
                            if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
                            setScannedUsername(foundCode.trim());
                            handleScanQrCode(foundCode.trim());
                        }
                    }
                } catch (e) {
                } finally {
                    isProcessing = false;
                }
            }, 250);
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

    const fetchUsers = async (term = "") => {
        let cleanTerm = (term || "").trim();
        if (cleanTerm.startsWith('@')) {
            cleanTerm = cleanTerm.substring(1);
        }
        
        // Instant Client-Side filtering if cache is populated
        if (cleanTerm && allUsersCache.length > 0) {
            const queryLower = cleanTerm.toLowerCase();
            const localMatches = allUsersCache.filter(u => {
                if (!u) return false;
                const name = (u.name || "").toLowerCase();
                const username = (u.username || "").toLowerCase();
                const email = (u.email || "").toLowerCase();
                return name.includes(queryLower) || username.includes(queryLower) || email.includes(queryLower);
            });
            if (localMatches.length > 0) {
                setSearchResult(localMatches);
                setSearchError('');
            }
        }

        try {
            const token = getJwtToken();
            if (!token) return;
            if (!cleanTerm) setLoading(true);
            const config = {
                headers: {
                    Authorization: "Bearer " + token,
                },
            };
            const endpoint = cleanTerm
                ? `/api/user/all-users?search=${encodeURIComponent(cleanTerm)}`
                : `/api/user/all-users`;
            const { data } = await axios.get(endpoint, config);
            setLoading(false);
            
            let list = [];
            if (Array.isArray(data)) {
                list = data;
            } else if (data && typeof data === 'object' && Array.isArray(data.users)) {
                list = data.users;
            }

            if (!cleanTerm && list.length > 0) {
                setAllUsersCache(list);
            }

            if (cleanTerm) {
                // Merge with client-side matches to ensure 100% match guarantee
                const queryLower = cleanTerm.toLowerCase();
                const localMatches = (allUsersCache || []).filter(u => {
                    if (!u) return false;
                    const name = (u.name || "").toLowerCase();
                    const username = (u.username || "").toLowerCase();
                    const email = (u.email || "").toLowerCase();
                    return name.includes(queryLower) || username.includes(queryLower) || email.includes(queryLower);
                });
                
                const mergedMap = new Map();
                [...list, ...localMatches].forEach(u => {
                    const id = String(u.id || u._id || u.email);
                    if (id && !mergedMap.has(id)) {
                        mergedMap.set(id, u);
                    }
                });
                const finalMerged = Array.from(mergedMap.values());
                setSearchResult(finalMerged);

                if (finalMerged.length === 0) {
                    setSearchError(`No users found matching "${cleanTerm}"`);
                } else {
                    setSearchError('');
                }
            } else {
                setSearchResult(list);
                setSearchError('');
            }
        } catch (err) {
            setLoading(false);
            if (handleAuthError(err, history)) return;
        }
    };

    useEffect(() => {
        fetchFriendData();
    }, []);

    useEffect(() => {
        if (isOpenDrawer) {
            fetchFriendData();
            fetchUsers(search);
        }
    }, [isOpenDrawer]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isOpenDrawer || (search && search.trim().length > 0)) {
                fetchUsers(search);
            }
        }, 220);

        return () => clearTimeout(timer);
    }, [search, isOpenDrawer]);

    const handleSearch = async (e) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        fetchUsers(search);
    };

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
        const targetId = targetUser._id || targetUser.id || targetUser.publicId || targetUser.userId || targetUser.username || targetUser.email;
        const myId = user?._id || user?.id || user?.userId;

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
                await axios.post("/api/chat/request/send", { 
                    targetUserId: String(targetId),
                    userId: String(targetId),
                    _id: String(targetId),
                    publicId: targetUser.publicId ? String(targetUser.publicId) : undefined,
                    username: targetUser.username,
                    email: targetUser.email
                }, config);
            } catch (e) {}

            setIsQrScannerOpen(false);
            setScannedUser(null);
            setScannedUsername('');
            toast.success(`Request Sent to @${targetUser.username || targetUser.name || 'user'}! Waiting for them to accept.`, {
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
                px={{ base: 3, sm: 4, md: 6 }}
                pt={{ base: "calc(var(--sat) + 8px)", md: "12px" }}
                pb={{ base: "8px", md: "12px" }}
                style={{
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    borderBottom: "1px solid rgba(23, 24, 39, 0.06)",
                    boxShadow: "0 8px 30px rgba(23, 24, 39, 0.03)"
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
                            background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 6px 18px rgba(91, 95, 239, 0.32)',
                            position: 'relative'
                        }}>
                            <Feather size={20} color="#FFFFFF" strokeWidth={2.2} />
                        </Box>
                        <Box display="block">
                            <h2 style={{
                                fontSize: "1.25rem",
                                fontWeight: 900,
                                letterSpacing: "-0.03em",
                                lineHeight: 1,
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                color: "#171827",
                                margin: 0
                            }}>AURA</h2>
                        </Box>
                    </motion.div>

                    {/* Living Pearl Search Bar — Desktop & Tablet */}
                    <Tooltip label="Search users by @username (⌘K)" hasArrow placement="bottom-start">
                        <Box ref={searchContainerRef} display={{ base: "none", sm: "block" }} style={{ flex: 1, maxWidth: '440px', position: 'relative' }}>
                            <Box
                                onClick={onOpenDrawer}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    background: '#F4F3EF',
                                    backdropFilter: 'blur(16px)',
                                    WebkitBackdropFilter: 'blur(16px)',
                                    border: '1px solid rgba(23, 24, 39, 0.06)',
                                    borderRadius: '16px',
                                    px: 3,
                                    height: '42px',
                                    cursor: 'pointer',
                                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                    boxShadow: '0 2px 8px rgba(23, 24, 39, 0.02)',
                                    '&:hover': {
                                        background: '#FFFFFF',
                                        borderColor: 'rgba(91, 95, 239, 0.35)',
                                        boxShadow: '0 4px 16px rgba(91, 95, 239, 0.08)',
                                        transform: 'translateY(-1px)'
                                    },
                                    '&:focus-within': {
                                        background: '#FFFFFF',
                                        borderColor: '#5B5FEF',
                                        boxShadow: '0 6px 24px rgba(91, 95, 239, 0.16), 0 0 0 3px rgba(91, 95, 239, 0.1)',
                                    }
                                }}
                            >
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    w="26px"
                                    h="26px"
                                    borderRadius="8px"
                                    bg="rgba(91, 95, 239, 0.1)"
                                    color="#5B5FEF"
                                    flexShrink={0}
                                >
                                    <Search size={14} strokeWidth={2.4} />
                                </Box>
                                <input
                                    type="text"
                                    placeholder="Search users or @username..."
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
                                        fontSize: '0.86rem',
                                        color: '#0F172A',
                                        fontWeight: 600,
                                        fontFamily: "'Outfit', 'Inter', sans-serif",
                                        letterSpacing: '-0.01em'
                                    }}
                                />
                                {search ? (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSearch('');
                                        }}
                                        style={{
                                            border: 'none',
                                            background: 'rgba(100, 116, 139, 0.12)',
                                            color: '#64748B',
                                            borderRadius: '50%',
                                            width: '20px',
                                            height: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            padding: 0,
                                            flexShrink: 0
                                        }}
                                    >
                                        ✕
                                    </button>
                                ) : (
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        gap={0.5}
                                        bg="rgba(148, 163, 184, 0.12)"
                                        border="1px solid rgba(226, 232, 240, 0.85)"
                                        borderRadius="6px"
                                        px={1.5}
                                        py={0.5}
                                        fontSize="0.68rem"
                                        fontWeight="700"
                                        color="#64748B"
                                        fontFamily="'Outfit', sans-serif"
                                        flexShrink={0}
                                        letterSpacing="0.04em"
                                    >
                                        ⌘K
                                    </Box>
                                )}
                            </Box>

                            {/* Floating Live Instant Search Results Dropdown */}
                            {search && search.trim().length > 0 && searchResult && searchResult.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                    transition={{ duration: 0.18 }}
                                    style={{
                                        position: 'absolute',
                                        top: '48px',
                                        left: 0,
                                        right: 0,
                                        background: '#FFFFFF',
                                        borderRadius: '20px',
                                        border: '1px solid rgba(23, 24, 39, 0.08)',
                                        boxShadow: '0 20px 50px rgba(23, 24, 39, 0.12), 0 0 20px rgba(91, 95, 239, 0.06)',
                                        padding: '8px',
                                        zIndex: 1000,
                                        maxHeight: '340px',
                                        overflowY: 'auto'
                                    }}
                                >
                                    <div style={{ padding: '6px 12px', fontSize: '0.72rem', fontWeight: 800, color: '#5B5FEF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        ✦ Matching Users ({searchResult.length})
                                    </div>
                                    {(searchResult || []).filter(u => u && (u.id || u._id)).map((u) => (
                                        <Box
                                            key={u.id || u._id}
                                            onClick={() => {
                                                onOpenDrawer();
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '8px 12px',
                                                borderRadius: '14px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                            _hover={{
                                                background: 'rgba(91, 95, 239, 0.08)',
                                                transform: 'translateX(3px)'
                                            }}
                                        >
                                            <Box display="flex" alignItems="center" gap={3}>
                                                <Avatar size="sm" name={u?.name || 'Aura User'} src={u?.pic} />
                                                <Box textAlign="left">
                                                    <Text fontWeight="800" fontSize="0.88rem" color="#0F172A" m={0} fontFamily="'Outfit', sans-serif">
                                                        {u?.name || 'User'}
                                                    </Text>
                                                    <Text fontWeight="700" fontSize="0.75rem" color="#5B5FEF" m={0} fontFamily="'Plus Jakarta Sans', sans-serif">
                                                        @{u?.username || (u?.email ? u.email.split('@')[0] : 'user')}
                                                    </Text>
                                                </Box>
                                            </Box>
                                            <Badge bg="linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)" color="#FFFFFF" borderRadius="99px" px={3} py={1} fontSize="0.72rem" fontWeight="800" boxShadow="0 2px 8px rgba(91, 95, 239, 0.25)">
                                                + Add User
                                            </Badge>
                                        </Box>
                                    ))}
                                </motion.div>
                            )}
                        </Box>
                    </Tooltip>
                </div>

                <div className="d-flex align-items-center gap-2">
                    {/* Mobile Search Quick Action */}
                    <Box display={{ base: "block", sm: "none" }}>
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onOpenDrawer}
                            style={{
                                background: '#FFFFFF',
                                border: '1px solid #E5E7EB',
                                borderRadius: '12px',
                                width: '38px',
                                height: '38px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                                color: '#171827'
                            }}
                            aria-label="Search"
                        >
                            <Search size={18} />
                        </motion.button>
                    </Box>

                    {/* QR Code Button */}
                    <Tooltip label="Scan QR Code to Add User" hasArrow placement="top">
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.08, y: -1 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => setIsQrScannerOpen(true)}
                            style={{
                                background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '12px',
                                width: '38px',
                                height: '38px',
                                minWidth: '38px',
                                cursor: 'pointer',
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(91, 95, 239, 0.32)',
                                touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'transparent'
                            }}
                        >
                            <QrCodeScannerIcon style={{ fontSize: '18px', color: '#FFFFFF' }} />
                        </motion.button>
                    </Tooltip>

                    {/* Notification Bell Menu */}
                    <Menu isOpen={isNotifOpen} onOpen={onNotifOpen} onClose={onNotifClose}>
                        <MenuButton
                            as={motion.button}
                            className="aura-icon-btn"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            _focus={{ boxShadow: "none", outline: "none" }}
                            _focusVisible={{ boxShadow: "none", outline: "none" }}
                            _active={{ boxShadow: "none", outline: "none" }}
                            style={{
                                background: '#FFFFFF',
                                border: '1px solid #E5E7EB',
                                borderRadius: '12px',
                                width: '38px',
                                height: '38px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                            }}
                        >
                            <BellIcon fontSize="1.2rem" color="#171827" />
                            {((notification && notification.length > 0) || (pendingReceivedRequests && pendingReceivedRequests.length > 0)) && (
                                <span
                                    style={{
                                        position: 'absolute',
                                        top: '-4px',
                                        right: '-4px',
                                        background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
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
                                        boxShadow: '0 3px 8px rgba(91, 95, 239, 0.4)'
                                    }}
                                >
                                    {(notification?.length || 0) + (pendingReceivedRequests?.length || 0)}
                                </span>
                            )}
                        </MenuButton>
                        <MenuList
                            bg="#FFFFFF"
                            borderRadius="24px"
                            p={3}
                            minW="340px"
                            maxW="400px"
                            style={{
                                boxShadow: "0 25px 60px rgba(15, 23, 42, 0.14), 0 0 1px rgba(15, 23, 42, 0.08)",
                                border: "1.5px solid rgba(23, 24, 39, 0.07)",
                                zIndex: 9999,
                                overflow: "hidden"
                            }}
                        >
                            {/* Popover Header with Mark All Read Action */}
                            <Box px={2} py={1.5} mb={2} borderBottom="1px solid #F1F5F9" display="flex" alignItems="center" justifyContent="space-between">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '1rem' }}>🔔</span>
                                    <Text fontWeight="900" fontSize="0.92rem" color="#0F172A" margin={0} fontFamily="'Plus Jakarta Sans', sans-serif">
                                        Notifications ({(notification?.length || 0) + (pendingReceivedRequests?.length || 0)})
                                    </Text>
                                </div>
                                {((notification && notification.length > 0) || (pendingReceivedRequests && pendingReceivedRequests.length > 0)) && (
                                    <button
                                        type="button"
                                        style={{
                                            background: 'rgba(91, 95, 239, 0.1)',
                                            border: 'none',
                                            color: '#5B5FEF',
                                            fontSize: '0.72rem',
                                            fontWeight: 800,
                                            padding: '4px 10px',
                                            borderRadius: '99px',
                                            cursor: 'pointer',
                                            fontFamily: "'Plus Jakarta Sans', sans-serif"
                                        }}
                                        onClick={() => {
                                            dispatch(setNotification([]));
                                            toast.success('All notifications marked as read', { autoClose: 1500, hideProgressBar: true });
                                        }}
                                    >
                                        ✓ Mark Read
                                    </button>
                                )}
                            </Box>

                            {/* ── Pending Orbit Requests Section ── */}
                            {pendingReceivedRequests && pendingReceivedRequests.length > 0 && (
                                <Box p={1} mb={2} borderBottom="1px solid #F1F5F9">
                                    <Box display="flex" alignItems="center" justifyContent="space-between" px={1} mb={2}>
                                        <Text fontSize="0.72rem" fontWeight="900" color="#5B5FEF" textTransform="uppercase" letterSpacing="0.08em" m={0} fontFamily="'Plus Jakarta Sans', sans-serif">
                                            ✦ Orbit Requests ({pendingReceivedRequests.length})
                                        </Text>
                                        <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#5B5FEF', background: 'rgba(91, 95, 239, 0.1)', padding: '2px 8px', borderRadius: '99px' }}>
                                            Pending
                                        </span>
                                    </Box>
                                    <Box display="flex" flexDirection="column" gap={2}>
                                        {pendingReceivedRequests.map((req) => {
                                            const senderUser = req.sender;
                                            const sId = String(senderUser?._id || senderUser?.id);
                                            const sOnline = userStatuses[sId]?.isOnline || senderUser?.isOnline || senderUser?.online;

                                            return (
                                                <motion.div
                                                    key={req.id || req._id}
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    whileHover={{ scale: 1.01 }}
                                                >
                                                    <Box
                                                        p={2.5}
                                                        bg="#F8FAFC"
                                                        borderRadius="18px"
                                                        border="1px solid rgba(23, 24, 39, 0.06)"
                                                        display="flex"
                                                        flexDirection="column"
                                                        gap={2}
                                                    >
                                                        <Box display="flex" alignItems="center" gap={2.5}>
                                                            <Avatar size="sm" name={senderUser?.name} src={senderUser?.pic} style={{ border: '2px solid #FFFFFF', boxShadow: '0 2px 8px rgba(91, 95, 239, 0.2)' }} />
                                                            <Box textAlign="left" style={{ flex: 1, overflow: 'hidden' }}>
                                                                <Text fontWeight="900" fontSize="0.88rem" color="#0F172A" m={0} fontFamily="'Plus Jakarta Sans', sans-serif" isTruncated>
                                                                    {senderUser?.name || 'User'}
                                                                </Text>
                                                                <Text fontSize="0.72rem" color="#5B5FEF" fontWeight="700" m={0} fontFamily="'Plus Jakarta Sans', sans-serif" isTruncated>
                                                                    @{senderUser?.username || (senderUser?.email ? senderUser.email.split('@')[0] : 'user')}
                                                                </Text>
                                                            </Box>
                                                        </Box>
                                                        <Box display="flex" gap={2} alignItems="center">
                                                            <Button
                                                                size="xs"
                                                                onClick={() => handleRespondFriendRequest(req.id || req._id, 'ACCEPT', senderUser)}
                                                                style={{
                                                                    flex: 1,
                                                                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                                                    color: '#FFFFFF',
                                                                    borderRadius: '99px',
                                                                    fontWeight: 800,
                                                                    fontSize: '0.75rem',
                                                                    border: 'none',
                                                                    height: '30px',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                ✓ Accept
                                                            </Button>
                                                            <Button
                                                                size="xs"
                                                                onClick={() => handleRespondFriendRequest(req.id || req._id, 'REJECT', senderUser)}
                                                                style={{
                                                                    background: '#FFFFFF',
                                                                    color: '#64748B',
                                                                    borderRadius: '99px',
                                                                    fontWeight: 700,
                                                                    fontSize: '0.75rem',
                                                                    border: '1px solid #E2E8F0',
                                                                    height: '30px',
                                                                    padding: '0 12px',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                Decline
                                                            </Button>
                                                        </Box>
                                                    </Box>
                                                </motion.div>
                                            );
                                        })}
                                    </Box>
                                </Box>
                            )}

                            {/* ── Empty Notifications State ── */}
                            {(!notification || notification.length === 0) && (!pendingReceivedRequests || pendingReceivedRequests.length === 0) && (
                                <Box py={6} px={3} textAlign="center">
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                        style={{ fontSize: "32px", display: "block", marginBottom: "8px" }}
                                    >
                                        ✨
                                    </motion.div>
                                    <Text fontSize="0.88rem" fontWeight="800" color="#0F172A" margin={0} fontFamily="'Plus Jakarta Sans', sans-serif">
                                        All caught up!
                                    </Text>
                                    <Text fontSize="0.74rem" color="#94A3B8" fontWeight="600" mt={1} margin={0} fontFamily="'Plus Jakarta Sans', sans-serif">
                                        No unread notifications right now.
                                    </Text>
                                </Box>
                            )}

                            {/* ── Live Message Notifications List ── */}
                            <Box maxH="280px" overflowY="auto" display="flex" flexDirection="column" gap={1}>
                                {notification && notification.map((notif, idx) => {
                                    const senderName = notif.sender?.name || notif.senderName || (!notif.chat?.isGroupChat ? getSender(user, notif.chat?.users) : notif.chat?.chatName) || 'Someone';
                                    const senderPic = notif.sender?.pic || notif.senderPic || (!notif.chat?.isGroupChat ? getPicture(user, notif.chat?.users) : '');
                                    const isGroup = notif.chat?.isGroupChat;
                                    const content = notif.content || '';

                                    let preview = content;
                                    if (content.startsWith('data:image') || content.startsWith('[img]')) {
                                        preview = '🖼️ Shared a photo';
                                    } else if (content.startsWith('[voice]')) {
                                        preview = '🎙️ Sent a voice note';
                                    } else if (content.startsWith('[video_note]')) {
                                        preview = '📹 Sent a video note';
                                    } else if (content.startsWith('[doc]')) {
                                        preview = '📄 Sent a document';
                                    } else if (content.startsWith('[call]')) {
                                        preview = '📞 Call notification';
                                    }

                                    return (
                                        <motion.div
                                            key={notif._id || notif.id || idx}
                                            whileHover={{ scale: 1.015, x: 2 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <MenuItem
                                                bg="#FFFFFF"
                                                _hover={{ bg: "#F8FAFC" }}
                                                borderRadius="16px"
                                                p={2.5}
                                                border="1px solid rgba(226, 232, 240, 0.7)"
                                                onClick={() => {
                                                    if (notif.chat) {
                                                        dispatch(setSelectedChat(notif.chat));
                                                        dispatch(setNotification(notification.filter((n) => n !== notif)));
                                                    }
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', overflow: 'hidden' }}>
                                                    <Avatar size="sm" name={senderName} src={senderPic} style={{ border: '1.5px solid #5B5FEF', flexShrink: 0 }} />
                                                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', textAlign: 'left' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A', fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                                                                {isGroup ? notif.chat.chatName : senderName}
                                                            </span>
                                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#5B5FEF', boxShadow: '0 0 6px #5B5FEF' }} />
                                                        </div>
                                                        <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                                            {preview}
                                                        </span>
                                                    </div>
                                                </div>
                                            </MenuItem>
                                        </motion.div>
                                    );
                                })}
                            </Box>
                        </MenuList>
                    </Menu>

                    {/* Profile Menu Button */}
                    <Menu>
                        <MenuButton
                            as={motion.button}
                            className="aura-icon-btn"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            _focus={{ boxShadow: "none", outline: "none" }}
                            _focusVisible={{ boxShadow: "none", outline: "none" }}
                            _active={{ boxShadow: "none", outline: "none" }}
                            style={{
                                background: "transparent",
                                border: "none",
                                padding: 0,
                                cursor: "pointer",
                                borderRadius: "50%"
                            }}
                        >
                            <Avatar
                                size="sm"
                                name={user && user.name}
                                src={(!user?.pic || user?.pic.includes("icon-library.com")) ? undefined : user.pic}
                                fontWeight="800"
                                style={{
                                    border: "1.5px solid #5B5FEF",
                                    width: "38px",
                                    height: "38px",
                                    boxShadow: "0 2px 10px rgba(91, 95, 239, 0.25)"
                                }}
                            />
                        </MenuButton>
                        <MenuList
                            bg="#FFFFFF"
                            borderColor="rgba(23, 24, 39, 0.08)"
                            color="#171827"
                            borderRadius="20px"
                            p={1.5}
                            style={{
                                boxShadow: "0 16px 45px rgba(23, 24, 39, 0.08)",
                                border: "1px solid rgba(23, 24, 39, 0.08)"
                            }}
                        >
                            <MenuItem
                                bg="#FFFFFF"
                                color="#171827"
                                borderRadius="14px"
                                fontFamily="'Plus Jakarta Sans', sans-serif"
                                fontWeight="700"
                                _hover={{ bg: "rgba(91, 95, 239, 0.08)", color: "#5B5FEF" }}
                                onClick={onOpen}
                                style={{ transition: "all 0.15s ease", padding: "10px 14px" }}
                            >
                                <i className="fa fa-user me-3" style={{ color: "#5B5FEF" }} aria-hidden="true"></i> Profile
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
            {/* ── ADVANCED LUXURY SEARCH & DISCOVERY DRAWER ── */}
            <Drawer
                isOpen={isOpenDrawer}
                placement='left'
                onClose={onCloseDrawer}
                size="md"
            >
                <DrawerOverlay style={{ backdropFilter: "blur(20px)", background: "rgba(23, 24, 39, 0.45)" }} />
                <DrawerContent style={{
                    background: "#FFFFFF",
                    color: "#171827",
                    borderRight: "1px solid rgba(23, 24, 39, 0.08)",
                    boxShadow: "0 30px 80px rgba(23, 24, 39, 0.15), 0 0 40px rgba(91, 95, 239, 0.06)",
                    maxWidth: "460px",
                    display: "flex",
                    flexDirection: "column"
                }}>
                    {loadingChat && (<Progress size='xs' height='3.5px' colorScheme='purple' isIndeterminate bg="rgba(91, 95, 239, 0.15)" />)}
                    
                    {/* ── DRAWER HEADER ── */}
                    <DrawerHeader style={{
                        borderBottom: "1px solid rgba(23, 24, 39, 0.06)",
                        padding: "22px 24px 18px",
                        background: "linear-gradient(180deg, rgba(244, 243, 239, 0.6) 0%, rgba(255, 255, 255, 0) 100%)"
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <motion.div
                                    whileHover={{ rotate: 10, scale: 1.08 }}
                                    transition={{ type: 'spring', stiffness: 350, damping: 15 }}
                                    style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '16px',
                                        background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 8px 20px rgba(91, 95, 239, 0.28)',
                                        flexShrink: 0
                                    }}
                                >
                                    <Search size={22} color="#FFFFFF" strokeWidth={2.5} />
                                </motion.div>
                                <div>
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        background: 'rgba(91, 95, 239, 0.1)',
                                        color: '#5B5FEF',
                                        fontSize: '0.68rem',
                                        fontWeight: 900,
                                        letterSpacing: '0.12em',
                                        textTransform: 'uppercase',
                                        padding: '2px 8px',
                                        borderRadius: '99px',
                                        marginBottom: '4px'
                                    }}>
                                        ✦ Aura Network
                                    </div>
                                    <h3 style={{
                                        margin: 0,
                                        fontSize: "1.3rem",
                                        fontWeight: 900,
                                        color: "#171827",
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                        letterSpacing: "-0.02em",
                                        lineHeight: 1.15
                                    }}>
                                        Find & Connect
                                    </h3>
                                </div>
                            </div>
                            
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onCloseDrawer}
                                style={{
                                    borderRadius: "50%",
                                    border: "1px solid rgba(23, 24, 39, 0.08)",
                                    width: "34px",
                                    height: "34px",
                                    color: "#727486",
                                    background: "#FFFFFF",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    fontWeight: "bold",
                                    boxShadow: "0 2px 8px rgba(23, 24, 39, 0.03)",
                                    transition: "all 0.15s ease",
                                    padding: 0
                                }}
                                aria-label="Close"
                            >
                                ✕
                            </motion.button>
                        </div>
                    </DrawerHeader>

                    {/* ── DRAWER BODY ── */}
                    <DrawerBody px={4} py={3} display="flex" flexDirection="column" gap={3} style={{ flex: 1, overflow: 'hidden' }}>
                        {/* ── SEARCH INPUT BAR ── */}
                        <form onSubmit={handleSearch} style={{ width: '100%', margin: 0 }}>
                            <Box style={{ position: 'relative', width: '100%' }}>
                                <Search
                                    size={20}
                                    color="#5B5FEF"
                                    style={{
                                        position: 'absolute',
                                        left: '18px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        zIndex: 2,
                                        pointerEvents: 'none'
                                    }}
                                />
                                <Input
                                    placeholder="Search by name, @username, or email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    bg="#FFFFFF"
                                    color="#171827"
                                    pl="50px"
                                    pr={search ? "46px" : "18px"}
                                    h="52px"
                                    fontWeight="600"
                                    fontFamily="'Plus Jakarta Sans', sans-serif"
                                    fontSize="0.96rem"
                                    borderRadius="18px"
                                    style={{
                                        border: "1.5px solid rgba(23, 24, 39, 0.08)",
                                        boxShadow: "0 2px 10px rgba(23, 24, 39, 0.02)"
                                    }}
                                    _focus={{
                                        borderColor: "#5B5FEF",
                                        bg: "#FFFFFF",
                                        boxShadow: "0 0 0 3.5px rgba(91, 95, 239, 0.15), 0 8px 25px rgba(91, 95, 239, 0.1)"
                                    }}
                                />
                                {search && (
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setSearch('')}
                                        style={{
                                            position: 'absolute',
                                            right: '16px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            border: 'none',
                                            background: 'rgba(100, 116, 139, 0.14)',
                                            color: '#727486',
                                            borderRadius: '50%',
                                            width: '24px',
                                            height: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            padding: 0,
                                            zIndex: 2
                                        }}
                                    >
                                        ✕
                                    </motion.button>
                                )}
                            </Box>
                        </form>

                        {/* ── FILTER PILLS BAR ── */}
                        <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '2px 2px' }}>
                            <Box style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                                <button
                                    type="button"
                                    onClick={() => setDrawerFilter('all')}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '99px',
                                        fontSize: '0.76rem',
                                        fontWeight: 800,
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                        border: drawerFilter === 'all' ? 'none' : '1px solid rgba(23, 24, 39, 0.08)',
                                        background: drawerFilter === 'all' ? 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)' : '#FFFFFF',
                                        color: drawerFilter === 'all' ? '#FFFFFF' : '#727486',
                                        cursor: 'pointer',
                                        boxShadow: drawerFilter === 'all' ? '0 4px 12px rgba(91, 95, 239, 0.28)' : 'none',
                                        transition: 'all 0.18s ease',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    ✦ All
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDrawerFilter('friends')}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '99px',
                                        fontSize: '0.76rem',
                                        fontWeight: 800,
                                        fontFamily: "'Outfit', sans-serif",
                                        border: drawerFilter === 'friends' ? 'none' : '1px solid rgba(226, 232, 240, 0.9)',
                                        background: drawerFilter === 'friends' ? 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' : '#FFFFFF',
                                        color: drawerFilter === 'friends' ? '#FFFFFF' : '#64748B',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        boxShadow: drawerFilter === 'friends' ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none',
                                        transition: 'all 0.18s ease',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <span>⭐ Friends</span>
                                    {friendIds.size > 0 && (
                                        <span style={{
                                            background: drawerFilter === 'friends' ? 'rgba(255,255,255,0.25)' : 'rgba(139, 92, 246, 0.12)',
                                            color: drawerFilter === 'friends' ? '#FFFFFF' : '#8B5CF6',
                                            borderRadius: '99px',
                                            padding: '1px 6px',
                                            fontSize: '0.66rem'
                                        }}>
                                            {friendIds.size}
                                        </span>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDrawerFilter('online')}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '99px',
                                        fontSize: '0.76rem',
                                        fontWeight: 800,
                                        fontFamily: "'Outfit', sans-serif",
                                        border: drawerFilter === 'online' ? 'none' : '1px solid rgba(226, 232, 240, 0.9)',
                                        background: drawerFilter === 'online' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : '#FFFFFF',
                                        color: drawerFilter === 'online' ? '#FFFFFF' : '#64748B',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        boxShadow: drawerFilter === 'online' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                                        transition: 'all 0.18s ease',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: drawerFilter === 'online' ? '#FFFFFF' : '#10B981' }} />
                                    Online
                                </button>
                            </Box>
                            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#94A3B8', fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>
                                {(() => {
                                    const list = (searchResult || []).filter(u => u && (u.id || u._id || u.publicId || u.userId || u.username || u.email));
                                    const filtered = drawerFilter === 'online'
                                        ? list.filter(u => {
                                            const tId = String(u.id || u._id || u.publicId || '');
                                            return Boolean(userStatuses[tId]?.isOnline || u.isOnline || u.online);
                                        })
                                        : drawerFilter === 'friends'
                                        ? list.filter(u => {
                                            const tId = String(u._id || u.id || u.publicId || '');
                                            return friendIds.has(tId) || (u.id && friendIds.has(String(u.id))) || (u._id && friendIds.has(String(u._id))) || (u.publicId && friendIds.has(String(u.publicId)));
                                        })
                                        : list;
                                    return `${filtered.length} found`;
                                })()}
                            </span>
                        </Box>

                        {searchError && (
                            <Box style={{
                                padding: '10px 14px',
                                background: '#FEF2F2',
                                color: '#DC2626',
                                borderRadius: '14px',
                                border: '1px solid #FECACA',
                                textAlign: 'center',
                                fontSize: '0.84rem',
                                fontWeight: 700,
                                fontFamily: "'Outfit', sans-serif"
                            }}>
                                ❌ {searchError}
                            </Box>
                        )}

                        {/* ── USER LIST CONTAINER ── */}
                        {loading ? (
                            <Box py={4}><ChatLoading /></Box>
                        ) : (() => {
                            const validUsers = (searchResult || []).filter(u => u && (u.id || u._id || u.publicId || u.userId || u.username || u.email));
                            const displayedUsers = drawerFilter === 'online'
                                ? validUsers.filter(u => {
                                    const tId = String(u.id || u._id || u.publicId || '');
                                    return Boolean(userStatuses[tId]?.isOnline || u.isOnline || u.online);
                                })
                                : drawerFilter === 'friends'
                                ? validUsers.filter(u => {
                                    const tId = String(u._id || u.id || u.publicId || '');
                                    return friendIds.has(tId) || (u.id && friendIds.has(String(u.id))) || (u._id && friendIds.has(String(u._id))) || (u.publicId && friendIds.has(String(u.publicId)));
                                })
                                : validUsers;

                            if (displayedUsers.length === 0) {
                                return (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.2 }}
                                        style={{
                                            textAlign: 'center',
                                            padding: '40px 20px',
                                            background: 'rgba(248, 250, 252, 0.7)',
                                            borderRadius: '24px',
                                            border: '1.5px dashed rgba(226, 232, 240, 0.9)',
                                            marginTop: '10px'
                                        }}
                                    >
                                        <Box style={{
                                            margin: '0 auto 14px',
                                            width: '54px',
                                            height: '54px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, rgba(91, 95, 239, 0.15) 0%, rgba(128, 103, 232, 0.05) 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#5B5FEF',
                                            boxShadow: '0 4px 14px rgba(91, 95, 239, 0.15)'
                                        }}>
                                            <Search size={24} />
                                        </Box>
                                        <Text fontWeight="800" fontSize="1.05rem" color="#171827" fontFamily="'Plus Jakarta Sans', sans-serif" mb={1}>
                                            {drawerFilter === 'online' ? "No Users Online Right Now" : drawerFilter === 'friends' ? "No Friends In Search" : "No users found"}
                                        </Text>
                                        <Text fontSize="0.84rem" color="#727486" fontFamily="'Plus Jakarta Sans', sans-serif" maxW="280px" mx="auto" lineHeight="1.5">
                                            {search.trim()
                                                ? `We couldn't find anyone matching "${search.trim()}". Try typing their exact @username or full name.`
                                                : drawerFilter === 'friends'
                                                ? "You have not added any friends yet. Search users and click '+ Add Friend'!"
                                                : "Type a name or username in the search bar above to find people."}
                                        </Text>
                                    </motion.div>
                                );
                            }

                            return (
                                <Box display="flex" flexDirection="column" gap="10px" overflowY="auto" flex="1" pr={1} pb={2}>
                                    {displayedUsers.map((u, idx) => {
                                        const targetId = String(u._id || u.id || u.publicId || u.userId || u.username || u.email || '');
                                        const targetEmail = (u.email || '').toLowerCase();
                                        const targetUsername = (u.username || '').toLowerCase();
                                        const isMe = Boolean(
                                            (user?._id && String(user._id || user.id) === targetId) ||
                                            (user?.email && targetEmail && user.email.toLowerCase() === targetEmail) ||
                                            (user?.username && targetUsername && user.username.toLowerCase() === targetUsername)
                                        );
                                        const isFriend = friendIds.has(targetId) || (u.id && friendIds.has(String(u.id))) || (u._id && friendIds.has(String(u._id))) || (u.publicId && friendIds.has(String(u.publicId)));
                                        const isSentRequest = sentRequestUserIds.has(targetId) || (u.id && sentRequestUserIds.has(String(u.id))) || (u._id && sentRequestUserIds.has(String(u._id))) || (u.publicId && sentRequestUserIds.has(String(u.publicId))) || (u.username && sentRequestUserIds.has(String(u.username)));
                                        const incomingReq = (pendingReceivedRequests || []).find(r => {
                                            const sId = String(r.sender?.id || r.sender?._id || '');
                                            return sId === targetId || (u.id && sId === String(u.id)) || (u._id && sId === String(u._id)) || (u.publicId && sId === String(u.publicId));
                                        });
                                        const statusObj = userStatuses[targetId] || (u.id ? userStatuses[String(u.id)] : null) || (u._id ? userStatuses[String(u._id)] : null);
                                        const isOnlineNow = statusObj != null ? statusObj.isOnline : Boolean(u.isOnline || u.online);
                                        const isRequestLoading = requestLoadingId === targetId || (u.id && requestLoadingId === String(u.id)) || (u._id && requestLoadingId === String(u._id));

                                        return (
                                            <motion.div
                                                key={targetId}
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.22, delay: idx * 0.035 }}
                                                whileHover={{ scale: 1.015, y: -2 }}
                                                whileTap={{ scale: 0.985 }}
                                            >
                                                <Box
                                                    onClick={() => {
                                                        if (isMe) return;
                                                        if (isFriend) {
                                                            accessChat(targetId);
                                                        } else if (incomingReq) {
                                                            handleRespondFriendRequest(incomingReq.id || incomingReq._id, 'ACCEPT', u);
                                                        } else if (!isSentRequest) {
                                                            handleSendFriendRequest(u);
                                                        }
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '14px 16px',
                                                        borderRadius: '20px',
                                                        background: '#FFFFFF',
                                                        border: isMe
                                                            ? '1.5px solid rgba(91, 95, 239, 0.4)'
                                                            : isFriend
                                                            ? '1.5px solid rgba(128, 103, 232, 0.35)'
                                                            : isSentRequest
                                                            ? '1.5px solid rgba(91, 95, 239, 0.25)'
                                                            : '1px solid rgba(23, 24, 39, 0.08)',
                                                        boxShadow: isFriend
                                                            ? '0 4px 16px rgba(128, 103, 232, 0.08)'
                                                            : isSentRequest
                                                            ? '0 4px 16px rgba(91, 95, 239, 0.06)'
                                                            : '0 4px 16px rgba(23, 24, 39, 0.03)',
                                                        cursor: isMe ? 'default' : 'pointer',
                                                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                                                    }}
                                                    _hover={{
                                                        borderColor: '#5B5FEF',
                                                        boxShadow: '0 10px 28px rgba(91, 95, 239, 0.15)',
                                                        background: isMe ? '#FFFFFF' : '#FCFBF7'
                                                    }}
                                                >
                                                    <Box style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                                        {/* Avatar with concentric luxury ring & presence beacon */}
                                                        <Box style={{
                                                            position: 'relative',
                                                            width: '48px',
                                                            height: '48px',
                                                            minWidth: '48px',
                                                            borderRadius: '50%',
                                                            padding: '2px',
                                                            background: isOnlineNow
                                                                ? 'linear-gradient(135deg, #10B981 0%, #5B5FEF 100%)'
                                                                : isFriend
                                                                ? 'linear-gradient(135deg, #8067E8 0%, #5B5FEF 100%)'
                                                                : isSentRequest
                                                                ? 'linear-gradient(135deg, #6D8CFF 0%, #5B5FEF 100%)'
                                                                : 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                                                            boxShadow: isOnlineNow
                                                                ? '0 4px 14px rgba(16, 185, 129, 0.35)'
                                                                : '0 4px 12px rgba(91, 95, 239, 0.2)',
                                                            flexShrink: 0
                                                        }}>
                                                            <Avatar
                                                                size="full"
                                                                name={u?.name || 'Aura User'}
                                                                src={u?.pic && typeof u.pic === 'string' && u.pic.length > 5 && !u.pic.includes("icon-library.com") && !u.pic.includes("flaticon.com") ? u.pic : undefined}
                                                                fontWeight="900"
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    borderRadius: '50%',
                                                                    border: '2px solid #FFFFFF'
                                                                }}
                                                            />
                                                            {/* Real-time Status Pulse Beacon */}
                                                            <span
                                                                style={{
                                                                    position: 'absolute',
                                                                    right: 0,
                                                                    bottom: 0,
                                                                    width: '13px',
                                                                    height: '13px',
                                                                    borderRadius: '50%',
                                                                    background: isOnlineNow ? '#10B981' : '#A1A3B5',
                                                                    border: '2.5px solid #FFFFFF',
                                                                    boxShadow: isOnlineNow ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none'
                                                                }}
                                                            />
                                                        </Box>

                                                        {/* User Details */}
                                                        <Box textAlign="left" style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                                                            <Box display="flex" alignItems="center" gap={1.5} style={{ overflow: 'hidden' }}>
                                                                <Text fontWeight="900" fontSize="0.98rem" color="#171827" m={0} fontFamily="'Plus Jakarta Sans', sans-serif" isTruncated>
                                                                    {u?.name || 'User'}
                                                                </Text>
                                                                {isMe ? (
                                                                    <Badge bg="linear-gradient(135deg, #5B5FEF, #8067E8)" color="#FFFFFF" borderRadius="99px" px={2} py={0.5} fontSize="0.65rem" fontWeight="900">
                                                                        You
                                                                    </Badge>
                                                                ) : isFriend ? (
                                                                    <Badge bg="linear-gradient(135deg, #8067E8, #5B5FEF)" color="#FFFFFF" borderRadius="99px" px={2} py={0.5} fontSize="0.65rem" fontWeight="900">
                                                                        ⭐ Friend
                                                                    </Badge>
                                                                ) : isSentRequest ? (
                                                                    <Badge bg="rgba(91, 95, 239, 0.12)" color="#5B5FEF" border="1px solid rgba(91, 95, 239, 0.25)" borderRadius="99px" px={2} py={0.5} fontSize="0.65rem" fontWeight="800">
                                                                        ⏳ Request Sent
                                                                    </Badge>
                                                                ) : incomingReq ? (
                                                                    <Badge bg="rgba(16, 185, 129, 0.15)" color="#059669" border="1px solid rgba(16, 185, 129, 0.3)" borderRadius="99px" px={2} py={0.5} fontSize="0.65rem" fontWeight="800">
                                                                        Incoming
                                                                    </Badge>
                                                                ) : isOnlineNow && (
                                                                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '1px 6px', borderRadius: '6px' }}>
                                                                        Online
                                                                    </span>
                                                                )}
                                                            </Box>
                                                            <Text fontWeight="700" fontSize="0.8rem" color="#5B5FEF" m={0} fontFamily="'Plus Jakarta Sans', sans-serif" isTruncated>
                                                                @{u?.username || (u?.email ? u.email.split('@')[0] : 'user')}
                                                            </Text>
                                                        </Box>
                                                    </Box>

                                                    {/* CTA Action Button */}
                                                    {!isMe && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '12px' }}>
                                                            {isFriend ? (
                                                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            accessChat(targetId);
                                                                        }}
                                                                        style={{
                                                                            background: 'linear-gradient(135deg, #171827 0%, #2D2F48 100%)',
                                                                            color: '#FFFFFF',
                                                                            borderRadius: '99px',
                                                                            padding: '0 16px',
                                                                            height: '36px',
                                                                            fontWeight: 800,
                                                                            fontSize: '0.8rem',
                                                                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                                                                            border: '1px solid rgba(91, 95, 239, 0.3)',
                                                                            boxShadow: '0 4px 14px rgba(23, 24, 39, 0.15)',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                        _hover={{
                                                                            background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                                                                            boxShadow: '0 6px 20px rgba(91, 95, 239, 0.3)'
                                                                        }}
                                                                    >
                                                                        💬 Chat
                                                                    </Button>
                                                                </motion.div>
                                                            ) : incomingReq ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleRespondFriendRequest(incomingReq.id || incomingReq._id, 'ACCEPT', u);
                                                                            }}
                                                                            style={{
                                                                                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                                                                color: '#FFFFFF',
                                                                                borderRadius: '99px',
                                                                                padding: '0 14px',
                                                                                height: '36px',
                                                                                fontWeight: 800,
                                                                                fontSize: '0.78rem',
                                                                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                                                                border: 'none',
                                                                                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                                                                                cursor: 'pointer'
                                                                            }}
                                                                        >
                                                                            ✓ Accept
                                                                        </Button>
                                                                    </motion.div>
                                                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleRespondFriendRequest(incomingReq.id || incomingReq._id, 'REJECT', u);
                                                                            }}
                                                                            style={{
                                                                                background: '#F4F3EF',
                                                                                color: '#727486',
                                                                                borderRadius: '99px',
                                                                                padding: '0 10px',
                                                                                height: '36px',
                                                                                fontWeight: 700,
                                                                                fontSize: '0.78rem',
                                                                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                                                                                border: '1px solid rgba(23, 24, 39, 0.08)',
                                                                                cursor: 'pointer'
                                                                            }}
                                                                        >
                                                                            ✕
                                                                        </Button>
                                                                    </motion.div>
                                                                </div>
                                                            ) : isSentRequest ? (
                                                                <motion.div
                                                                    animate={{ scale: [1, 1.02, 1] }}
                                                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            background: 'rgba(91, 95, 239, 0.1)',
                                                                            color: '#5B5FEF',
                                                                            borderRadius: '99px',
                                                                            padding: '0 14px',
                                                                            height: '36px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '6px',
                                                                            fontWeight: 800,
                                                                            fontSize: '0.78rem',
                                                                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                                                                            border: '1.5px solid rgba(91, 95, 239, 0.3)',
                                                                            boxShadow: '0 2px 10px rgba(91, 95, 239, 0.1)',
                                                                            cursor: 'default',
                                                                            userSelect: 'none'
                                                                        }}
                                                                    >
                                                                        <span>⏳</span>
                                                                        <span>Request Sent</span>
                                                                    </div>
                                                                </motion.div>
                                                            ) : (
                                                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                                    <Button
                                                                        size="sm"
                                                                        isLoading={isRequestLoading}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleSendFriendRequest(u);
                                                                        }}
                                                                        style={{
                                                                            background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                                                                            color: '#FFFFFF',
                                                                            borderRadius: '99px',
                                                                            padding: '0 16px',
                                                                            height: '36px',
                                                                            fontWeight: 800,
                                                                            fontSize: '0.8rem',
                                                                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                                                                            border: 'none',
                                                                            boxShadow: '0 4px 14px rgba(91, 95, 239, 0.28)',
                                                                            cursor: 'pointer',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '5px'
                                                                        }}
                                                                        _hover={{ opacity: 0.95, boxShadow: '0 6px 20px rgba(91, 95, 239, 0.4)' }}
                                                                    >
                                                                        + Add Friend
                                                                    </Button>
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                    )}
                                                </Box>
                                            </motion.div>
                                        );
                                    })}
                                </Box>
                            );
                        })()}
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
            <Modal isOpen={isOpen} onClose={onClose} isCentered motionPreset="slideInBottom">
                <ModalOverlay style={{ backdropFilter: "blur(24px)", background: "rgba(15, 23, 42, 0.5)" }} />
                <ModalContent
                    mx={{ base: 3, sm: "auto" }}
                    maxW={{ base: "calc(100% - 24px)", sm: "460px" }}
                    borderRadius="28px"
                    style={{
                        background: "#FFFFFF",
                        color: "#171827",
                        border: "1px solid rgba(23, 24, 39, 0.08)",
                        boxShadow: "0 40px 100px rgba(23, 24, 39, 0.15)",
                        overflow: "hidden"
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                        {/* ── LUXURIOUS AMBIENT BANNER ── */}
                        <Box sx={{
                            height: '110px',
                            width: '100%',
                            background: 'linear-gradient(180deg, rgba(91, 95, 239, 0.08) 0%, rgba(255, 255, 255, 0) 100%), #FFFFFF',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            p: 3.5,
                            px: 4,
                            borderBottom: '1px solid rgba(23, 24, 39, 0.06)'
                        }}>
                            <Badge
                                sx={{
                                    bg: 'rgba(91, 95, 239, 0.1)',
                                    color: '#5B5FEF',
                                    borderRadius: '99px',
                                    px: 3,
                                    py: 1,
                                    fontSize: '0.7rem',
                                    fontWeight: 900,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    border: '1px solid rgba(91, 95, 239, 0.25)'
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
                                            background: 'rgba(91, 95, 239, 0.08)',
                                            color: '#5B5FEF',
                                            borderRadius: '99px',
                                            padding: '6px 14px',
                                            fontSize: '0.78rem',
                                            fontWeight: 800,
                                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                                            border: '1px solid rgba(91, 95, 239, 0.25)',
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
                                            bg: '#F4F3EF',
                                            color: '#727486',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            border: '1px solid rgba(23, 24, 39, 0.08)',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                bg: '#E2E8F0',
                                                color: '#171827'
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
                                                overflow: 'hidden',
                                                background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                                                boxShadow: '0 0 0 3px #FFFFFF, 0 0 0 5px rgba(91, 95, 239, 0.3), 0 10px 25px rgba(91, 95, 239, 0.2)'
                                            }}>
                                                <Avatar
                                                    size="2xl"
                                                    name={user && user.name}
                                                    src={user && user.pic}
                                                    fontWeight="900"
                                                    onClick={() => setIsPreviewPicOpen(true)}
                                                    style={{
                                                        width: '98px',
                                                        height: '98px',
                                                        borderRadius: '50%',
                                                        overflow: 'hidden',
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
                                                    bottom: '2px',
                                                    right: '2px',
                                                    bg: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                                                    color: '#FFFFFF',
                                                    borderRadius: '50%',
                                                    width: '34px',
                                                    height: '34px',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 4px 14px rgba(91, 95, 239, 0.35)',
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
                                <h3 style={{ margin: '14px 0 2px', fontSize: "1.45rem", fontWeight: 900, color: "#171827", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em' }}>
                                    {user?.name || "Aura User"}
                                </h3>
                                <span style={{
                                    background: 'rgba(91, 95, 239, 0.08)',
                                    color: '#5B5FEF',
                                    fontSize: '0.82rem',
                                    fontWeight: 800,
                                    padding: '3px 14px',
                                    borderRadius: '99px',
                                    border: '1px solid rgba(91, 95, 239, 0.2)',
                                    fontFamily: "'Plus Jakarta Sans', sans-serif"
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
                                    border: '1.5px solid rgba(23, 24, 39, 0.06)',
                                    boxShadow: '0 2px 10px rgba(23, 24, 39, 0.02)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderColor: 'rgba(91, 95, 239, 0.4)',
                                        boxShadow: '0 6px 20px rgba(91, 95, 239, 0.08)'
                                    }
                                }}>
                                    <Box sx={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        background: 'rgba(91, 95, 239, 0.08)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        border: '1px solid rgba(91, 95, 239, 0.2)'
                                    }}>
                                        <PersonOutlineIcon style={{ color: '#5B5FEF', fontSize: 19 }} />
                                    </Box>
                                    <span style={{ flexGrow: 1, textAlign: 'left' }}>
                                        <strong style={{ color: '#727486', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '1px' }}>Display Name</strong>
                                        {isEditingName ? (
                                            <Input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                autoFocus
                                                size="sm"
                                                mt={1}
                                                borderRadius="10px"
                                                border="1.5px solid #5B5FEF"
                                                focusBorderColor="#5B5FEF"
                                                bg="#FFFFFF"
                                                color="#171827"
                                                fontWeight="700"
                                            />
                                        ) : (
                                            <span style={{ fontWeight: 800, color: '#171827', fontSize: '0.95rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{user && user.name}</span>
                                        )}
                                    </span>
                                    {isEditingName ? (
                                        <Box display="flex" gap={1.5}>
                                            <Button
                                                size="sm"
                                                onClick={handleSaveName}
                                                style={{ background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)', color: '#FFF', borderRadius: '8px', minW: '30px', padding: '0 8px' }}
                                            >
                                                <CheckIcon fontSize="12px" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => setIsEditingName(false)}
                                                style={{ background: '#F4F3EF', color: '#727486', borderRadius: '8px', minW: '30px', padding: '0 8px' }}
                                            >
                                                <CloseIcon fontSize="10px" />
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Tooltip label="Edit Name" hasArrow placement="top">
                                            <Button
                                                size="sm"
                                                onClick={() => { setEditName(user?.name || ''); setIsEditingName(true); }}
                                                style={{ background: 'transparent', color: '#727486', borderRadius: '10px', padding: '0', minW: '32px', height: '32px' }}
                                                _hover={{ background: 'rgba(91, 95, 239, 0.08)', color: '#5B5FEF' }}
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
                                    border: '1.5px solid rgba(23, 24, 39, 0.06)',
                                    boxShadow: '0 2px 10px rgba(23, 24, 39, 0.02)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderColor: 'rgba(91, 95, 239, 0.4)',
                                        boxShadow: '0 6px 20px rgba(91, 95, 239, 0.08)'
                                    }
                                }}>
                                    <Box sx={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        background: 'rgba(91, 95, 239, 0.08)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        border: '1px solid rgba(91, 95, 239, 0.2)'
                                    }}>
                                        <AlternateEmailIcon style={{ color: '#5B5FEF', fontSize: 19 }} />
                                    </Box>
                                    <span style={{ flexGrow: 1, textAlign: 'left', wordBreak: 'break-all' }}>
                                        <strong style={{ color: '#727486', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '1px' }}>Username</strong>
                                        {isEditingUsername ? (
                                            <Input
                                                value={editUsername}
                                                onChange={(e) => setEditUsername(e.target.value)}
                                                autoFocus
                                                size="sm"
                                                mt={1}
                                                borderRadius="10px"
                                                border="1.5px solid #5B5FEF"
                                                focusBorderColor="#5B5FEF"
                                                bg="#FFFFFF"
                                                color="#171827"
                                                fontWeight="700"
                                                placeholder="e.g. vicky123"
                                            />
                                        ) : (
                                            <span style={{ fontWeight: 800, color: '#171827', fontSize: '0.95rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>@{user?.username || (user?.email ? user.email.split('@')[0] : 'aura_user')}</span>
                                        )}
                                    </span>
                                    {isEditingUsername ? (
                                        <Box display="flex" gap={1.5}>
                                            <Button
                                                size="sm"
                                                onClick={handleSaveUsername}
                                                style={{ background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)', color: '#FFF', borderRadius: '8px', minW: '30px', padding: '0 8px' }}
                                            >
                                                <CheckIcon fontSize="12px" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => setIsEditingUsername(false)}
                                                style={{ background: '#F4F3EF', color: '#727486', borderRadius: '8px', minW: '30px', padding: '0 8px' }}
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
                                                    style={{ background: 'transparent', color: '#727486', borderRadius: '10px', padding: '0', minW: '32px', height: '32px' }}
                                                    _hover={{ background: 'rgba(91, 95, 239, 0.08)', color: '#5B5FEF' }}
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
                                                    style={{ background: 'transparent', color: '#727486', borderRadius: '10px', padding: '0', minW: '32px', height: '32px' }}
                                                    _hover={{ background: 'rgba(91, 95, 239, 0.08)', color: '#5B5FEF' }}
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
                                    border: '1.5px solid rgba(23, 24, 39, 0.06)',
                                    boxShadow: '0 2px 10px rgba(23, 24, 39, 0.02)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderColor: 'rgba(91, 95, 239, 0.4)',
                                        boxShadow: '0 6px 20px rgba(91, 95, 239, 0.08)'
                                    }
                                }}>
                                    <Box sx={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        background: 'rgba(91, 95, 239, 0.08)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        border: '1px solid rgba(91, 95, 239, 0.2)'
                                    }}>
                                        <EmailIcon style={{ color: '#5B5FEF', fontSize: 19 }} />
                                    </Box>
                                    <span style={{ flexGrow: 1, textAlign: 'left', wordBreak: 'break-all' }}>
                                        <strong style={{ color: '#727486', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '1px' }}>Email Address</strong>
                                        {isEditingEmail ? (
                                            <Input
                                                value={editEmail}
                                                onChange={(e) => setEditEmail(e.target.value)}
                                                autoFocus
                                                size="sm"
                                                mt={1}
                                                borderRadius="10px"
                                                border="1.5px solid #5B5FEF"
                                                focusBorderColor="#5B5FEF"
                                                bg="#FFFFFF"
                                                color="#171827"
                                                fontWeight="700"
                                            />
                                        ) : (
                                            <span style={{ fontWeight: 800, color: '#171827', fontSize: '0.95rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{user && user.email}</span>
                                        )}
                                    </span>
                                    {isEditingEmail ? (
                                        <Box display="flex" gap={1.5}>
                                            <Button
                                                size="sm"
                                                onClick={handleSaveEmail}
                                                style={{ background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)', color: '#FFF', borderRadius: '8px', minW: '30px', padding: '0 8px' }}
                                            >
                                                <CheckIcon fontSize="12px" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => setIsEditingEmail(false)}
                                                style={{ background: '#F4F3EF', color: '#727486', borderRadius: '8px', minW: '30px', padding: '0 8px' }}
                                            >
                                                <CloseIcon fontSize="10px" />
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Tooltip label="Edit Email" hasArrow placement="top">
                                            <Button
                                                size="sm"
                                                onClick={() => { setEditEmail(user?.email || ''); setIsEditingEmail(true); }}
                                                style={{ background: 'transparent', color: '#727486', borderRadius: '10px', padding: '0', minW: '32px', height: '32px' }}
                                                _hover={{ background: 'rgba(91, 95, 239, 0.08)', color: '#5B5FEF' }}
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
                                    <Button
                                        onClick={onClose}
                                        style={{
                                            width: '100%',
                                            background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                                            color: '#FFFFFF',
                                            fontWeight: 800,
                                            height: '48px',
                                            borderRadius: '16px',
                                            border: 'none',
                                            fontSize: '0.94rem',
                                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                                            letterSpacing: '0.02em',
                                            boxShadow: '0 8px 24px rgba(91, 95, 239, 0.28)',
                                            textTransform: 'none',
                                            cursor: 'pointer',
                                            touchAction: 'manipulation',
                                            WebkitTapHighlightColor: 'transparent'
                                        }}
                                        _hover={{ opacity: 0.94 }}
                                    >
                                        Close Profile
                                    </Button>
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
                    color: '#171827',
                    border: '1px solid rgba(23, 24, 39, 0.08)',
                    boxShadow: '0 30px 80px rgba(23, 24, 39, 0.15)',
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
                            borderBottom: '1px solid rgba(23, 24, 39, 0.06)'
                        }}>
                            <Badge
                                sx={{
                                    bg: 'rgba(91, 95, 239, 0.1)',
                                    color: '#5B5FEF',
                                    borderRadius: '99px',
                                    px: 3.5,
                                    py: 1.2,
                                    fontSize: '0.72rem',
                                    fontWeight: 900,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.12em',
                                    border: '1px solid rgba(91, 95, 239, 0.25)',
                                    boxShadow: '0 2px 8px rgba(91, 95, 239, 0.08)',
                                    fontFamily: "'Plus Jakarta Sans', sans-serif"
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
                                        bg: '#F4F3EF',
                                        color: '#727486',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        border: '1px solid rgba(23, 24, 39, 0.08)',
                                        '&:hover': {
                                            bg: '#E2E8F0',
                                            color: '#171827'
                                        }
                                    }}
                                >
                                    <CloseIcon style={{ fontSize: 11 }} />
                                </Box>
                            </motion.div>
                        </Box>

                        <ModalBody className="text-center pb-7 pt-3 px-6">
                            {/* Mode Tab Switcher */}
                            <Box sx={{
                                display: 'flex',
                                background: '#F4F3EF',
                                borderRadius: '99px',
                                p: 1,
                                mb: 4,
                                border: '1px solid rgba(23, 24, 39, 0.06)'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setQrTab('scan')}
                                    style={{
                                        flex: 1,
                                        padding: '9px 14px',
                                        borderRadius: '99px',
                                        border: 'none',
                                        background: qrTab === 'scan' ? '#FFFFFF' : 'transparent',
                                        color: qrTab === 'scan' ? '#5B5FEF' : '#727486',
                                        fontWeight: 800,
                                        fontSize: '0.82rem',
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                        cursor: 'pointer',
                                        boxShadow: qrTab === 'scan' ? '0 4px 14px rgba(91, 95, 239, 0.18)' : 'none',
                                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <span>📷</span> Scan Barcode
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setQrTab('myQr')}
                                    style={{
                                        flex: 1,
                                        padding: '9px 14px',
                                        borderRadius: '99px',
                                        border: 'none',
                                        background: qrTab === 'myQr' ? '#FFFFFF' : 'transparent',
                                        color: qrTab === 'myQr' ? '#5B5FEF' : '#727486',
                                        fontWeight: 800,
                                        fontSize: '0.82rem',
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                        cursor: 'pointer',
                                        boxShadow: qrTab === 'myQr' ? '0 4px 14px rgba(91, 95, 239, 0.18)' : 'none',
                                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <span>🪪</span> My QR Code
                                </button>
                            </Box>

                            {qrTab === 'scan' ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    {/* Animated Camera Viewfinder Frame */}
                                    <Box sx={{
                                        width: '240px',
                                        height: '240px',
                                        borderRadius: '28px',
                                        border: isScanning ? '3px solid #10B981' : '3px solid #5B5FEF',
                                        background: '#171827',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: isScanning ? '0 12px 35px rgba(16, 185, 129, 0.3)' : '0 14px 40px rgba(91, 95, 239, 0.25)',
                                        transition: 'all 0.3s ease',
                                        mb: 4
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
                                                <QrCode2Icon style={{ fontSize: 46, color: isScanning ? '#10B981' : '#5B5FEF', opacity: 0.85 }} />
                                                <Text fontSize="0.75rem" fontWeight="800" color={cameraError ? '#EF4444' : '#727486'} m={0} mt={1}>
                                                    {cameraError ? cameraError : 'Initializing Camera...'}
                                                </Text>
                                                {cameraError && (
                                                    <button
                                                        onClick={startCamera}
                                                        style={{
                                                            marginTop: '8px',
                                                            background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
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
                                                : 'linear-gradient(90deg, transparent, #5B5FEF, transparent)',
                                            boxShadow: isScanning ? '0 0 20px #10B981' : '0 0 18px #5B5FEF',
                                            animation: 'scanLine 1.8s linear infinite',
                                            zIndex: 3
                                        }} />

                                        {/* Scanner Square Reticle Corners for Target Alignment */}
                                        <Box sx={{
                                            position: 'absolute',
                                            width: '160px',
                                            height: '160px',
                                            borderRadius: '16px',
                                            border: '2px dashed rgba(91, 95, 239, 0.6)',
                                            boxShadow: 'inset 0 0 15px rgba(91, 95, 239, 0.15)',
                                            pointerEvents: 'none',
                                            zIndex: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <span style={{
                                                position: 'absolute',
                                                bottom: '-22px',
                                                fontSize: '0.66rem',
                                                fontWeight: 800,
                                                color: '#5B5FEF',
                                                background: 'rgba(23, 24, 39, 0.75)',
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                letterSpacing: '0.04em'
                                            }}>
                                                AUTO SCAN ACTIVE
                                            </span>
                                        </Box>
                                    </Box>

                                    {/* Clean Separated Input Bar & Scan Button */}
                                    <Box sx={{ width: '100%', mb: 3 }}>
                                        <Box sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 2.5
                                        }}>
                                            <div style={{ position: 'relative', width: '100%' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Enter or paste @username (e.g. @vicky123)"
                                                    value={scannedUsername}
                                                    onChange={(e) => setScannedUsername(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleScanQrCode(scannedUsername);
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        height: '46px',
                                                        borderRadius: '16px',
                                                        border: '1.5px solid rgba(226, 232, 240, 0.9)',
                                                        outline: 'none',
                                                        background: '#F8FAFC',
                                                        fontSize: '0.88rem',
                                                        fontWeight: 600,
                                                        color: '#0F172A',
                                                        fontFamily: "'Outfit', 'Inter', sans-serif",
                                                        padding: '0 16px',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                />
                                            </div>
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => handleScanQrCode(scannedUsername)}
                                                style={{
                                                    width: '100%',
                                                    height: '46px',
                                                    background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                                                    color: '#FFFFFF',
                                                    border: 'none',
                                                    borderRadius: '16px',
                                                    fontSize: '0.88rem',
                                                    fontWeight: 800,
                                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                                    cursor: 'pointer',
                                                    boxShadow: '0 4px 16px rgba(91, 95, 239, 0.28)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                🔍 {isScanning ? 'Searching User...' : 'Scan / Lookup Username'}
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
                                                    ✓ SCANNED USER VERIFIED
                                                </span>
                                                <Box display="flex" alignItems="center" justifyContent="space-between" w="100%">
                                                    <Box display="flex" alignItems="center" gap={3}>
                                                        <Avatar size="md" name={scannedUser.name} src={scannedUser.pic} />
                                                        <Box textAlign="left">
                                                            <Text fontWeight="800" fontSize="0.9rem" color="#171827" m={0} fontFamily="'Plus Jakarta Sans', sans-serif">
                                                                {scannedUser.name}
                                                            </Text>
                                                            <Text fontWeight="700" fontSize="0.75rem" color="#5B5FEF" m={0} fontFamily="'Plus Jakarta Sans', sans-serif">
                                                                @{scannedUser.username || (scannedUser.email ? scannedUser.email.split('@')[0] : 'user')}
                                                            </Text>
                                                        </Box>
                                                    </Box>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => sendChatRequest(scannedUser)}
                                                        bg="linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)"
                                                        color="#FFFFFF"
                                                        fontWeight="800"
                                                        borderRadius="12px"
                                                        boxShadow="0 4px 12px rgba(91, 95, 239, 0.25)"
                                                    >
                                                        + Add User
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </motion.div>
                                    )}
                                </Box>
                            ) : (
                                <>
                                    {/* Profile Hero Avatar */}
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                                        <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                                            <Box sx={{
                                                padding: '4px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                                                boxShadow: '0 8px 25px rgba(91, 95, 239, 0.22)'
                                            }}>
                                                <Avatar
                                                    size="lg"
                                                    name={user && user.name}
                                                    src={user && user.pic}
                                                    fontWeight="900"
                                                    style={{
                                                        width: '80px',
                                                        height: '80px',
                                                        border: "3px solid #FFFFFF"
                                                    }}
                                                />
                                            </Box>
                                        </motion.div>
                                        <h4 style={{ margin: '10px 0 2px', fontSize: '1.3rem', fontWeight: 900, color: '#171827', fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em' }}>
                                            {user?.name || "Aura User"}
                                        </h4>
                                        <Badge
                                            sx={{
                                                bg: 'rgba(91, 95, 239, 0.1)',
                                                color: '#5B5FEF',
                                                borderRadius: '99px',
                                                px: 3.5,
                                                py: 0.8,
                                                fontSize: '0.8rem',
                                                fontWeight: 800,
                                                border: '1px solid rgba(91, 95, 239, 0.2)',
                                                fontFamily: "'Plus Jakarta Sans', sans-serif"
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
                                            border: '1.5px solid rgba(23, 24, 39, 0.08)',
                                            boxShadow: '0 12px 35px rgba(23, 24, 39, 0.04)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            mb: 4
                                        }}>
                                            <Box sx={{
                                                p: 3,
                                                borderRadius: '22px',
                                                background: 'linear-gradient(135deg, rgba(91, 95, 239, 0.05) 0%, #FFFFFF 100%)',
                                                border: '1.5px solid rgba(91, 95, 239, 0.15)',
                                                boxShadow: '0 6px 20px rgba(91, 95, 239, 0.06)',
                                                mb: 2
                                            }}>
                                                <img
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=@${user?.username || (user?.email ? user.email.split('@')[0] : 'aura_user')}`}
                                                    alt="User QR Code"
                                                    style={{ width: '155px', height: '155px', borderRadius: '14px', display: 'block' }}
                                                />
                                            </Box>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#727486', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                                <QrCode2Icon style={{ fontSize: 16, color: '#5B5FEF' }} /> Scan QR to quickly connect or view profile
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
                                            color: '#5B5FEF',
                                            fontWeight: 800,
                                            height: '48px',
                                            borderRadius: '16px',
                                            border: '1.5px solid rgba(91, 95, 239, 0.25)',
                                            fontSize: '0.88rem',
                                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '7px',
                                            boxShadow: '0 4px 12px rgba(91, 95, 239, 0.08)'
                                        }}
                                        _hover={{ bg: 'rgba(91, 95, 239, 0.05)' }}
                                    >
                                        <ContentCopyIcon style={{ fontSize: 15, color: '#5B5FEF' }} /> Copy Handle
                                    </Button>
                                </motion.div>
                                <motion.div style={{ flex: 1 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Button
                                        onClick={() => setIsQrScannerOpen(false)}
                                        style={{
                                            width: '100%',
                                            background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                                            color: '#FFFFFF',
                                            fontWeight: 800,
                                            height: '48px',
                                            borderRadius: '16px',
                                            border: 'none',
                                            boxShadow: '0 8px 24px rgba(91, 95, 239, 0.28)',
                                            fontSize: '0.92rem',
                                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px'
                                        }}
                                        _hover={{ opacity: 0.94 }}
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
                    border="1px solid rgba(23, 24, 39, 0.08)"
                    bg="#FFFFFF"
                    p={4}
                    style={{
                        boxShadow: "0 25px 70px rgba(23, 24, 39, 0.15)",
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
                            bg="linear-gradient(135deg, rgba(91, 95, 239, 0.12) 0%, rgba(128, 103, 232, 0.05) 100%)"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            color="#5B5FEF"
                            mb={4}
                            style={{ border: "1px solid rgba(91, 95, 239, 0.25)", boxShadow: "0 6px 20px rgba(91, 95, 239, 0.12)" }}
                        >
                            <i className="fas fa-sign-out-alt" style={{ fontSize: "22px" }}></i>
                        </Box>
                        <Text fontSize="1.35rem" fontWeight="900" color="#171827" mb={2} fontFamily="'Plus Jakarta Sans', sans-serif">
                            Confirm Log Out
                        </Text>
                        <Text fontSize="0.9rem" color="#727486" mb={6} fontFamily="'Plus Jakarta Sans', sans-serif" lineHeight="1.5">
                            Are you sure you want to end your current session? You will need to log in again to access your conversations.
                        </Text>
                        <Box display="flex" gap={3} justifyContent="center" width="100%">
                            <MDBBtn
                                onClick={() => setIsLogoutConfirmOpen(false)}
                                style={{
                                    flex: 1,
                                    background: '#F4F3EF',
                                    color: '#727486',
                                    fontWeight: 800,
                                    height: '48px',
                                    borderRadius: '16px',
                                    textTransform: 'none',
                                    boxShadow: 'none',
                                    border: '1px solid rgba(23, 24, 39, 0.08)',
                                    fontFamily: "'Plus Jakarta Sans', sans-serif"
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
                                    background: 'linear-gradient(135deg, #171827 0%, #2D2F48 100%)',
                                    color: '#FFFFFF',
                                    fontWeight: 800,
                                    height: '48px',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(91, 95, 239, 0.3)',
                                    textTransform: 'none',
                                    boxShadow: '0 8px 24px rgba(23, 24, 39, 0.18)',
                                    fontFamily: "'Plus Jakarta Sans', sans-serif"
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