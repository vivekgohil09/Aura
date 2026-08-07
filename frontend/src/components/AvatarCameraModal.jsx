import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  Avatar,
  Text,
  VStack,
  HStack,
  IconButton,
  Badge
} from '@chakra-ui/react';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FaceIcon from '@mui/icons-material/Face';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VerifiedIcon from '@mui/icons-material/Verified';

const AVATAR_STYLES = [
  { id: 'avataaars', name: 'Realistic Cartoon' },
  { id: 'bottts', name: 'Cyber Bot' },
  { id: 'fun-emoji', name: 'Live Emoji' },
  { id: 'lorelei', name: 'Modern Illustrated' },
  { id: 'micah', name: 'Minimalist Art' },
  { id: 'personaa', name: 'Realistic Persona' },
];

const PRESET_SEEDS = [
  'AuraVicky', 'AlexStream', 'SarahCool', 'JordanVibe', 
  'ElenaPulse', 'SamNeon', 'MayaGlow', 'ChrisWave',
  'NovaStar', 'TitanHero', 'LunaCosmic', 'ZenithMind'
];

export default function AvatarCameraModal({ isOpen, onClose, onSelectMedia, currentPic }) {
  const [selectedImage, setSelectedImage] = useState(currentPic || '');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  const [currentStyle, setCurrentStyle] = useState('avataaars');
  const [currentSeed, setCurrentSeed] = useState(PRESET_SEEDS[0]);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError('');
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera Access Error:', err);
      setCameraError('Unable to access camera. Please check permissions.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    // Set target resolution to premium 400x400 by default
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    const video = videoRef.current;
    const minDim = Math.min(video.videoWidth, video.videoHeight);
    const startX = (video.videoWidth - minDim) / 2;
    const startY = (video.videoHeight - minDim) / 2;

    ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, 400, 400);
    // Compressed JPEG 0.85 quality
    const base64Data = canvas.toDataURL('image/jpeg', 0.85);

    setSelectedImage(base64Data);
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Set target resolution to premium 400x400 by default
        const targetSize = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          height = Math.round((height * targetSize) / width);
          width = targetSize;
        } else {
          width = Math.round((width * targetSize) / height);
          height = targetSize;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        // Compressed JPEG 0.85 quality
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        setSelectedImage(base64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const getAvatarUrl = (style, seed) => {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  };

  const handleSave = () => {
    if (selectedImage) {
      onSelectMedia(selectedImage);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { stopCamera(); onClose(); }} size="2xl" isCentered scrollBehavior="inside">
      <ModalOverlay style={{ backdropFilter: "blur(24px)", background: "rgba(10, 10, 12, 0.65)" }} />
      <ModalContent
        style={{
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(40px)",
          color: "#18181B",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          borderRadius: "32px",
          boxShadow: "0 40px 100px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.5)",
          overflow: "hidden"
        }}
      >
        <Box display="flex" justifyContent="flex-end" p={4} pb={0}>
          <ModalCloseButton 
            position="static" 
            bg="rgba(0, 0, 0, 0.04)" 
            borderRadius="50%" 
            size="md" 
            _hover={{ bg: "rgba(0, 0, 0, 0.08)", color: "#18181B" }} 
            onClick={() => { stopCamera(); onClose(); }}
          />
        </Box>

        <ModalBody p={8} pt={6}>
          <Tabs
            variant="unstyled"
            onChange={(index) => {
              setActiveTab(index);
              if (index !== 1) stopCamera();
            }}
          >
            <TabList bg="rgba(0,0,0,0.03)" p={1.5} borderRadius="20px" mb={6} display="flex" gap={2}>
              <Tab
                flex={1}
                borderRadius="16px"
                fontWeight="700"
                fontSize="0.85rem"
                py={3}
                color="#71717A"
                _selected={{ bg: '#FFFFFF', color: '#E63946', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
                transition="all 0.2s"
              >
                ✨ Live Studio
              </Tab>
              <Tab
                flex={1}
                borderRadius="16px"
                fontWeight="700"
                fontSize="0.85rem"
                py={3}
                color="#71717A"
                _selected={{ bg: '#FFFFFF', color: '#E63946', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
                transition="all 0.2s"
              >
                📸 Web Camera
              </Tab>
              <Tab
                flex={1}
                borderRadius="16px"
                fontWeight="700"
                fontSize="0.85rem"
                py={3}
                color="#71717A"
                _selected={{ bg: '#FFFFFF', color: '#E63946', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
                transition="all 0.2s"
              >
                📁 Upload File
              </Tab>
            </TabList>

            <TabPanels>
              {/* TAB 1: LIVE AVATAR STUDIO */}
              <TabPanel p={0}>
                <VStack spacing={6} align="stretch">
                  <Box
                    p={5}
                    borderRadius="24px"
                    bg="rgba(255,255,255,0.6)"
                    border="1px solid rgba(0,0,0,0.04)"
                    display="flex"
                    flexDirection={{ base: 'column', md: 'row' }}
                    alignItems="center"
                    gap={8}
                    boxShadow="0 4px 20px rgba(0,0,0,0.02)"
                  >
                    <motion.div
                      whileHover={{ scale: 1.05, rotate: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      style={{ position: 'relative' }}
                    >
                      <Avatar
                        size="2xl"
                        src={getAvatarUrl(currentStyle, currentSeed)}
                        border="4px solid #FFFFFF"
                        boxShadow="0 15px 35px rgba(230, 57, 70, 0.15)"
                        bg="linear-gradient(135deg, rgba(230,57,70,0.1) 0%, rgba(255,255,255,0.8) 100%)"
                        style={{ width: '130px', height: '130px' }}
                      />
                      <Badge
                        position="absolute"
                        bottom="4px"
                        right="-10px"
                        bg="#E63946"
                        color="#FFF"
                        borderRadius="full"
                        px={3}
                        py={1}
                        fontSize="0.7rem"
                        fontWeight="800"
                        boxShadow="0 4px 12px rgba(230,57,70,0.3)"
                        border="2px solid #FFF"
                      >
                        LIVE
                      </Badge>
                    </motion.div>

                    <VStack align="start" spacing={4} flex={1} w="100%">
                      <Box w="100%" display="flex" justifyContent="space-between" alignItems="center">
                        <Text fontWeight="800" color="#18181B" fontSize="1rem" m={0}>
                            Avatar Style
                        </Text>
                        <IconButton
                            icon={<RefreshIcon style={{fontSize:18}} />}
                            size="sm"
                            bg="rgba(0,0,0,0.04)"
                            color="#18181B"
                            borderRadius="10px"
                            title="Shuffle Seed"
                            onClick={() => {
                            const randomSeed = Math.random().toString(36).substring(7);
                            setCurrentSeed(randomSeed);
                            setSelectedImage(getAvatarUrl(currentStyle, randomSeed));
                            }}
                            _hover={{ bg: "rgba(0,0,0,0.08)" }}
                        />
                      </Box>
                      <HStack spacing={2.5} wrap="wrap">
                        {AVATAR_STYLES.map((style) => (
                          <motion.div key={style.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                              <Button
                                size="sm"
                                borderRadius="12px"
                                bg={currentStyle === style.id ? '#E63946' : '#FFFFFF'}
                                color={currentStyle === style.id ? '#FFFFFF' : '#71717A'}
                                border={currentStyle === style.id ? '1px solid #E63946' : '1px solid rgba(0,0,0,0.08)'}
                                fontWeight={currentStyle === style.id ? "700" : "600"}
                                boxShadow={currentStyle === style.id ? "0 4px 12px rgba(230,57,70,0.2)" : "0 2px 8px rgba(0,0,0,0.02)"}
                                onClick={() => {
                                  setCurrentStyle(style.id);
                                  const avatarUrl = getAvatarUrl(style.id, currentSeed);
                                  setSelectedImage(avatarUrl);
                                }}
                                _hover={{
                                    bg: currentStyle === style.id ? '#D62839' : 'rgba(0,0,0,0.02)'
                                }}
                              >
                                {style.name}
                              </Button>
                          </motion.div>
                        ))}
                      </HStack>
                    </VStack>
                  </Box>

                  <Box>
                    <Text fontWeight="800" color="#18181B" fontSize="1rem" mb={4}>
                        Popular Live Avatars
                    </Text>
                    <Grid templateColumns="repeat(4, 1fr)" gap={4} maxH="220px" overflowY="auto" p={1} sx={{
                        '&::-webkit-scrollbar': { width: '6px' },
                        '&::-webkit-scrollbar-track': { background: 'transparent' },
                        '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.1)', borderRadius: '10px' }
                    }}>
                        {PRESET_SEEDS.map((seed) => {
                        const url = getAvatarUrl(currentStyle, seed);
                        const isSelected = selectedImage === url;
                        return (
                            <motion.div
                            key={seed}
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            >
                            <Box
                                p={3}
                                borderRadius="20px"
                                bg={isSelected ? 'rgba(230,57,70,0.05)' : 'rgba(255,255,255,0.6)'}
                                border={isSelected ? '2px solid #E63946' : '1px solid rgba(0,0,0,0.05)'}
                                cursor="pointer"
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                position="relative"
                                style={{ boxShadow: isSelected ? "0 8px 20px rgba(230, 57, 70, 0.15)" : "0 4px 12px rgba(0,0,0,0.02)" }}
                                onClick={() => {
                                setCurrentSeed(seed);
                                setSelectedImage(url);
                                }}
                            >
                                {isSelected && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                    <CheckCircleIcon
                                        style={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        color: '#E63946',
                                        fontSize: 18,
                                        backgroundColor: '#FFF',
                                        borderRadius: '50%'
                                        }}
                                    />
                                </motion.div>
                                )}
                                <Avatar size="lg" src={url} bg="transparent" mb={2} style={{ filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.1))' }} />
                                <Text fontSize="0.75rem" fontWeight="700" color={isSelected ? '#E63946' : '#71717A'} isTruncated maxW="100%" m={0}>
                                {seed}
                                </Text>
                            </Box>
                            </motion.div>
                        );
                        })}
                    </Grid>
                  </Box>
                </VStack>
              </TabPanel>

              {/* TAB 2: CAMERA SNAPSHOT */}
              <TabPanel p={0}>
                <VStack spacing={5}>
                  {!cameraActive ? (
                    <Box
                      w="100%"
                      h="300px"
                      borderRadius="24px"
                      bg="rgba(255,255,255,0.6)"
                      border="1px solid rgba(0,0,0,0.05)"
                      boxShadow="0 4px 20px rgba(0,0,0,0.02)"
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      color="#18181B"
                      gap={4}
                    >
                      <CameraAltIcon style={{ fontSize: 56, color: '#E63946', filter: 'drop-shadow(0 0 12px rgba(230,57,70,0.5))' }} />
                      <Text color="#71717A" fontSize="0.95rem" fontWeight="500">
                        {cameraError || 'Camera is turned off'}
                      </Text>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            bg="#E63946"
                            color="#FFF"
                            borderRadius="16px"
                            fontWeight="700"
                            px={6}
                            onClick={startCamera}
                            _hover={{ bg: '#D62839' }}
                            boxShadow="0 8px 20px rgba(230,57,70,0.3)"
                          >
                            <CameraAltIcon style={{ marginRight: 8, fontSize: 18 }} />
                            Start Camera
                          </Button>
                      </motion.div>
                    </Box>
                  ) : (
                    <VStack w="100%" spacing={4}>
                      <Box
                        position="relative"
                        w="100%"
                        h="300px"
                        borderRadius="24px"
                        overflow="hidden"
                        bg="#000"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        boxShadow="0 10px 30px rgba(0,0,0,0.2)"
                      >
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Box>
                      <HStack spacing={4}>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                            bg="#E63946"
                            color="#FFF"
                            borderRadius="16px"
                            fontWeight="700"
                            px={6}
                            onClick={capturePhoto}
                            _hover={{ bg: '#D62839' }}
                            boxShadow="0 8px 20px rgba(230,57,70,0.3)"
                            >
                            <CameraAltIcon style={{ marginRight: 8, fontSize: 18 }} />
                            Snap Photo
                            </Button>
                        </motion.div>
                        <Button
                          variant="ghost"
                          color="#71717A"
                          borderRadius="16px"
                          fontWeight="700"
                          px={6}
                          onClick={stopCamera}
                          _hover={{ bg: 'rgba(0,0,0,0.05)', color: '#18181B' }}
                        >
                          Stop Camera
                        </Button>
                      </HStack>
                    </VStack>
                  )}
                </VStack>
              </TabPanel>

              {/* TAB 3: FILE UPLOAD */}
              <TabPanel p={0}>
                <VStack spacing={4}>
                  <Box
                    w="100%"
                    h="260px"
                    borderRadius="24px"
                    border="2px dashed rgba(230,57,70,0.3)"
                    bg="rgba(230,57,70,0.02)"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    position="relative"
                    _hover={{ bg: 'rgba(230,57,70,0.05)', borderColor: '#E63946' }}
                    transition="all 0.3s"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                      }}
                    />
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                        <UploadFileIcon style={{ fontSize: 56, color: '#E63946', marginBottom: 12, filter: 'drop-shadow(0 8px 12px rgba(230,57,70,0.2))' }} />
                    </motion.div>
                    <Text fontWeight="800" color="#18181B" fontSize="1.1rem" mb={1}>
                      Drag & Drop Image
                    </Text>
                    <Text fontSize="0.85rem" color="#71717A" fontWeight="500">
                      Supports JPG, PNG, WEBP (Max 10MB)
                    </Text>
                  </Box>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter borderTop="1px solid rgba(0,0,0,0.04)" bg="transparent" py={4} px={8}>
          <HStack spacing={3} w="100%" justify="space-between">
             {/* PREVIEW MINI WIDGET */}
             <Box
              display="flex"
              alignItems="center"
              gap={3}
              opacity={selectedImage ? 1 : 0.4}
              transition="opacity 0.3s"
            >
                {selectedImage ? (
                    <Avatar size="sm" src={selectedImage} border="2px solid #E63946" boxShadow="0 2px 8px rgba(230,57,70,0.3)" />
                ) : (
                    <Box w="32px" h="32px" borderRadius="50%" bg="rgba(0,0,0,0.1)" />
                )}
                <Box>
                    <Text fontSize="0.8rem" fontWeight="800" color="#18181B" m={0}>
                        {selectedImage ? "Avatar Selected" : "No Selection"}
                    </Text>
                    <Text fontSize="0.7rem" color="#71717A" m={0}>
                        {selectedImage ? "Ready to apply" : "Choose an avatar"}
                    </Text>
                </Box>
             </Box>

             <Box display="flex" gap={2}>
                <Button
                variant="ghost"
                onClick={() => { stopCamera(); onClose(); }}
                borderRadius="16px"
                fontWeight="700"
                color="#71717A"
                px={6}
                _hover={{ bg: 'rgba(0,0,0,0.05)', color: '#18181B' }}
                >
                Cancel
                </Button>
                <motion.div whileHover={selectedImage ? { scale: 1.05 } : {}} whileTap={selectedImage ? { scale: 0.95 } : {}}>
                    <Button
                    bg={selectedImage ? '#18181B' : 'rgba(0,0,0,0.05)'}
                    color={selectedImage ? '#FFFFFF' : '#A1A1AA'}
                    fontWeight="800"
                    borderRadius="16px"
                    px={6}
                    boxShadow={selectedImage ? '0 8px 24px rgba(0,0,0,0.2)' : 'none'}
                    isDisabled={!selectedImage}
                    onClick={handleSave}
                    _hover={{ bg: selectedImage ? '#000000' : 'rgba(0,0,0,0.05)' }}
                    >
                    Save Avatar
                    </Button>
                </motion.div>
            </Box>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
