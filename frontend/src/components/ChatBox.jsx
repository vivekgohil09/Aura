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
      bg="#FFFFFF"
      position="relative"
      zIndex={1}
      style={{
        border: "1px solid #F1F1F4",
        boxShadow: "0 6px 24px rgba(0, 0, 0, 0.04)"
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