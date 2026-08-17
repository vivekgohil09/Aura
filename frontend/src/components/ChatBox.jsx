import React from 'react';
import { useSelector } from 'react-redux';
import { Box } from "@chakra-ui/layout";
import SingleChat from "./SingleChat";

const ChatBox = ({ fetchAgain, setFetchAgain, onOpenDrawer }) => {
  const selectedChat = useSelector(state => state.selectedChats);

  return (
    <Box
      className="aura-chat-panel aura-chat-main-panel"
      d={{ base: selectedChat ? "flex" : "none", md: "flex" }}
      alignItems="center"
      flexDir="column"
      p={3}
      bg="rgba(255, 255, 255, 0.95)"
      position="relative"
      zIndex={1}
      style={{
        border: "1px solid rgba(23, 24, 39, 0.08)",
        boxShadow: "0 10px 40px rgba(23, 24, 39, 0.04), 0 0 20px rgba(91, 95, 239, 0.04)",
        backdropFilter: "blur(24px)"
      }}
      w={{ base: "100%", md: "68%" }}
      h="100%"
      borderRadius="24px"
      overflow="hidden"
    >
      <SingleChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} onOpenDrawer={onOpenDrawer} />
    </Box>
  );
};

export default ChatBox;
