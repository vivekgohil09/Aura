import React, { useEffect, useState } from 'react'
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
    const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
    const [qrScanInput, setQrScanInput] = useState('');
    const [searchError, setSearchError] = useState('');

    useEffect(() => {
        if (isOpenDrawer) {
            setSearch("");
            setSearchResult([]);
            setSearchError("");
        }
    }, [isOpenDrawer]);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
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
            setSearchResult([]);

            const config = {
                headers: {
                    Authorization: "Bearer " + getJwtToken(),
                },
            };
            const { data } = await axios.get(`/api/v1/users/by-username/${cleanUsername}`, config);
            setLoading(false);
            setSearchResult([{
                id: data.publicId,
                _id: data.publicId,
                name: data.displayName,
                username: data.username,
                pic: data.profilePictureUrl
            }]);

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
            if (!existingChats.find((c) => (c.id || c._id) === dataChatId)) {
                dispatch(setChats([data, ...existingChats]));
            }
            dispatch(setSelectedChat(data));
            console.log(data);
            setLoadingChat(false);
            onClose();
        } catch (error) {
            if (handleAuthError(error, history)) return;
            if (!toast.isActive("failed-to-create-chat-toast")) {
                toast.error('Failed to create chat!', {
                    toastId: "failed-to-create-chat-toast",
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
            setLoadingChat(false);
        }


    }

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
                    borderBottom: "1px solid rgba(236, 233, 225, 0.8)",
                    flexShrink: 0,
                    boxShadow: "0 8px 32px rgba(57, 115, 107, 0.05)"
                }}
                w="100%"
                h="70px"
                px={{ base: 3, sm: 4, md: 6 }}
            >
                {/* Brand Logo & Interactive Search Bar */}
                <div className='d-flex justify-content-start align-items-center gap-3 gap-md-4' style={{ flex: 1 }}>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                        onClick={() => history.push('/')}
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
                    <Tooltip label="Type user name or email to search" hasArrow placement="bottom-start">
                        <Box style={{ flex: 1, maxWidth: '340px', position: 'relative' }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    background: '#F4F4F5',
                                    border: '1px solid #E4E4E7',
                                    borderRadius: '99px',
                                    px: 3,
                                    height: '42px',
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
                                    placeholder="Search messages..."
                                    value={search}
                                    onFocus={() => {
                                        onOpenDrawer();
                                    }}
                                    onChange={(e) => {
                                        onOpenDrawer();
                                        handleSearch(e.target.value);
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
                                <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    color: '#FFFFFF',
                                    background: 'linear-gradient(135deg, #E63946 0%, #d62839 100%)',
                                    padding: '3px 8px',
                                    borderRadius: '20px',
                                    pointerEvents: 'none',
                                    flexShrink: 0,
                                    boxShadow: '0 2px 8px rgba(230, 57, 70, 0.3)'
                                }}>⌘K</span>
                            </Box>

                            {/* Dropdown search results directly under top search bar */}
                            {search && searchResult && searchResult.length > 0 && (
                                <Box
                                    position="absolute"
                                    top="52px"
                                    left="0"
                                    w="340px"
                                    minW="320px"
                                    bg="#FFFFFF"
                                    borderRadius="18px"
                                    border="1.5px solid rgba(230, 57, 70, 0.15)"
                                    boxShadow="0 20px 45px rgba(61, 43, 38, 0.18)"
                                    zIndex="9999"
                                    p={2.5}
                                    maxH="340px"
                                    overflowY="auto"
                                >
                                    {searchResult.map((u) => (
                                        <Box
                                            key={u.id || u._id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                accessChat(u.id || u._id);
                                                setSearch("");
                                                setSearchResult([]);
                                            }}
                                        >
                                            <UserListItem user={u} />
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </Box>
                    </Tooltip>
                </div>


                <div className="d-flex align-items-center gap-2">
                    <Menu>
                        <MenuButton p={1} position="relative">
                            <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                                {notification.length > 0 && (
                                    <motion.div
                                        animate={{ scale: [1, 1.25, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        style={{ position: 'absolute', top: '-4px', right: '-4px', zIndex: 10 }}
                                    >
                                        <Badge
                                            style={{
                                                background: "linear-gradient(135deg, #E63946 0%, #d62839 100%)",
                                                color: "#FFFFFF",
                                                borderRadius: "99px",
                                                padding: "2px 7px",
                                                fontSize: "0.72rem",
                                                fontWeight: 800,
                                                boxShadow: "0 0 12px rgba(230, 57, 70, 0.75)"
                                            }}
                                        >
                                            {notification.length}
                                        </Badge>
                                    </motion.div>
                                )}
                                <Box sx={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    background: notification.length > 0 ? '#FFF0F2' : '#F4F4F5',
                                    border: notification.length > 0 ? '1.5px solid #E63946' : '1px solid #E4E4E7',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: notification.length > 0 ? '#E63946' : '#18181B',
                                    transition: 'all 0.2s ease',
                                    boxShadow: notification.length > 0 ? '0 4px 14px rgba(230, 57, 70, 0.2)' : 'none',
                                    '&:hover': {
                                        background: '#EAEAEA',
                                    }
                                }}>
                                    <BellIcon fontSize="20px" w={5} h={5} color={notification.length > 0 ? "#E63946" : "#18181B"} />
                                </Box>
                            </motion.div>
                        </MenuButton>
                        <MenuList
                            bg="#FFFFFF"
                            borderColor="#F1F1F4"
                            color="#18181B"
                            borderRadius="18px"
                            p={2}
                            style={{ boxShadow: "0 15px 40px rgba(0, 0, 0, 0.12)", border: "1px solid #F1F1F4" }}
                        >
                            {!notification.length && (
                                <Box p={3} textAlign="center" color="#71717A" fontSize="0.85rem">
                                    🔔 No new notifications
                                </Box>
                            )}
                            {notification.map((notif, idx) => (
                                <MenuItem
                                    key={notif._id || idx}
                                    bg="#FFFFFF"
                                    color="#18181B"
                                    borderRadius="12px"
                                    mb={1}
                                    _hover={{ bg: "#FFF0F2" }}
                                    onClick={() => {
                                        dispatch(setSelectedChat(notif.chat));
                                        dispatch(setNotification(notification.filter((n) => n !== notif)));
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E63946', flexShrink: 0 }} />
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: '#18181B' }}>
                                                {notif.chat.isGroupChat
                                                    ? `Group: ${notif.chat.chatName}`
                                                    : getSender(user, notif.chat.users)}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#71717A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {notif.content || "Sent a message"}
                                            </p>
                                        </div>
                                        <span style={{ fontSize: '0.65rem', color: '#E63946', fontWeight: 800, background: '#FFE3E6', padding: '2px 6px', borderRadius: '6px' }}>
                                            NEW
                                        </span>
                                    </div>
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
            {/* ── MY PROFILE MODAL (ULTRA-PREMIUM HERO COVER DESIGN) ── */}
            <Modal size="md" isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay style={{ backdropFilter: "blur(14px)", background: "rgba(15, 12, 10, 0.55)" }} />
                <ModalContent style={{
                    background: "#FAF8F5",
                    color: "#303633",
                    border: "1px solid rgba(230, 57, 70, 0.12)",
                    borderRadius: "32px",
                    boxShadow: "0 35px 80px rgba(30, 20, 15, 0.25)",
                    overflow: "hidden"
                }}>
                    {/* ── HERO GRADIENT COVER BANNER ── */}
                    <Box sx={{
                        height: '110px',
                        width: '100%',
                        background: 'linear-gradient(135deg, #FF7B54 0%, #FF6B6B 40%, #E63946 100%)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        p: 3,
                        px: 4
                    }}>
                        <Badge
                            sx={{
                                bg: 'rgba(255, 255, 255, 0.25)',
                                backdropFilter: 'blur(10px)',
                                color: '#FFFFFF',
                                borderRadius: '12px',
                                px: 3,
                                py: 1,
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                border: '1px solid rgba(255, 255, 255, 0.35)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}
                        >
                            ✦ AURA PROFILE
                        </Badge>

                        <Box display="flex" gap={2} alignItems="center">
                            <Tooltip label="My QR / Barcode Card" hasArrow placement="bottom">
                                <Button
                                    size="xs"
                                    onClick={() => setIsQrScannerOpen(true)}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.28)',
                                        backdropFilter: 'blur(10px)',
                                        color: '#FFFFFF',
                                        borderRadius: '20px',
                                        padding: '4px 12px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        border: '1px solid rgba(255, 255, 255, 0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}
                                >
                                    <QrCodeScannerIcon style={{ fontSize: 14 }} />
                                    QR Card
                                </Button>
                            </Tooltip>
                            
                            <Box
                                onClick={onClose}
                                sx={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    bg: 'rgba(255, 255, 255, 0.25)',
                                    backdropFilter: 'blur(10px)',
                                    color: '#FFFFFF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    border: '1px solid rgba(255, 255, 255, 0.4)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        bg: 'rgba(255, 255, 255, 0.4)',
                                        transform: 'scale(1.08)'
                                    }
                                }}
                            >
                                <CloseIcon style={{ fontSize: 11 }} />
                            </Box>
                        </Box>
                    </Box>

                    <ModalBody className="text-center pb-6 pt-0 px-6">
                        {/* ── OVERLAY AVATAR HERO ── */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3, position: 'relative', marginTop: '-55px' }}>
                            <Box sx={{
                                position: 'relative',
                                display: 'inline-block'
                            }}>
                                <Tooltip label="Click to preview picture" hasArrow placement="top">
                                    <Avatar
                                        size="2xl"
                                        name={user && user.name}
                                        src={user && user.pic}
                                        bg="#E63946"
                                        color="#FFFFFF"
                                        onClick={() => setIsPreviewPicOpen(true)}
                                        style={{
                                            width: '118px',
                                            height: '118px',
                                            border: "4px solid #FFFFFF",
                                            boxShadow: "0 14px 35px rgba(230, 57, 70, 0.25)",
                                            cursor: 'pointer'
                                        }}
                                    />
                                </Tooltip>
                                
                                {/* Floating Camera Change Badge */}
                                <Tooltip label="Change Avatar Photo" hasArrow placement="bottom">
                                    <Box
                                        onClick={() => setIsAvatarStudioOpen(true)}
                                        sx={{
                                            position: 'absolute',
                                            bottom: '2px',
                                            right: '2px',
                                            bg: '#E63946',
                                            color: '#FFFFFF',
                                            borderRadius: '50%',
                                            width: '34px',
                                            height: '34px',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s ease',
                                            border: '3px solid #FFFFFF',
                                            '&:hover': {
                                                bg: '#d62839',
                                                transform: 'scale(1.12)'
                                            }
                                        }}
                                    >
                                        <CameraAltIcon style={{ fontSize: 15 }} />
                                    </Box>
                                </Tooltip>
                            </Box>

                            {/* User Hero Titles */}
                            <h3 style={{ margin: '12px 0 2px', fontSize: "1.4rem", fontWeight: 800, color: "#18181B", fontFamily: "'Outfit', sans-serif" }}>
                                {user?.name || "Aura User"}
                            </h3>
                            <Badge
                                sx={{
                                    bg: '#FFF0F2',
                                    color: '#E63946',
                                    borderRadius: '20px',
                                    px: 3,
                                    py: 0.8,
                                    fontSize: '0.82rem',
                                    fontWeight: 800,
                                    border: '1px solid #FFE3E6',
                                    letterSpacing: '0.02em'
                                }}
                            >
                                @{user?.username || (user?.email ? user.email.split('@')[0] : 'aura_user')}
                            </Badge>
                        </Box>

                        {/* ── PROFILE DETAILS EDITABLE CARDS ── */}
                        <VStack spacing={3} width="100%" mb={5}>
                            {/* 1. DISPLAY NAME CARD */}
                            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} style={{ width: '100%' }}>
                                <Box sx={{
                                    width: '100%',
                                    p: 2.8,
                                    px: 3.5,
                                    borderRadius: '20px',
                                    background: '#FFFFFF',
                                    border: '1px solid #ECE9E3',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    boxShadow: '0 4px 16px rgba(61, 43, 38, 0.03)'
                                }}>
                                    <Box sx={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '14px',
                                        background: '#FFF0F2',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <PersonOutlineIcon style={{ color: '#E63946', fontSize: 21 }} />
                                    </Box>
                                    <span style={{ flexGrow: 1, textAlign: 'left' }}>
                                        <strong style={{ color: '#909893', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '1px' }}>Display Name</strong>
                                        {isEditingName ? (
                                            <Input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                autoFocus
                                                size="sm"
                                                mt={1}
                                                borderRadius="8px"
                                                border="1.5px solid #E63946"
                                                focusBorderColor="#E63946"
                                                bg="#FFFFFF"
                                                fontWeight="600"
                                            />
                                        ) : (
                                            <span style={{ fontWeight: 700, color: '#18181B', fontSize: '0.98rem' }}>{user && user.name}</span>
                                        )}
                                    </span>
                                    {isEditingName ? (
                                        <Box display="flex" gap={1}>
                                            <Button
                                                size="xs"
                                                onClick={handleSaveName}
                                                style={{ background: '#E63946', color: '#FFF', borderRadius: '8px', minW: '28px', padding: '0 8px' }}
                                            >
                                                <CheckIcon fontSize="12px" />
                                            </Button>
                                            <Button
                                                size="xs"
                                                onClick={() => setIsEditingName(false)}
                                                style={{ background: '#EAEBE9', color: '#707772', borderRadius: '8px', minW: '28px', padding: '0 8px' }}
                                            >
                                                <CloseIcon fontSize="10px" />
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Tooltip label="Edit Display Name" hasArrow placement="top">
                                            <Button
                                                size="xs"
                                                onClick={() => { setEditName(user?.name || ''); setIsEditingName(true); }}
                                                style={{ background: '#FFF0F2', color: '#E63946', borderRadius: '20px', border: '1px solid #FFE3E6', padding: '4px 12px', fontWeight: 700, fontSize: '0.75rem' }}
                                            >
                                                <EditIcon fontSize="11px" style={{ marginRight: '4px' }} /> Edit
                                            </Button>
                                        </Tooltip>
                                    )}
                                </Box>
                            </motion.div>

                            {/* 2. UNIQUE USERNAME CARD */}
                            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} style={{ width: '100%' }}>
                                <Box sx={{
                                    width: '100%',
                                    p: 2.8,
                                    px: 3.5,
                                    borderRadius: '20px',
                                    background: '#FFFFFF',
                                    border: '1px solid #ECE9E3',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    boxShadow: '0 4px 16px rgba(61, 43, 38, 0.03)'
                                }}>
                                    <Box sx={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '14px',
                                        background: '#FFF0F2',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <AlternateEmailIcon style={{ color: '#E63946', fontSize: 20 }} />
                                    </Box>
                                    <span style={{ flexGrow: 1, textAlign: 'left', wordBreak: 'break-all' }}>
                                        <strong style={{ color: '#909893', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '1px' }}>Unique Username</strong>
                                        {isEditingUsername ? (
                                            <Input
                                                value={editUsername}
                                                onChange={(e) => setEditUsername(e.target.value)}
                                                autoFocus
                                                size="sm"
                                                mt={1}
                                                borderRadius="8px"
                                                border="1.5px solid #E63946"
                                                focusBorderColor="#E63946"
                                                bg="#FFFFFF"
                                                fontWeight="700"
                                                color="#E63946"
                                                placeholder="e.g. vicky123"
                                            />
                                        ) : (
                                            <span style={{ fontWeight: 800, color: '#E63946', fontSize: '0.98rem' }}>@{user?.username || (user?.email ? user.email.split('@')[0] : 'aura_user')}</span>
                                        )}
                                    </span>
                                    {isEditingUsername ? (
                                        <Box display="flex" gap={1}>
                                            <Button
                                                size="xs"
                                                onClick={handleSaveUsername}
                                                style={{ background: '#E63946', color: '#FFF', borderRadius: '8px', minW: '28px', padding: '0 8px' }}
                                            >
                                                <CheckIcon fontSize="12px" />
                                            </Button>
                                            <Button
                                                size="xs"
                                                onClick={() => setIsEditingUsername(false)}
                                                style={{ background: '#EAEBE9', color: '#707772', borderRadius: '8px', minW: '28px', padding: '0 8px' }}
                                            >
                                                <CloseIcon fontSize="10px" />
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Box display="flex" gap={1.5}>
                                            <Tooltip label="Edit Username" hasArrow placement="top">
                                                <Button
                                                    size="xs"
                                                    onClick={() => { setEditUsername(user?.username || ''); setIsEditingUsername(true); }}
                                                    style={{ background: '#FFF0F2', color: '#E63946', borderRadius: '20px', border: '1px solid #FFE3E6', padding: '4px 12px', fontWeight: 700, fontSize: '0.75rem' }}
                                                >
                                                    <EditIcon fontSize="11px" style={{ marginRight: '4px' }} /> Edit
                                                </Button>
                                            </Tooltip>
                                            <Tooltip label="Copy Username" hasArrow placement="top">
                                                <Button
                                                    size="xs"
                                                    onClick={() => {
                                                        const uName = user?.username || (user?.email ? user.email.split('@')[0] : 'aura_user');
                                                        navigator.clipboard.writeText(`@${uName}`);
                                                        toast.success('Username copied!', { autoClose: 1500, hideProgressBar: true });
                                                    }}
                                                    style={{ background: '#FFF0F2', color: '#E63946', borderRadius: '20px', border: '1px solid #FFE3E6', padding: '4px 12px', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    <ContentCopyIcon style={{ fontSize: 12 }} /> Copy
                                                </Button>
                                            </Tooltip>
                                        </Box>
                                    )}
                                </Box>
                            </motion.div>

                            {/* 3. EMAIL ADDRESS CARD */}
                            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} style={{ width: '100%' }}>
                                <Box sx={{
                                    width: '100%',
                                    p: 2.8,
                                    px: 3.5,
                                    borderRadius: '20px',
                                    background: '#FFFFFF',
                                    border: '1px solid #ECE9E3',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    boxShadow: '0 4px 16px rgba(61, 43, 38, 0.03)'
                                }}>
                                    <Box sx={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '14px',
                                        background: '#FFF0F2',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <EmailIcon style={{ color: '#E63946', fontSize: 21 }} />
                                    </Box>
                                    <span style={{ flexGrow: 1, textAlign: 'left', wordBreak: 'break-all' }}>
                                        <strong style={{ color: '#909893', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '1px' }}>Email Address</strong>
                                        {isEditingEmail ? (
                                            <Input
                                                value={editEmail}
                                                onChange={(e) => setEditEmail(e.target.value)}
                                                autoFocus
                                                size="sm"
                                                mt={1}
                                                borderRadius="8px"
                                                border="1.5px solid #E63946"
                                                focusBorderColor="#E63946"
                                                bg="#FFFFFF"
                                                fontWeight="600"
                                            />
                                        ) : (
                                            <span style={{ fontWeight: 600, color: '#303633', fontSize: '0.95rem' }}>{user && user.email}</span>
                                        )}
                                    </span>
                                    {isEditingEmail ? (
                                        <Box display="flex" gap={1}>
                                            <Button
                                                size="xs"
                                                onClick={handleSaveEmail}
                                                style={{ background: '#E63946', color: '#FFF', borderRadius: '8px', minW: '28px', padding: '0 8px' }}
                                            >
                                                <CheckIcon fontSize="12px" />
                                            </Button>
                                            <Button
                                                size="xs"
                                                onClick={() => setIsEditingEmail(false)}
                                                style={{ background: '#EAEBE9', color: '#707772', borderRadius: '8px', minW: '28px', padding: '0 8px' }}
                                            >
                                                <CloseIcon fontSize="10px" />
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Tooltip label="Edit Email" hasArrow placement="top">
                                            <Button
                                                size="xs"
                                                onClick={() => { setEditEmail(user?.email || ''); setIsEditingEmail(true); }}
                                                style={{ background: '#FFF0F2', color: '#E63946', borderRadius: '20px', border: '1px solid #FFE3E6', padding: '4px 12px', fontWeight: 700, fontSize: '0.75rem' }}
                                            >
                                                <EditIcon fontSize="11px" style={{ marginRight: '4px' }} /> Edit
                                            </Button>
                                        </Tooltip>
                                    )}
                                </Box>
                            </motion.div>
                        </VStack>

                        {/* ── MODAL FOOTER DUAL ACTION PILL BUTTONS ── */}
                        <Box display="flex" gap={3} justifyContent="center" width="100%">
                            <MDBBtn
                                onClick={() => setIsAvatarStudioOpen(true)}
                                style={{
                                    flex: 1,
                                    background: '#FFF0F2',
                                    color: '#E63946',
                                    fontWeight: 700,
                                    height: '46px',
                                    borderRadius: '30px',
                                    border: '1px solid #FFE3E6',
                                    textTransform: 'none',
                                    boxShadow: 'none',
                                    fontSize: '0.9rem'
                                }}
                            >
                                📷 Avatar Studio
                            </MDBBtn>
                            <MDBBtn
                                onClick={onClose}
                                style={{
                                    flex: 1,
                                    background: 'linear-gradient(135deg, #E63946 0%, #d62839 100%)',
                                    color: '#FFFFFF',
                                    fontWeight: 700,
                                    height: '46px',
                                    borderRadius: '30px',
                                    textTransform: 'none',
                                    boxShadow: '0 8px 24px rgba(230, 57, 70, 0.35)',
                                    fontSize: '0.9rem'
                                }}
                            >
                                Done
                            </MDBBtn>
                        </Box>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* ── DIGITAL VIP QR PASS MODAL (ULTRA-AESTHETIC DESIGN) ── */}
            <Modal isOpen={isQrScannerOpen} onClose={() => setIsQrScannerOpen(false)} size="md" isCentered>
                <ModalOverlay style={{ backdropFilter: "blur(14px)", background: "rgba(15, 12, 10, 0.55)" }} />
                <ModalContent style={{
                    borderRadius: '32px',
                    background: '#FAF8F5',
                    color: '#303633',
                    border: '1px solid rgba(230, 57, 70, 0.15)',
                    boxShadow: '0 35px 80px rgba(30, 20, 15, 0.25)',
                    overflow: 'hidden'
                }}>
                    {/* Hero Header Cover */}
                    <Box sx={{
                        height: '110px',
                        width: '100%',
                        background: 'linear-gradient(135deg, #18181B 0%, #27272A 50%, #3F3F46 100%)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        p: 3,
                        px: 4
                    }}>
                        <Badge
                            sx={{
                                bg: 'rgba(255, 255, 255, 0.15)',
                                backdropFilter: 'blur(10px)',
                                color: '#FFFFFF',
                                borderRadius: '12px',
                                px: 3,
                                py: 1,
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}
                        >
                            ✦ DIGITAL VIP PASS
                        </Badge>
                        <Box
                            onClick={() => setIsQrScannerOpen(false)}
                            sx={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                bg: 'rgba(255, 255, 255, 0.15)',
                                backdropFilter: 'blur(10px)',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                '&:hover': {
                                    bg: '#E63946',
                                    transform: 'scale(1.1)'
                                }
                            }}
                        >
                            <CloseIcon style={{ fontSize: 10 }} />
                        </Box>
                    </Box>

                    <ModalBody className="text-center pb-6 pt-0 px-6">
                        {/* Overlapping Avatar Circle */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4, position: 'relative', marginTop: '-45px' }}>
                            <Avatar
                                size="lg"
                                name={user && user.name}
                                src={user && user.pic}
                                bg="#E63946"
                                color="#FFFFFF"
                                style={{
                                    width: '86px',
                                    height: '86px',
                                    border: "3.5px solid #FFFFFF",
                                    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.2)"
                                }}
                            />
                            <h4 style={{ margin: '10px 0 2px', fontSize: '1.25rem', fontWeight: 800, color: '#18181B', fontFamily: "'Outfit', sans-serif" }}>
                                {user?.name || "Aura User"}
                            </h4>
                            <Badge
                                sx={{
                                    bg: '#FFF0F2',
                                    color: '#E63946',
                                    borderRadius: '20px',
                                    px: 3,
                                    py: 0.6,
                                    fontSize: '0.8rem',
                                    fontWeight: 800,
                                    border: '1px solid #FFE3E6'
                                }}
                            >
                                @{user?.username || (user?.email ? user.email.split('@')[0] : 'aura_user')}
                            </Badge>
                        </Box>

                        {/* Pristine QR Code Container */}
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.25 }}>
                            <Box sx={{
                                p: 4,
                                borderRadius: '24px',
                                background: '#FFFFFF',
                                border: '1px solid #ECE9E3',
                                boxShadow: '0 16px 40px rgba(61, 43, 38, 0.06)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                mb: 5
                            }}>
                                <Box sx={{
                                    p: 3,
                                    borderRadius: '20px',
                                    background: 'linear-gradient(135deg, #FFF0F2 0%, #FFFFFF 100%)',
                                    border: '1.5px solid #FFE3E6',
                                    boxShadow: 'inset 0 2px 6px rgba(230, 57, 70, 0.05)',
                                    mb: 3
                                }}>
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=@${user?.username || (user?.email ? user.email.split('@')[0] : 'aura_user')}`}
                                        alt="User QR Code"
                                        style={{ width: '160px', height: '160px', borderRadius: '12px', display: 'block' }}
                                    />
                                </Box>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#806C65', fontWeight: 600 }}>
                                    📱 Scan payload to instantly view profile card
                                </p>
                            </Box>
                        </motion.div>

                        {/* Dual Action Buttons */}
                        <Box display="flex" gap={3} width="100%">
                            <Button
                                onClick={() => {
                                    const uName = user?.username || (user?.email ? user.email.split('@')[0] : 'aura_user');
                                    navigator.clipboard.writeText(`@${uName}`);
                                    toast.success('Username copied!', { autoClose: 1500, hideProgressBar: true });
                                }}
                                style={{
                                    flex: 1,
                                    background: '#FFF0F2',
                                    color: '#E63946',
                                    fontWeight: 700,
                                    height: '44px',
                                    borderRadius: '24px',
                                    border: '1px solid #FFE3E6',
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                <ContentCopyIcon style={{ fontSize: 14 }} /> Copy Handle
                            </Button>
                            <Button
                                onClick={() => setIsQrScannerOpen(false)}
                                style={{
                                    flex: 1,
                                    background: 'linear-gradient(135deg, #E63946 0%, #d62839 100%)',
                                    color: '#FFFFFF',
                                    fontWeight: 700,
                                    height: '44px',
                                    borderRadius: '24px',
                                    boxShadow: '0 6px 20px rgba(230, 57, 70, 0.3)',
                                    fontSize: '0.85rem'
                                }}
                            >
                                Close Pass
                            </Button>
                        </Box>
                    </ModalBody>
                </ModalContent>
            </Modal>

            <AvatarCameraModal
                isOpen={isAvatarStudioOpen}
                onClose={() => setIsAvatarStudioOpen(false)}
                onSelectMedia={handleUpdatePic}
                currentPic={user?.pic}
            />

            {/* ── HIGH-RES PROFILE PICTURE PREVIEW LIGHTBOX MODAL ── */}
            <Modal isOpen={isPreviewPicOpen} onClose={() => setIsPreviewPicOpen(false)} size="md" isCentered>
                <ModalOverlay style={{ backdropFilter: "blur(20px)", background: "rgba(10, 10, 12, 0.85)" }} />
                <ModalContent style={{
                    borderRadius: '32px',
                    background: 'rgba(24, 24, 27, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    boxShadow: '0 40px 100px rgba(0, 0, 0, 0.7)',
                    overflow: 'hidden',
                    color: '#FFFFFF'
                }}>
                    {/* Header */}
                    <Box sx={{
                        p: 3,
                        px: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#E63946', fontSize: '1.1rem' }}>✦</span>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#FFFFFF', letterSpacing: '0.04em' }}>PROFILE PICTURE PREVIEW</span>
                        </div>
                        <Box
                            onClick={() => setIsPreviewPicOpen(false)}
                            sx={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                bg: 'rgba(255, 255, 255, 0.15)',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    bg: '#E63946',
                                    transform: 'scale(1.1)'
                                }
                            }}
                        >
                            <CloseIcon style={{ fontSize: 10 }} />
                        </Box>
                    </Box>

                    <ModalBody display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={6} px={6}>
                        {/* Avatar High-Res Photo Container */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            <Box sx={{
                                p: '4px',
                                borderRadius: '28px',
                                background: 'linear-gradient(135deg, rgba(230, 57, 70, 0.6) 0%, rgba(255, 255, 255, 0.3) 100%)',
                                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
                                display: 'inline-block'
                            }}>
                                <img
                                    src={user?.pic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                    alt={user?.name || "Profile Picture"}
                                    style={{
                                        width: '240px',
                                        height: '240px',
                                        borderRadius: '24px',
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
                            <Text color="#FFFFFF" fontSize="1.25rem" fontWeight="800" fontFamily="'Outfit', sans-serif">
                                {user?.name}
                            </Text>
                            <Badge
                                sx={{
                                    mt: 1,
                                    bg: 'rgba(230, 57, 70, 0.2)',
                                    color: '#FF6B6B',
                                    borderRadius: '20px',
                                    px: 3,
                                    py: 0.8,
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    border: '1px solid rgba(230, 57, 70, 0.4)'
                                }}
                            >
                                @{user?.username || (user?.email ? user.email.split('@')[0] : 'aura_user')}
                            </Badge>
                        </Box>

                        {/* Action Pill Buttons */}
                        <Box display="flex" gap={3} mt={6} width="100%">
                            <Button
                                onClick={() => {
                                    setIsPreviewPicOpen(false);
                                    setIsAvatarStudioOpen(true);
                                }}
                                style={{
                                    flex: 1,
                                    background: 'rgba(255, 255, 255, 0.12)',
                                    color: '#FFFFFF',
                                    fontWeight: 700,
                                    height: '42px',
                                    borderRadius: '24px',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    fontSize: '0.85rem'
                                }}
                            >
                                📷 Change Photo
                            </Button>
                            <Button
                                onClick={() => setIsPreviewPicOpen(false)}
                                style={{
                                    flex: 1,
                                    background: '#E63946',
                                    color: '#FFFFFF',
                                    fontWeight: 700,
                                    height: '42px',
                                    borderRadius: '24px',
                                    boxShadow: '0 6px 20px rgba(230, 57, 70, 0.4)',
                                    fontSize: '0.85rem'
                                }}
                            >
                                Close Preview
                            </Button>
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