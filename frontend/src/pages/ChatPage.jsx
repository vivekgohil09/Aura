import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import SideBar from "../components/SideBar";
import MyChat from "../components/MyChat";
import ChatBox from "../components/ChatBox";
import { Box } from "@chakra-ui/layout";
import { useSelector, useDispatch } from "react-redux";
import { setUserDetails } from "../redux/actions";
import { useDisclosure } from '@chakra-ui/hooks';

const ChatPage = () => {
  const [fetchAgain, setFetchAgain] = useState(false);
  const user = useSelector(state => state.user);
  const history = useHistory();
  const { isOpen: isDrawerOpen, onOpen: onOpenDrawer, onClose: onCloseDrawer } = useDisclosure();
  const dispatch = useDispatch();

  useEffect(() => {
    document.title = "Aura | Home";
    const usersData = JSON.parse(localStorage.getItem("userInfo"));
    if (!usersData) {
      history.push("/login");
    } else if (!user) {
      dispatch(setUserDetails(usersData));
    }
  }, [user, history, dispatch]);

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      maxHeight: "100vh",
      overflow: "hidden",
      background: "#FAFAF9",
      color: "#18181B",
      display: "flex",
      flexDirection: "column"
    }}>
      {(user || localStorage.getItem("userInfo")) && <SideBar onOpenDrawer={onOpenDrawer} />}

      <Box
        d="flex" 
        justifyContent="space-between" 
        w="100%" 
        h="calc(100vh - 64px)"
        p={{ base: "8px", sm: "12px", md: "16px" }}
        gap={{ base: "8px", sm: "12px", md: "16px" }}
        overflow="hidden"
        style={{ boxSizing: "border-box" }}
      >
        {(user || localStorage.getItem("userInfo")) && <MyChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} onOpenDrawer={onOpenDrawer} />}
        {(user || localStorage.getItem("userInfo")) && <ChatBox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} onOpenDrawer={onOpenDrawer} />}
      </Box>
    </div>
  );
};

export default ChatPage;