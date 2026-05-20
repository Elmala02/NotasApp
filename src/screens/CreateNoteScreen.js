import React, { useState, useRef, useEffect } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
  StatusBar,
  Modal,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { saveNote } from '../services/storage';

// Simple unique ID generator (avoids uuid ESM compatibility issues)
const generateId = () => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  const randomPart2 = Math.random().toString(36).substring(2, 6);
  return `${timestamp}-${randomPart}-${randomPart2}`;
};

const { width, height } = Dimensions.get('window');

const CreateNoteScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [saving, setSaving] = useState(false);

  // Camera
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  // Audio
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const durationTimer = useRef(null);

  const screenY = useRef(new Animated.Value(50)).current;
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim3 = useRef(new Animated.Value(0)).current;
  const fadeAnim4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(screenY, { toValue: 0, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(screenOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim1, { toValue: 1, duration: 400, delay: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim2, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim3, { toValue: 1, duration: 400, delay: 300, useNativeDriver: true }),
      Animated.timing(fadeAnim4, { toValue: 1, duration: 400, delay: 400, useNativeDriver: true })
    ]).start();
    
    return () => {
      if (durationTimer.current) clearInterval(durationTimer.current);
      if (sound) sound.unloadAsync();
    };
  }, []);

  const screenAnimStyle = {
    flex: 1,
    transform: [{ translateY: screenY }],
    opacity: screenOpacity,
  };

  // ─── CAMERA ────────────────────────────────────────────────────────────────
  const openCamera = async () => {
    if (Platform.OS === 'web') {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setImageUri(result.assets[0].uri);
        }
      } catch (err) {
        Alert.alert('Error', 'No se pudo seleccionar la imagen.');
      }
      return;
    }

    if (!cameraPermission?.granted) {
      const res = await requestCameraPermission();
      if (!res.granted) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.');
        return;
      }
    }
    setShowCamera(true);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setImageUri(photo.uri);
      setShowCamera(false);
    } catch (e) {
      Alert.alert('Error', 'No se pudo tomar la foto.');
    }
  };

  // ─── AUDIO ─────────────────────────────────────────────────────────────────
  const startRecording = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Audio no soportado',
        'La grabación de audio nativa de Expo no está disponible en navegadores de PC. Puedes usar las demás funciones sin problemas.'
      );
      return;
    }
    try {
      // 1. Pedir permisos de manera segura
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted' && !permission.granted) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso al micrófono para grabar la nota de voz.');
        return;
      }
      
      // 2. Configurar el modo de audio para iOS de forma robusta
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // 3. Iniciar la grabación
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(rec);
      setIsRecording(true);
      setRecordingDuration(0);
      
      // 4. Iniciar el contador
      if (durationTimer.current) clearInterval(durationTimer.current);
      durationTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (e) {
      console.error("Error al grabar:", e);
      Alert.alert('Error de Grabación', 'No se pudo iniciar: ' + (e.message || e.toString()));
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      if (durationTimer.current) clearInterval(durationTimer.current);
      
      // 1. Detener la grabación
      await recording.stopAndUnloadAsync();
      
      // 2. Restaurar el modo de audio a playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
      
      // 3. Guardar el URI
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
      setIsRecording(false);
    } catch (e) {
      console.error("Error al detener grabación:", e);
      Alert.alert('Error', 'No se pudo detener la grabación: ' + (e.message || e.toString()));
    }
  };

  const playAudio = async () => {
    if (!audioUri) return;
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
        return;
      }
      
      // Asegurarnos de que el modo de audio permite reproducción
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound: s } = await Audio.Sound.createAsync({ uri: audioUri });
      setSound(s);
      setIsPlaying(true);
      await s.playAsync();
      s.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          setSound(null);
        }
      });
    } catch (e) {
      console.error("Error al reproducir:", e);
      Alert.alert('Error', 'No se pudo reproducir el audio: ' + (e.message || e.toString()));
    }
  };

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ─── SAVE ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Título requerido', 'Por favor agrega un título a tu nota.');
      return;
    }
    setSaving(true);
    try {
      const note = {
        id: generateId(),
        title: title.trim(),
        description: description.trim(),
        imageUri: imageUri || null,
        audioUri: audioUri || null,
        createdAt: new Date().toISOString(),
      };
      await saveNote(note);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar la nota.');
    } finally {
      setSaving(false);
    }
  };

  const styles = makeStyles(theme);

  // ─── CAMERA MODAL ──────────────────────────────────────────────────────────
  if (showCamera) {
    return (
      <Modal visible={showCamera} animationType="slide" statusBarTranslucent>
        <View style={styles.cameraContainer}>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

          {/* Overlay corners */}
          <View style={styles.cameraOverlay}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>

          <View style={styles.cameraControls}>
            <TouchableOpacity onPress={() => setShowCamera(false)} style={styles.camCancelBtn}>
              <Text style={styles.camCancelText}>CANCELAR</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={takePicture} style={styles.shutterBtn}>
              <View style={styles.shutterInner} />
            </TouchableOpacity>
            <View style={{ width: 80 }} />
          </View>
        </View>
      </Modal>
    );
  }

  // ─── MAIN FORM ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />

      {/* HEADER */}
      <Animated.View style={[styles.header, { opacity: screenOpacity }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NUEVA NOTA</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? '...' : 'GUARDAR'}</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.glowDivider} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* TITLE */}
        <Animated.View style={[styles.field, { opacity: fadeAnim1 }]}>
          <Text style={styles.label}>◈ TÍTULO</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Escribe el título..."
            placeholderTextColor={theme.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </Animated.View>

        {/* DESCRIPTION */}
        <Animated.View style={[styles.field, { opacity: fadeAnim2 }]}>
          <Text style={styles.label}>◈ DESCRIPCIÓN</Text>
          <TextInput
            style={styles.descInput}
            placeholder="Agrega una descripción..."
            placeholderTextColor={theme.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </Animated.View>

        {/* CAMERA SECTION */}
        <Animated.View style={[styles.field, { opacity: fadeAnim3 }]}>
          <Text style={styles.label}>◈ FOTOGRAFÍA</Text>
          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
              <TouchableOpacity style={styles.removeMediaBtn} onPress={() => setImageUri(null)}>
                <Text style={styles.removeMediaText}>✕ QUITAR</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.mediaBtn} onPress={openCamera}>
              <Text style={styles.mediaBtnIcon}>📷</Text>
              <Text style={styles.mediaBtnText}>TOMAR FOTO</Text>
              <Text style={styles.mediaBtnSub}>Activar cámara</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* AUDIO SECTION */}
        <Animated.View style={[styles.field, { opacity: fadeAnim4 }]}>
          <Text style={styles.label}>◈ NOTA DE VOZ</Text>
          <View style={styles.audioPanel}>
            {isRecording ? (
              <View style={styles.recordingActive}>
                <View style={styles.recDot} />
                <Text style={styles.recTimer}>{formatDuration(recordingDuration)}</Text>
                <TouchableOpacity style={styles.stopBtn} onPress={stopRecording}>
                  <Text style={styles.stopBtnText}>⏹ DETENER</Text>
                </TouchableOpacity>
              </View>
            ) : audioUri ? (
              <View style={styles.audioReady}>
                <Text style={styles.audioReadyIcon}>🎙️</Text>
                <Text style={styles.audioReadyText}>Audio grabado</Text>
                <View style={styles.audioActions}>
                  <TouchableOpacity style={styles.playBtn} onPress={playAudio}>
                    <Text style={styles.playBtnText}>{isPlaying ? '⏸ PAUSAR' : '▶ REPRODUCIR'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteAudioBtn} onPress={() => setAudioUri(null)}>
                    <Text style={styles.deleteAudioText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.mediaBtn} onPress={startRecording}>
                <Text style={styles.mediaBtnIcon}>🎙️</Text>
                <Text style={styles.mediaBtnText}>GRABAR VOZ</Text>
                <Text style={styles.mediaBtnSub}>Toca para iniciar</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: theme.primary, fontSize: 20, fontWeight: '700' },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: 4,
  },
  saveBtn: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#000', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  glowDivider: {
    height: 1,
    backgroundColor: theme.primary,
    marginHorizontal: 20,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    marginBottom: 4,
  },
  scroll: { padding: 16 },
  field: { marginBottom: 20 },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.primary,
    letterSpacing: 2,
    marginBottom: 10,
  },
  titleInput: {
    backgroundColor: theme.inputBg,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  descInput: {
    backgroundColor: theme.inputBg,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.text,
    minHeight: 120,
    lineHeight: 22,
  },
  mediaBtn: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 14,
    borderStyle: 'dashed',
    alignItems: 'center',
    paddingVertical: 28,
  },
  mediaBtnIcon: { fontSize: 36, marginBottom: 8 },
  mediaBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.primary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  mediaBtnSub: { fontSize: 12, color: theme.textMuted },
  imageContainer: { borderRadius: 14, overflow: 'hidden' },
  preview: { width: '100%', height: 220, borderRadius: 14 },
  removeMediaBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(255,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removeMediaText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  audioPanel: {},
  recordingActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.danger + '1A',
    borderWidth: 1,
    borderColor: theme.danger + '44',
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  recDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.danger,
  },
  recTimer: { fontSize: 22, fontWeight: '800', color: theme.danger, flex: 1 },
  stopBtn: {
    backgroundColor: theme.danger,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  stopBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  audioReady: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  audioReadyIcon: { fontSize: 32, marginBottom: 6 },
  audioReadyText: { fontSize: 14, color: theme.textSecondary, marginBottom: 12 },
  audioActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  playBtn: {
    backgroundColor: theme.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  playBtnText: { color: '#000', fontWeight: '800', fontSize: 12 },
  deleteAudioBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.danger + '22',
    borderWidth: 1,
    borderColor: theme.danger + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAudioText: { color: theme.danger, fontWeight: '700' },

  // Camera styles
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerTL: {
    position: 'absolute',
    top: height * 0.15,
    left: width * 0.1,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#00D4FF',
  },
  cornerTR: {
    position: 'absolute',
    top: height * 0.15,
    right: width * 0.1,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#00D4FF',
  },
  cornerBL: {
    position: 'absolute',
    bottom: height * 0.15,
    left: width * 0.1,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#00D4FF',
  },
  cornerBR: {
    position: 'absolute',
    bottom: height * 0.15,
    right: width * 0.1,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#00D4FF',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },
  camCancelBtn: {
    width: 80,
    alignItems: 'center',
    paddingVertical: 10,
  },
  camCancelText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1,
  },
  shutterBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#00D4FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 10,
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
});

export default CreateNoteScreen;
