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
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(8px)" bg="rgba(0, 0, 0, 0.4)" />
      <ModalContent
        borderRadius="24px"
        overflow="hidden"
        boxShadow="0 20px 50px rgba(0,0,0,0.2)"
        border="1px solid #ECE9E1"
        bg="#FAF8F5"
      >
        <ModalHeader
          bg="#FFFFFF"
          borderBottom="1px solid #ECE9E1"
          py={4}
          px={6}
          display="flex"
          alignItems="center"
          gap={2.5}
        >
          <Box
            p={2.5}
            borderRadius="12px"
            bg="linear-gradient(135deg, #FFF0F2 0%, #FFF9FA 100%)"
            color="#E63946"
            border="1px solid #FFE3E6"
          >
            <FaceIcon style={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Text fontSize="1.25rem" fontWeight="800" color="#303633" letterSpacing="-0.02em">
              Profile Photo & Avatar Studio
            </Text>
            <Text fontSize="0.8rem" color="#707772" fontWeight="400">
              Upload photo, take live webcam shot, or customize live avatars
            </Text>
          </Box>
        </ModalHeader>
        <ModalCloseButton top="18px" right="18px" onClick={stopCamera} />

        <ModalBody p={6}>
          <Tabs
            variant="soft-rounded"
            colorScheme="red"
            onChange={(index) => {
              setActiveTab(index);
              if (index !== 1) stopCamera();
            }}
          >
            <TabList bg="#EFECE6" p={1} borderRadius="16px" mb={5}>
              <Tab
                borderRadius="12px"
                fontWeight="700"
                fontSize="0.85rem"
                _selected={{ bg: '#FFFFFF', color: '#E63946', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              >
                🎨 Live Avatar Studio
              </Tab>
              <Tab
                borderRadius="12px"
                fontWeight="700"
                fontSize="0.85rem"
                _selected={{ bg: '#FFFFFF', color: '#E63946', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              >
                📸 Web Camera Snapshot
              </Tab>
              <Tab
                borderRadius="12px"
                fontWeight="700"
                fontSize="0.85rem"
                _selected={{ bg: '#FFFFFF', color: '#E63946', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              >
                📁 Upload Local File
              </Tab>
            </TabList>

            <TabPanels>
              {/* TAB 1: LIVE AVATAR STUDIO */}
              <TabPanel p={0}>
                <VStack spacing={5} align="stretch">
                  <Box
                    p={4}
                    borderRadius="20px"
                    bg="#FFFFFF"
                    border="1px solid #EAE7DF"
                    display="flex"
                    flexDirection={{ base: 'column', md: 'row' }}
                    alignItems="center"
                    gap={6}
                  >
                    <motion.div
                      whileHover={{ scale: 1.05, rotate: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      style={{ position: 'relative' }}
                    >
                      <Avatar
                        size="2xl"
                        src={getAvatarUrl(currentStyle, currentSeed)}
                        border="4px solid #FFF0F2"
                        boxShadow="0 8px 24px rgba(230, 57, 70, 0.2)"
                        bg="#FFF0F2"
                      />
                      <Badge
                        position="absolute"
                        bottom="0"
                        right="0"
                        colorScheme="red"
                        borderRadius="full"
                        px={2.5}
                        py={0.5}
                        fontSize="0.75rem"
                        boxShadow="0 2px 6px rgba(0,0,0,0.15)"
                      >
                        Live
                      </Badge>
                    </motion.div>

                    <VStack align="start" spacing={3} flex={1} w="100%">
                      <Text fontWeight="750" color="#303633" fontSize="0.95rem">
                        Select Avatar Style
                      </Text>
                      <HStack spacing={2} wrap="wrap">
                        {AVATAR_STYLES.map((style) => (
                          <Button
                            key={style.id}
                            size="xs"
                            borderRadius="10px"
                            variant={currentStyle === style.id ? 'solid' : 'outline'}
                            colorScheme="red"
                            onClick={() => {
                              setCurrentStyle(style.id);
                              const avatarUrl = getAvatarUrl(style.id, currentSeed);
                              setSelectedImage(avatarUrl);
                            }}
                          >
                            {style.name}
                          </Button>
                        ))}
                      </HStack>

                      <HStack w="100%" justify="space-between" pt={2}>
                        <Text fontWeight="600" color="#555" fontSize="0.85rem">
                          Pick Preset or Shuffle
                        </Text>
                        <IconButton
                          icon={<RefreshIcon />}
                          size="xs"
                          colorScheme="red"
                          variant="ghost"
                          title="Shuffle Seed"
                          onClick={() => {
                            const randomSeed = Math.random().toString(36).substring(7);
                            setCurrentSeed(randomSeed);
                            setSelectedImage(getAvatarUrl(currentStyle, randomSeed));
                          }}
                        />
                      </HStack>
                    </VStack>
                  </Box>

                  <Text fontWeight="750" color="#303633" fontSize="0.9rem">
                    Popular Live Avatars
                  </Text>
                  <Grid templateColumns="repeat(4, 1fr)" gap={3} maxH="180px" overflowY="auto" p={1}>
                    {PRESET_SEEDS.map((seed) => {
                      const url = getAvatarUrl(currentStyle, seed);
                      const isSelected = selectedImage === url;
                      return (
                        <motion.div
                          key={seed}
                          whileHover={{ y: -3, scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Box
                            p={2.5}
                            borderRadius="16px"
                            bg={isSelected ? '#FFF0F2' : '#FFFFFF'}
                            border={isSelected ? '2px solid #E63946' : '1px solid #EAE7DF'}
                            cursor="pointer"
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            position="relative"
                            style={{ boxShadow: isSelected ? "0 4px 12px rgba(230, 57, 70, 0.12)" : "none" }}
                            onClick={() => {
                              setCurrentSeed(seed);
                              setSelectedImage(url);
                            }}
                          >
                            {isSelected && (
                              <CheckCircleIcon
                                style={{
                                  position: 'absolute',
                                  top: 6,
                                  right: 6,
                                  color: '#E63946',
                                  fontSize: 16,
                                }}
                              />
                            )}
                            <Avatar size="lg" src={url} bg="#FFF0F2" mb={1} />
                            <Text fontSize="0.75rem" fontWeight="700" color="#303633" isTruncated maxW="100%">
                              {seed}
                            </Text>
                          </Box>
                        </motion.div>
                      );
                    })}
                  </Grid>
                </VStack>
              </TabPanel>

              {/* TAB 2: CAMERA SNAPSHOT */}
              <TabPanel p={0}>
                <VStack spacing={4}>
                  {!cameraActive ? (
                    <Box
                      w="100%"
                      h="260px"
                      borderRadius="20px"
                      bg="#1E2421"
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      color="#FFFFFF"
                      gap={3}
                    >
                      <CameraAltIcon style={{ fontSize: 48, color: '#E63946' }} />
                      <Text color="#CCCCCC" fontSize="0.9rem">
                        {cameraError || 'Camera is turned off'}
                      </Text>
                      <Button
                        leftIcon={<CameraAltIcon />}
                        colorScheme="red"
                        borderRadius="12px"
                        onClick={startCamera}
                      >
                        Start Camera
                      </Button>
                    </Box>
                  ) : (
                    <VStack w="100%">
                      <Box
                        position="relative"
                        w="100%"
                        h="260px"
                        borderRadius="20px"
                        overflow="hidden"
                        bg="#000"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Box>
                      <HStack spacing={3}>
                        <Button
                          leftIcon={<CameraAltIcon />}
                          colorScheme="red"
                          borderRadius="12px"
                          onClick={capturePhoto}
                        >
                          Snap Photo
                        </Button>
                        <Button
                          variant="outline"
                          colorScheme="red"
                          borderRadius="12px"
                          onClick={stopCamera}
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
                    h="200px"
                    borderRadius="20px"
                    border="2px dashed #E63946"
                    bg="#FFF0F2"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    position="relative"
                    _hover={{ bg: '#FFE3E6' }}
                    transition="all 0.2s"
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
                    <UploadFileIcon style={{ fontSize: 48, color: '#E63946', marginBottom: 8 }} />
                    <Text fontWeight="700" color="#303633" fontSize="0.95rem">
                      Click or drag image file here to upload
                    </Text>
                    <Text fontSize="0.8rem" color="#707772">
                      Supports JPG, PNG, WEBP (Auto compressed to Base64)
                    </Text>
                  </Box>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>

          {/* ACTIVE PREVIEW FOOTER */}
          {selectedImage && (
            <Box
              mt={4}
              p={3}
              borderRadius="16px"
              bg="#FFFFFF"
              border="1px solid #FFE3E6"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              style={{ boxShadow: "0 4px 15px rgba(230, 57, 70, 0.06)" }}
            >
              <HStack spacing={3}>
                <Avatar size="md" src={selectedImage} border="2px solid #E63946" />
                <Box>
                  <Text fontSize="0.85rem" fontWeight="700" color="#303633">
                    Selected Image Ready
                  </Text>
                  <Text fontSize="0.75rem" color="#E63946">
                    Base64 / Vector URL stream ready for database update
                  </Text>
                </Box>
              </HStack>
              <Button
                colorScheme="red"
                size="sm"
                borderRadius="10px"
                onClick={handleSave}
              >
                Apply Selection
              </Button>
            </Box>
          )}
        </ModalBody>

        <ModalFooter borderTop="1px solid #ECE9E1" bg="#FFFFFF" py={3} px={6}>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose} borderRadius="12px">
              Cancel
            </Button>
            <Button
              colorScheme="red"
              borderRadius="12px"
              isDisabled={!selectedImage}
              onClick={handleSave}
            >
              Save & Update Profile
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
