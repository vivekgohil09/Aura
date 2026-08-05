import { Avatar } from "@chakra-ui/avatar";
import { Box, Text } from "@chakra-ui/layout";
import { useSelector } from "react-redux";

const UserListItem = ({ user, handleFunction }) => {
    const loggedInUser = useSelector((state) => state.user) || JSON.parse(localStorage.getItem("userInfo") || "{}");
    
    const loggedUserId = loggedInUser?._id || loggedInUser?.id;
    const targetUserId = user?._id || user?.id;
    
    const isMe = Boolean(
        (loggedUserId && targetUserId && String(loggedUserId) === String(targetUserId)) || 
        (loggedInUser?.email && user?.email && loggedInUser.email.toLowerCase() === user.email.toLowerCase())
    );

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
                <Text fontSize="xs" color="#806C65" isTruncated style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.85 }}>
                    <b style={{ color: '#3D2B26' }}>Email: </b>
                    {user.email}
                </Text>
            </Box>
        </Box>
    );
};

export default UserListItem;