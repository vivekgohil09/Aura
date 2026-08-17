import React, { useState } from "react";
import { useSelector } from 'react-redux';
import { Avatar } from "@chakra-ui/avatar";
import { Box, Text } from "@chakra-ui/layout";
import { getJwtToken } from "../config/getJwt";

const UserListItem = ({ user, handleFunction }) => {
    const loggedInUser = useSelector((state) => state.user) || JSON.parse(localStorage.getItem("userInfo") || "{}");
    const loggedUserId = loggedInUser?._id || loggedInUser?.id || loggedInUser?.userId;
    const targetUserId = user?._id || user?.id;

    const storageKey = loggedUserId ? `aura_sent_requests_${loggedUserId}` : "aura_sent_requests";

    const [isSent, setIsSent] = useState(() => {
        try {
            const sentList = JSON.parse(localStorage.getItem(storageKey) || "[]");
            return targetUserId ? sentList.includes(String(targetUserId)) : false;
        } catch {
            return false;
        }
    });

    const isMe = Boolean(
        (loggedUserId && targetUserId && String(loggedUserId) === String(targetUserId)) ||
        (loggedInUser?.email && user?.email && loggedInUser.email.toLowerCase() === user.email.toLowerCase())
    );

    const handleAddClick = async (e) => {
        e.stopPropagation();
        if (handleFunction) {
            handleFunction(user);
            return;
        }
        if (isSent) return;
        if (targetUserId) {
            try {
                const token = getJwtToken();
                const response = await fetch("/api/chat/request/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
                    body: JSON.stringify({ targetUserId: String(targetUserId) })
                });
                const data = await response.json();
                if (!response.ok) {
                    const errorMsg = data?.message || data?.error || "Could not send friend request.";
                    import('react-toastify').then(({ toast }) => {
                        toast.error(errorMsg, { position: "bottom-center", autoClose: 3500 });
                    });
                    return;
                }
                setIsSent(true);
                const sentList = JSON.parse(localStorage.getItem(storageKey) || "[]");
                if (!sentList.includes(String(targetUserId))) {
                    localStorage.setItem(storageKey, JSON.stringify([...sentList, String(targetUserId)]));
                }
                import('react-toastify').then(({ toast }) => {
                    toast.success(`✨ Friend request sent to ${user?.name || 'user'}! 📨`, { position: "bottom-center", autoClose: 2500 });
                });
            } catch (err) {
                import('react-toastify').then(({ toast }) => {
                    toast.error("Failed to send friend request", { position: "bottom-center", autoClose: 2500 });
                });
            }
        }
    };

    const userStatuses = useSelector(state => state.userStatuses) || {};
    const statusObj = userStatuses[targetUserId] || {};
    const isOnlineNow = Boolean(statusObj.isOnline);

    return (
        <Box
            onClick={handleAddClick}
            cursor="pointer"
            bg={isMe ? "rgba(91, 95, 239, 0.08)" : "#FFFFFF"}
            _hover={{
                background: isMe ? "rgba(91, 95, 239, 0.14)" : "#FBFBF9",
                color: "#171827",
                transform: "translateY(-1px)",
                borderColor: "#5B5FEF",
                boxShadow: "0 6px 20px rgba(91, 95, 239, 0.12)"
            }}
            transition="all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
            w="100%"
            d="flex"
            alignItems="center"
            color="#171827"
            px={3.5}
            py={2.5}
            my={1.5}
            borderRadius="18px"
            border={isMe ? "1.5px solid #5B5FEF" : "1px solid rgba(23, 24, 39, 0.06)"}
            boxShadow="0 2px 8px rgba(23, 24, 39, 0.02)"
        >
            <Box
                sx={{
                    position: 'relative',
                    width: '44px',
                    height: '44px',
                    minWidth: '44px',
                    borderRadius: '50%',
                    padding: '1.5px',
                    background: 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                    mr: 3,
                    boxShadow: '0 4px 14px rgba(91, 95, 239, 0.25)',
                    flexShrink: 0
                }}
            >
                <Avatar
                    size="full"
                    name={user?.name || "Aura User"}
                    src={user?.pic && typeof user.pic === 'string' && user.pic.length > 5 && !user.pic.includes("icon-library.com") && !user.pic.includes("flaticon.com") ? user.pic : undefined}
                    fontWeight="800"
                    style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        border: '2px solid #FFFFFF'
                    }}
                />
                {/* Presence badge */}
                <div
                    className={isOnlineNow ? "aura-presence-pulse-active" : "aura-presence-pulse-offline"}
                    style={{
                        position: 'absolute',
                        right: 0,
                        bottom: 0,
                        zIndex: 2
                    }}
                />
            </Box>
            <Box style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <Box style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                    <Text fontWeight="800" fontSize="sm" color="#171827" isTruncated style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {user.name}
                    </Text>
                    {isMe && (
                        <span style={{
                            background: 'linear-gradient(135deg, #5B5FEF, #8067E8)',
                            color: '#FFFFFF',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '99px',
                            letterSpacing: '0.03em',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            boxShadow: '0 2px 6px rgba(91, 95, 239, 0.25)'
                        }}>
                            (Me)
                        </span>
                    )}
                </Box>
                <Text fontSize="xs" color="#5B5FEF" isTruncated style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700 }}>
                    @{user.username || (user.email ? user.email.split('@')[0] : 'user')}
                </Text>
            </Box>
            {!isMe && (
                <button
                    type="button"
                    onClick={handleAddClick}
                    style={{
                        background: isSent
                            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                            : 'linear-gradient(135deg, #5B5FEF 0%, #8067E8 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '99px',
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        cursor: 'pointer',
                        flexShrink: 0,
                        marginLeft: '8px',
                        boxShadow: isSent
                            ? '0 3px 10px rgba(16, 185, 129, 0.25)'
                            : '0 4px 14px rgba(91, 95, 239, 0.28)',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {isSent ? 'Requested' : '+ Add'}
                </button>
            )}
        </Box>
    );
};

export default UserListItem;