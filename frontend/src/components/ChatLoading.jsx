import React from 'react';
import { Stack, Box } from "@chakra-ui/layout";
import { Skeleton, SkeletonCircle } from "@chakra-ui/react";
import { motion } from "framer-motion";

const ChatLoading = () => {
  return (
    <Stack spacing={2.5} px={1} py={1}>
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.05 }}
        >
          <Box 
            d="flex"
            alignItems="center"
            gap="12px"
            px={3}
            py={2.5}
            borderRadius="14px"
            bg="#FFFFFF"
            style={{ 
              border: "1px solid #F1F1F4", 
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02)" 
            }}
          >
            <SkeletonCircle size="10" startColor="#F4F4F5" endColor="#E4E4E7" speed={0.8} />
            <Box flex="1">
              <Skeleton height="13px" width="55%" mb={2} borderRadius="6px" startColor="#F4F4F5" endColor="#E4E4E7" speed={0.8} />
              <Skeleton height="10px" width="80%" borderRadius="4px" startColor="#FAFAFA" endColor="#F4F4F5" speed={0.8} />
            </Box>
          </Box>
        </motion.div>
      ))}
    </Stack>
  );
};

export default ChatLoading;