import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  Share,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { apiService, VideoReel } from '../utils/api';
import { launchImageLibrary } from 'react-native-image-picker';
import auth from '@react-native-firebase/auth';
import Video from 'react-native-video';
import RNFS from 'react-native-fs';
import RNShare from 'react-native-share';

const prepareVideoSource = (videoReel: VideoReel) => {
  if (videoReel.videoUrl) {
    return { uri: videoReel.videoUrl };
  }
  if (videoReel.videoData) {
    return { uri: `data:video/mp4;base64,${videoReel.videoData}` };
  }
  return {
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  };
};

const VideoModal = ({
  visible,
  videoReel,
  onClose,
}: {
  visible: boolean;
  videoReel: VideoReel | null;
  onClose: () => void;
}) => {
  const videoRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);

  const handleVideoError = (error: any) => {
    console.error('Video playback error:', error);
    Alert.alert('Playback Error', `Unable to play video: ${error?.error?.localizedDescription || error?.message || 'Unknown error'}. Please try again.`);
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  const handleBuffer = ({ isBuffering }: { isBuffering: boolean }) => {
    setBuffering(isBuffering);
  };

  const handleLoad = () => {
    setIsPlaying(true);
  };

  useEffect(() => {
    if (visible && videoReel) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [visible, videoReel]);

  if (!videoReel) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {videoReel.prompt}
            </Text>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.customControls}>
            <TouchableOpacity
              style={[styles.controlButton, !isPlaying && styles.controlButtonActive]}
              onPress={() => setIsPlaying(!isPlaying)}
            >
              <Text style={styles.controlButtonText}>
                {isPlaying ? '⏸️ Pause' : '▶️ Play'}
              </Text>
            </TouchableOpacity>
          </View>

          {(videoReel.videoData || videoReel.videoUrl) ? (
            <View style={styles.videoWrapper}>
              <Video
                ref={videoRef}
                source={prepareVideoSource(videoReel)}
                style={styles.modalVideoPlayer}
                controls={true}
                paused={!isPlaying}
                onError={handleVideoError}
                onEnd={handleVideoEnd}
                onLoad={handleLoad}
                onBuffer={handleBuffer}
                resizeMode="contain"
                playInBackground={false}
                playWhenInactive={false}
                ignoreSilentSwitch="ignore"
                volume={1.0}
                rate={1.0}
              />
              {buffering && (
                <View style={styles.bufferingOverlay}>
                  <ActivityIndicator size="large" color="#ffffff" />
                </View>
              )}
            </View>
          ) : (
            <View style={styles.modalVideoPlayer}>
              <Text style={styles.noVideoText}>No video data available</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const VideoReelCard = ({
  videoReel,
  onPlayVideo,
}: {
  videoReel: VideoReel;
  onPlayVideo: (reel: VideoReel) => void;
}) => {
  const { isDarkMode } = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '#10b981';
      case 'PROCESSING': return '#f59e0b';
      case 'PENDING': return '#3b82f6';
      case 'FAILED': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const handleShare = async () => {
    try {
      let localFilePath = '';

      if (videoReel.videoUrl) {
        // Download the video to a temporary file and share it
        const fileName = `video_reel_${Date.now()}.mp4`;
        localFilePath = `${RNFS.CachesDirectoryPath}/${fileName}`;

        await RNFS.downloadFile({
          fromUrl: videoReel.videoUrl,
          toFile: localFilePath,
        }).promise;
      } else if (videoReel.videoData) {
        // For base64 data, save to file and share
        const fileName = `video_reel_${Date.now()}.mp4`;
        localFilePath = `${RNFS.CachesDirectoryPath}/${fileName}`;

        const base64Data = videoReel.videoData.replace('data:video/mp4;base64,', '');
        await RNFS.writeFile(localFilePath, base64Data, 'base64');
      } else {
        // Fallback to text sharing if no video data
        await Share.share({
          message: `Check out this video reel: ${videoReel.prompt}`,
        });
        return;
      }

      // Share the local file using react-native-share
      const shareOptions = {
        title: 'Share Video',
        message: `Check out this video reel: ${videoReel.prompt}`,
        url: `file://${localFilePath}`,
        type: 'video/mp4',
        failOnCancel: false,
      };

      await RNShare.open(shareOptions);

      // Clean up the temporary file after sharing
      setTimeout(() => {
        RNFS.unlink(localFilePath).catch(() => {});
      }, 5000);
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Share Error', 'Unable to share the video. Please try again.');
    }
  };

  return (
    <View style={[styles.reelCard, isDarkMode ? styles.darkReelCard : styles.lightReelCard]}>
      <View style={styles.reelHeader}>
        <Text style={[styles.reelPrompt, isDarkMode ? styles.darkText : styles.lightText]} numberOfLines={2}>
          {videoReel.prompt}
        </Text>
        <Text
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(videoReel.status) },
          ]}
        >
          {videoReel.status}
        </Text>
      </View>

      <View style={styles.reelContent}>
        {videoReel.status === 'COMPLETED' && (videoReel.videoData || videoReel.videoUrl) ? (
          <View style={styles.videoContainer}>
            <Text style={[styles.videoPlaceholder, isDarkMode ? styles.darkPlaceholder : styles.lightPlaceholder]}>
              🎬 Video Available
            </Text>
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => onPlayVideo(videoReel)}
            >
              <Text style={styles.playButtonText}>▶️ Play</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Text style={styles.shareButtonText}>📤 Share</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.processingContainer}>
            <Text style={[styles.processingText, isDarkMode ? styles.darkProcessingText : styles.lightProcessingText]}>
              {videoReel.status === 'PROCESSING'
                ? '🎬 Generating video...'
                : videoReel.status === 'PENDING'
                ? '⏳ Waiting to process...'
                : videoReel.status === 'FAILED'
                ? '❌ Failed to generate video'
                : '📷 Processing images...'}
            </Text>
            {videoReel.status === 'PROCESSING' && (
              <ActivityIndicator size="small" color="#5D3FD3" />
            )}
          </View>
        )}
      </View>

      <View style={styles.reelFooter}>
        <Text style={[styles.reelDate, isDarkMode ? styles.darkFooterText : styles.lightFooterText]}>
          {new Date(videoReel.createdAt).toLocaleDateString()}
        </Text>
        {videoReel.videoDuration && (
          <Text style={[styles.reelDuration, isDarkMode ? styles.darkDuration : styles.lightDuration]}>
            {Math.round(videoReel.videoDuration)}s
          </Text>
        )}
      </View>
    </View>
  );
};

const UploadForm = ({
  showUploadForm,
  setShowUploadForm,
  selectedImages,
  setSelectedImages,
  uploadPrompt,
  setUploadPrompt,
  uploading,
  handleUpload,
}: {
  showUploadForm: boolean;
  setShowUploadForm: (show: boolean) => void;
  selectedImages: any[];
  setSelectedImages: (images: any[]) => void;
  uploadPrompt: string;
  setUploadPrompt: (prompt: string) => void;
  uploading: boolean;
  handleUpload: () => void;
}) => {
  const { isDarkMode } = useTheme();

  const handleImageSelect = (step: number) => {
    const options = {
      mediaType: 'photo' as const,
      includeBase64: true,
      maxHeight: 1200,
      maxWidth: 1600,
      selectionLimit: 1,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        return;
      }

      if (response.errorMessage) {
        Alert.alert('Error', 'Failed to select image');
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        if (asset.base64 && asset.type) {
          const imageData = `data:${asset.type};base64,${asset.base64}`;
          const newImages = [...selectedImages];
          newImages[step - 1] = { uri: asset.uri, data: imageData };
          setSelectedImages(newImages);
        }
      }
    });
  };

  if (!showUploadForm) return null;

  return (
    <View style={styles.uploadForm}>
      <ScrollView
        style={styles.uploadScrollView}
        contentContainerStyle={styles.uploadScrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Text style={[styles.uploadTitle, isDarkMode ? styles.darkText : styles.lightText]}>Create Video Reel</Text>

        <View style={styles.promptInput}>
          <Text style={[styles.inputLabel, isDarkMode ? styles.darkText : styles.lightText]}>Video Prompt *</Text>
          <TextInput
            style={[styles.textInput, isDarkMode ? styles.darkTextInput : styles.lightTextInput]}
            value={uploadPrompt}
            onChangeText={setUploadPrompt}
            placeholder="Describe the video you want to create..."
            placeholderTextColor={isDarkMode ? "#A0C4E4" : "#6B7280"}
            multiline
            numberOfLines={3}
            selectionColor="#5D3FD3"
          />
        </View>

        <View style={styles.imageUploadSection}>
          <Text style={[styles.sectionTitle, isDarkMode ? styles.darkText : styles.lightText]}>Select Images (2-3 required)</Text>

          {[1, 2, 3].map(step => (
            <View key={step} style={styles.imageStep}>
              <Text style={[styles.stepLabel, isDarkMode ? styles.darkStepLabel : styles.lightStepLabel]}>
                Image {step} {step <= 2 ? '*' : '(optional)'}
              </Text>
              <TouchableOpacity
                style={[
                  styles.imageSelectButton,
                  selectedImages[step - 1] && styles.imageSelected,
                  isDarkMode ? styles.darkImageSelect : styles.lightImageSelect,
                ]}
                onPress={() => handleImageSelect(step)}
              >
                {selectedImages[step - 1] && selectedImages[step - 1].uri ? (
                  <Image
                    key={selectedImages[step - 1].uri}
                    source={{ uri: selectedImages[step - 1].uri }}
                    style={styles.selectedImage}
                  />
                ) : (
                  <Text style={[styles.selectImageText, isDarkMode ? styles.darkSelectText : styles.lightSelectText]}>
                    🏠 Select Image
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.uploadActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            setShowUploadForm(false);
            setSelectedImages([]);
            setUploadPrompt('');
          }}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.uploadButton,
            uploading && styles.uploadButtonDisabled,
          ]}
          onPress={handleUpload}
          disabled={
            uploading || selectedImages.length < 2 || !uploadPrompt.trim()
          }
        >
          <Text style={styles.uploadButtonText}>
            {uploading ? 'Creating...' : 'Create Video Reel'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ReelsScreen = () => {
  const { isDarkMode } = useTheme();
  const [videoReels, setVideoReels] = useState<VideoReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [uploadPrompt, setUploadPrompt] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVideoReel, setSelectedVideoReel] = useState<VideoReel | null>(null);

  const loadVideoReels = useCallback(async () => {
    try {
      const response = await apiService.getUserVideoReels({
        page: 1,
        limit: 20,
      });
      setVideoReels(response.videoReels);
    } catch (error) {
      console.error('Error loading video reels:', error);
      Alert.alert('Error', 'Failed to load video reels');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadVideoReels();
    }, [loadVideoReels]),
  );

  const handleUpload = async () => {
    if (selectedImages.length < 2 || !uploadPrompt.trim()) {
      Alert.alert('Error', 'Please select at least 2 images and enter a prompt');
      return;
    }

    setUploading(true);
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const videoReelData = {
        user_id: currentUser.uid,
        prompt: uploadPrompt,
        aspect_ratio: '9:16',
        images: selectedImages.map(img => img.data),
      };

      await apiService.createVideoReel(videoReelData);

      Alert.alert('Success', 'Video reel creation started! The video will be available in a few minutes.', [
        {
          text: 'OK',
          onPress: () => {
            setShowUploadForm(false);
            setSelectedImages([]);
            setUploadPrompt('');
            loadVideoReels();
          },
        },
      ]);
    } catch (error) {
      console.error('Error creating video reel:', error);
      Alert.alert('Error', 'Failed to create video reel');
    } finally {
      setUploading(false);
    }
  };

  const handlePlayVideo = (videoReel: VideoReel) => {
    setSelectedVideoReel(videoReel);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setTimeout(() => {
      setSelectedVideoReel(null);
    }, 300);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5D3FD3" />
        <Text style={[styles.loadingText, isDarkMode ? styles.darkText : styles.lightText]}>
          Loading video reels...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode ? styles.darkContainer : styles.lightContainer]}>
      <View style={[styles.header, isDarkMode ? styles.darkHeader : styles.lightHeader]}>
        <Text style={[styles.headerTitle, isDarkMode ? styles.darkText : styles.lightText]}>Video Reels</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowUploadForm(true)}
        >
          <Text style={styles.createButtonText}>+ Create</Text>
        </TouchableOpacity>
      </View>

      {showUploadForm ? (
        <UploadForm
          showUploadForm={showUploadForm}
          setShowUploadForm={setShowUploadForm}
          selectedImages={selectedImages}
          setSelectedImages={setSelectedImages}
          uploadPrompt={uploadPrompt}
          setUploadPrompt={setUploadPrompt}
          uploading={uploading}
          handleUpload={handleUpload}
        />
      ) : (
        <>
          <FlatList
            data={videoReels}
            renderItem={({ item }) => (
              <VideoReelCard videoReel={item} onPlayVideo={handlePlayVideo} />
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.reelsList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, isDarkMode ? styles.darkText : styles.lightText]}>
                  No video reels yet
                </Text>
                <Text style={[styles.emptySubtext, isDarkMode ? styles.darkSubtext : styles.lightSubtext]}>
                  Create your first video reel to get started
                </Text>
              </View>
            }
          />

          <VideoModal
            visible={modalVisible}
            videoReel={selectedVideoReel}
            onClose={handleCloseModal}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'System',
  },
  header: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'System',
  },
  createButton: {
    backgroundColor: '#5D3FD3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '700',
    fontFamily: 'System',
  },
  reelsList: {
    padding: 16,
  },
  reelCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
  },
  darkReelCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  lightReelCard: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0,0,0,0.1)',
  },
  reelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reelPrompt: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
    fontFamily: 'System',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
    textTransform: 'capitalize',
    fontFamily: 'System',
  },
  reelContent: {
    marginBottom: 12,
  },
  videoContainer: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
  },
  darkPlaceholder: {
    color: '#A0C4E4',
  },
  lightPlaceholder: {
    color: '#4B5563',
  },
  videoPlaceholder: {
    fontSize: 16,
    fontFamily: 'System',
  },
  playButton: {
    backgroundColor: '#5D3FD3',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 12,
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  playButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'System',
  },
  shareButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'System',
  },
  processingContainer: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  processingText: {
    fontSize: 16,
    fontFamily: 'System',
  },
  darkProcessingText: {
    color: '#f59e0b',
  },
  lightProcessingText: {
    color: '#d97706',
  },
  reelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  reelDate: {
    fontSize: 14,
    fontFamily: 'System',
  },
  reelDuration: {
    fontSize: 14,
    fontFamily: 'System',
  },
  darkFooterText: {
    color: '#A0C4E4',
  },
  lightFooterText: {
    color: '#6B7280',
  },
  darkDuration: {
    color: '#FF69B4',
  },
  lightDuration: {
    color: '#DB2777',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    fontFamily: 'System',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'System',
  },
  darkSubtext: {
    color: '#A0C4E4',
  },
  lightSubtext: {
    color: '#6B7280',
  },
  uploadForm: {
    flex: 1,
  },
  uploadScrollView: {
    flex: 1,
  },
  uploadScrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  uploadTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'System',
  },
  promptInput: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    fontFamily: 'System',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    textAlignVertical: 'top',
    fontFamily: 'System',
  },
  darkTextInput: {
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#FFFFFF',
  },
  lightTextInput: {
    borderColor: 'rgba(0,0,0,0.3)',
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
  },
  imageUploadSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
    fontFamily: 'System',
  },
  imageStep: {
    marginBottom: 15,
  },
  stepLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'System',
  },
  darkStepLabel: {
    color: '#A0C4E4',
  },
  lightStepLabel: {
    color: '#6B7280',
  },
  imageSelectButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  darkImageSelect: {
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  lightImageSelect: {
    borderColor: 'rgba(0,0,0,0.3)',
    backgroundColor: '#F3F4F6',
  },
  imageSelected: {
    borderColor: '#5D3FD3',
  },
  selectImageText: {
    fontSize: 16,
    fontFamily: 'System',
  },
  darkSelectText: {
    color: '#A0C4E4',
  },
  lightSelectText: {
    color: '#6B7280',
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  uploadActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
  },
  darkContainer: {
    backgroundColor: '#1A1F71',
  },
  lightContainer: {
    backgroundColor: '#E0F7FA',
  },
  darkHeader: {
    backgroundColor: '#1A1F71',
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  lightHeader: {
    backgroundColor: '#E0F7FA',
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  darkText: {
    color: '#FFFFFF',
  },
  lightText: {
    color: '#1A1F71',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'System',
  },
  uploadButton: {
    backgroundColor: '#5D3FD3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: '#64748b',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'System',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
    fontFamily: 'System',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalCloseText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'System',
  },
  videoWrapper: {
    position: 'relative',
    width: '100%',
    height: 400,
    backgroundColor: '#000',
  },
  modalVideoPlayer: {
    width: '100%',
    height: 400,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noVideoText: {
    color: '#A0C4E4',
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'System',
  },
  bufferingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  customControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  controlButton: {
    backgroundColor: '#5D3FD3',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 25,
    marginHorizontal: 10,
  },
  controlButtonActive: {
    backgroundColor: '#10b981',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'System',
  },
});

export default ReelsScreen;