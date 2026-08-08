import React, { useState } from "react";
import { Avatar } from "@chakra-ui/avatar";
import { Box, Text } from "@chakra-ui/layout";
import { useSelector } from "react-redux";

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

    const handleAddClick = (e) => {
        e.stopPropagation();
        if (isSent) return;
        setIsSent(true);
        if (targetUserId) {
            try {
                const sentList = JSON.parse(localStorage.getItem(storageKey) || "[]");
                if (!sentList.includes(String(targetUserId))) {
                    localStorage.setItem(storageKey, JSON.stringify([...sentList, String(targetUserId)]));
                }
            } catch (e) {}
        }
        if (handleFunction) handleFunction(user);
    };

    return (
        <Box
            onClick={handleFunction}
            cursor="pointer"
            bg={isMe ? "rgba(230, 57, 70, 0.06)" : "#FFF9F2"}
            _hover={{
                background: isMe ? "rgba(230, 57, 70, 0.12)" : "#FDF1E4",
                color: "#3D2B26",
                transform: "translateX(4px)",
                borderColor: "#C98282"
            }}
            transition="all 0.2s cubic-bezier(0.22, 1, 0.36, 1)"
            w="100%"
            d="flex"
            alignItems="center"
            color="#3D2B26"
            px={3}
            py={2.5}
            my={1.5}
            borderRadius="14px"
            border={isMe ? "1.5px solid rgba(230, 57, 70, 0.3)" : "1px solid rgba(61, 43, 38, 0.08)"}
        >
            <Avatar
                mr={3}
                size="sm"
                cursor="pointer"
                name={user.name}
                src={(!user?.pic || user?.pic.includes("icon-library.com") || user?.pic.includes("flaticon.com")) ? "" : user.pic}
                bg="#FFE3E6"
                color="#E63946"
                fontWeight="700"
            />
            <Box style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <Box style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                    <Text fontWeight="700" fontSize="sm" isTruncated style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.name}
                    </Text>
                    {isMe && (
                        <span style={{
                            background: 'linear-gradient(135deg, #E63946, #FF8E53)',
                            color: '#FFFFFF',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '99px',
                            letterSpacing: '0.03em',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            boxShadow: '0 2px 6px rgba(230, 57, 70, 0.25)'
                        }}>
                            (Me)
                        </span>
                    )}
                </Box>
                <Text fontSize="xs" color="#E63946" isTruncated style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700 }}>
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
                            : 'linear-gradient(135deg, #E63946 0%, #D62839 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '99px',
                        padding: '6px 14px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        flexShrink: 0,
                        marginLeft: '8px',
                        boxShadow: isSent
                            ? '0 3px 10px rgba(16, 185, 129, 0.25)'
                            : '0 3px 10px rgba(230, 57, 70, 0.25)',
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