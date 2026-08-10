import React, { useState } from "react";
import { Avatar } from "@chakra-ui/avatar";
import { Box, Text } from "@chakra-ui/layout";
import { useSelector } from "react-redux";
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
        if (isSent) return;
        setIsSent(true);
        if (targetUserId) {
            try {
                const sentList = JSON.parse(localStorage.getItem(storageKey) || "[]");
                if (!sentList.includes(String(targetUserId))) {
                    localStorage.setItem(storageKey, JSON.stringify([...sentList, String(targetUserId)]));
                }
                // Call Option A Backend persistence API with correct getJwtToken()
                const token = getJwtToken();
                await fetch("/api/chat/request/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
                    body: JSON.stringify({ targetUserId: String(targetUserId) })
                });
            } catch (e) {}
        }
        if (handleFunction) handleFunction(user);
    };

    return (
        <Box
            onClick={handleAddClick}
            cursor="pointer"
            bg={isMe ? "rgba(212, 175, 55, 0.08)" : "#FFFFFF"}
            _hover={{
                background: isMe ? "rgba(212, 175, 55, 0.16)" : "#FFFDF8",
                color: "#0F172A",
                transform: "translateX(4px)",
                borderColor: "#D4AF37"
            }}
            transition="all 0.2s cubic-bezier(0.22, 1, 0.36, 1)"
            w="100%"
            d="flex"
            alignItems="center"
            color="#0F172A"
            px={3}
            py={2.5}
            my={1.5}
            borderRadius="16px"
            border={isMe ? "1.5px solid rgba(212, 175, 55, 0.4)" : "1px solid rgba(226, 232, 240, 0.8)"}
            boxShadow="0 2px 8px rgba(15, 23, 42, 0.03)"
        >
            <Avatar
                mr={3}
                size="sm"
                cursor="pointer"
                name={user.name}
                src={(!user?.pic || user?.pic.includes("icon-library.com") || user?.pic.includes("flaticon.com")) ? "" : user.pic}
                bg="#F1F5F9"
                color="#0F172A"
                fontWeight="800"
                style={{ border: "2px solid #E2E8F0" }}
            />
            <Box style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <Box style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                    <Text fontWeight="800" fontSize="sm" color="#0F172A" isTruncated style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Outfit', sans-serif" }}>
                        {user.name}
                    </Text>
                    {isMe && (
                        <span style={{
                            background: 'linear-gradient(135deg, #D4AF37, #F59E0B)',
                            color: '#FFFFFF',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '99px',
                            letterSpacing: '0.03em',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            boxShadow: '0 2px 6px rgba(212, 175, 55, 0.3)'
                        }}>
                            (Me)
                        </span>
                    )}
                </Box>
                <Text fontSize="xs" color="#D4AF37" isTruncated style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700 }}>
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
                            : 'linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '99px',
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        fontFamily: "'Outfit', sans-serif",
                        cursor: 'pointer',
                        flexShrink: 0,
                        marginLeft: '8px',
                        boxShadow: isSent
                            ? '0 3px 10px rgba(16, 185, 129, 0.25)'
                            : '0 4px 14px rgba(212, 175, 55, 0.35)',
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