import React from 'react';
import { useSelector } from 'react-redux';
import { Box } from "@chakra-ui/layout";
import SingleChat from "./SingleChat";

const ChatBox = ({ fetchAgain, setFetchAgain, onOpenDrawer }) => {
  const selectedChat = useSelector(state => state.selectedChats);

  return (
    <Box
      d={{ base: selectedChat ? "flex" : "none", md: "flex" }}
      alignItems="center"
      flexDir="column"
      p={3}
      bg="rgba(255, 255, 255, 0.95)"
      position="relative"
      zIndex={1}
      style={{
        border: "1.5px solid rgba(212, 175, 55, 0.25)",
        boxShadow: "0 10px 40px rgba(15, 23, 42, 0.05), 0 0 20px rgba(212, 175, 55, 0.08)",
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