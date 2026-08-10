import React from 'react';
import { Center, Spinner } from "@chakra-ui/react";

const ChatLoading = () => {
  return (
    <Center w="100%" h="100%" minH="200px">
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="red.500"
        size="xl"
      />
    </Center>
  );
};

export default ChatLoading;