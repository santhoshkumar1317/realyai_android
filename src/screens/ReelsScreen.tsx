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
import { apiService, VideoReel } from '../utils/api';
import { launchImageLibrary } from 'react-native-image-picker';
import auth from '@react-native-firebase/auth';
import Video from 'react-native-video';

// Prepare video source - now supports URLs from backend
const prepareVideoSource = (videoReel: VideoReel) => {
  // Priority: videoUrl > videoData (base64 fallback)
  if (videoReel.videoUrl) {
    console.log('Using video URL:', videoReel.videoUrl);
    return { uri: videoReel.videoUrl };
  }

  // Fallback to base64 if no URL (for backward compatibility)
  if (videoReel.videoData) {
    console.log('Using base64 fallback, length:', videoReel.videoData.length);
    return { uri: `data:video/mp4;base64,${videoReel.videoData}` };
  }

  // Final fallback
  console.log('No video data available, using test video');
  return {
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  };
};

// Video Modal Component - Optimized for smooth playback
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
    console.error('Error details:', JSON.stringify(error, null, 2));
    Alert.alert('Playback Error', `Unable to play video: ${error?.error?.localizedDescription || error?.message || 'Unknown error'}. Please try again.`);
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  const handleBuffer = ({ isBuffering }: { isBuffering: boolean }) => {
    setBuffering(isBuffering);
    console.log('Video buffering:', isBuffering);
  };

  const handleLoad = (loadData: any) => {
    console.log('Video loaded successfully:', loadData);
    console.log('Video duration:', loadData.duration);
    console.log('Video dimensions:', loadData.naturalSize);
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

          {/* Custom Controls */}
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

          {videoReel.videoData ? (
            <View style={styles.videoWrapper}>
              <Video
                ref={videoRef}
                source={prepareVideoSource(videoReel)}
                style={styles.modalVideoPlayer}
                controls={true} // Enable controls to see if they appear
                paused={!isPlaying}
                onError={handleVideoError}
                onEnd={handleVideoEnd}
                onLoad={handleLoad}
                onBuffer={handleBuffer}
                onLoadStart={() => console.log('Video load started')}
                onProgress={(progress) => console.log('Video progress:', progress)}
                resizeMode="contain"
                playInBackground={false}
                playWhenInactive={false}
                ignoreSilentSwitch="ignore"
                volume={1.0}
                rate={1.0}
                // Prevent memory leaks
                poster={undefined}
                posterResizeMode="contain"
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

// Video Reel Card Component
const VideoReelCard = ({
  videoReel,
  onPlayVideo,
}: {
  videoReel: VideoReel;
  onPlayVideo: (reel: VideoReel) => void;
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '#4CAF50';
      case 'PROCESSING':
        return '#FF9800';
      case 'PENDING':
        return '#2196F3';
      case 'FAILED':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this video reel: ${videoReel.prompt}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={styles.reelCard}>
      <View style={styles.reelHeader}>
        <Text style={styles.reelPrompt} numberOfLines={2}>
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
        {videoReel.status === 'COMPLETED' && videoReel.videoData ? (
          <View style={styles.videoContainer}>
            <Text style={styles.videoPlaceholder}>🎬 Video Available</Text>
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
            <Text style={styles.processingText}>
              {videoReel.status === 'PROCESSING'
                ? '🎬 Generating video...'
                : videoReel.status === 'PENDING'
                ? '⏳ Waiting to process...'
                : videoReel.status === 'FAILED'
                ? '❌ Failed to generate video'
                : '📷 Processing images...'}
            </Text>
            {videoReel.status === 'PROCESSING' && (
              <ActivityIndicator size="small" color="#6a0dad" />
            )}
          </View>
        )}
      </View>

      <View style={styles.reelFooter}>
        <Text style={styles.reelDate}>
          {new Date(videoReel.createdAt).toLocaleDateString()}
        </Text>
        {videoReel.videoDuration && (
          <Text style={styles.reelDuration}>
            {Math.round(videoReel.videoDuration)}s
          </Text>
        )}
      </View>
    </View>
  );
};

// Upload Form Component
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
        <Text style={styles.uploadTitle}>Create Video Reel</Text>

        <View style={styles.promptInput}>
          <Text style={styles.inputLabel}>Video Prompt *</Text>
          <TextInput
            style={styles.textInput}
            value={uploadPrompt}
            onChangeText={setUploadPrompt}
            placeholder="Describe the video you want to create..."
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.imageUploadSection}>
          <Text style={styles.sectionTitle}>Select Images (2-3 required)</Text>

          {[1, 2, 3].map(step => (
            <View key={step} style={styles.imageStep}>
              <Text style={styles.stepLabel}>
                Image {step} {step <= 2 ? '*' : '(optional)'}
              </Text>
              <TouchableOpacity
                style={[
                  styles.imageSelectButton,
                  selectedImages[step - 1] && styles.imageSelected,
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
                  <Text style={styles.selectImageText}>🏠 Select Image</Text>
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

// Main ReelsScreen Component
const ReelsScreen = () => {
  const [videoReels, setVideoReels] = useState<VideoReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [uploadPrompt, setUploadPrompt] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVideoReel, setSelectedVideoReel] = useState<VideoReel | null>(
    null,
  );

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
      Alert.alert(
        'Error',
        'Please select at least 2 images and enter a prompt',
      );
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

      Alert.alert(
        'Success',
        'Video reel creation started! The video will be available in a few minutes.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowUploadForm(false);
              setSelectedImages([]);
              setUploadPrompt('');
              loadVideoReels();
            },
          },
        ],
      );
    } catch (error) {
      console.error('Error creating video reel:', error);
      Alert.alert('Error', 'Failed to create video reel');
    } finally {
      setUploading(false);
    }
  };

  const handlePlayVideo = (videoReel: VideoReel) => {
    console.log('Playing video reel:', videoReel.id);
    console.log('Video data length:', videoReel.videoData?.length);
    console.log('Video data preview:', videoReel.videoData?.substring(0, 100));
    console.log('Video format:', videoReel.videoFormat);
    console.log('Video size:', videoReel.videoSize);
    setSelectedVideoReel(videoReel);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    // Delay clearing the selected reel to allow smooth modal close animation
    setTimeout(() => {
      setSelectedVideoReel(null);
    }, 300);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6a0dad" />
        <Text style={styles.loadingText}>Loading video reels...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Video Reels</Text>
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
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            windowSize={5}
            initialNumToRender={5}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No video reels yet</Text>
                <Text style={styles.emptySubtext}>
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
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a0033',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  createButton: {
    backgroundColor: '#6a0dad',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  reelsList: {
    padding: 15,
  },
  reelCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reelPrompt: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  reelContent: {
    marginBottom: 10,
  },
  videoContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  videoPlaceholder: {
    fontSize: 18,
    marginBottom: 15,
    color: '#333',
  },
  playButton: {
    backgroundColor: '#6a0dad',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 10,
  },
  playButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shareButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  processingContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
  },
  processingText: {
    fontSize: 16,
    color: '#856404',
    marginBottom: 10,
  },
  reelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  reelDate: {
    fontSize: 12,
    color: '#999',
  },
  reelDuration: {
    fontSize: 12,
    color: '#6a0dad',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  promptInput: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    textAlignVertical: 'top',
  },
  imageUploadSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  imageStep: {
    marginBottom: 15,
  },
  stepLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  imageSelectButton: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  imageSelected: {
    borderColor: '#6a0dad',
    backgroundColor: '#f8f4ff',
  },
  selectImageText: {
    fontSize: 16,
    color: '#666',
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  uploadActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  cancelButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadButton: {
    backgroundColor: '#6a0dad',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    marginRight: 10,
  },
  modalCloseButton: {
    padding: 5,
  },
  modalCloseText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  videoWrapper: {
    position: 'relative',
    width: '100%',
    height: 400,
    backgroundColor: 'black',
  },
  modalVideoPlayer: {
    width: '100%',
    height: 400,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingVideoText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  noVideoText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  bufferingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  customControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#2a2a2a',
  },
  controlButton: {
    backgroundColor: '#6a0dad',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginHorizontal: 10,
  },
  controlButtonActive: {
    backgroundColor: '#4CAF50',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReelsScreen;
