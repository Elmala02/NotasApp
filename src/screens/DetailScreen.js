import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import { useTheme } from '../context/ThemeContext';
import { deleteNote } from '../services/storage';

const { width } = Dimensions.get('window');

const DetailScreen = ({ route, navigation }) => {
  const { note } = route.params;
  const { theme } = useTheme();
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPos, setPlaybackPos] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  const headerScale = useRef(new Animated.Value(0.92)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim3 = useRef(new Animated.Value(0)).current;
  const fadeAnim4 = useRef(new Animated.Value(0)).current;
  const fadeAnim5 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim1, { toValue: 1, duration: 400, delay: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim2, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim3, { toValue: 1, duration: 400, delay: 300, useNativeDriver: true }),
      Animated.timing(fadeAnim4, { toValue: 1, duration: 400, delay: 400, useNativeDriver: true }),
      Animated.timing(fadeAnim5, { toValue: 1, duration: 400, delay: 500, useNativeDriver: true })
    ]).start();
    
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, []);

  const headerAnim = {
    transform: [{ scale: headerScale }],
    opacity: headerOpacity,
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms) => {
    if (!ms) return '0:00';
    const secs = Math.floor(ms / 1000);
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handlePlayAudio = async () => {
    if (!note.audioUri) return;
    if (Platform.OS === 'web') {
      Alert.alert('No soportado', 'La reproducción de audio nativo no está disponible en la versión web para PC.');
      return;
    }
    try {
      if (sound && isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
        return;
      }
      
      // Asegurar que el modo de audio permita reproducción
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
        return;
      }
      const { sound: s } = await Audio.Sound.createAsync(
        { uri: note.audioUri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setPlaybackPos(status.positionMillis || 0);
            setPlaybackDuration(status.durationMillis || 0);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPlaybackPos(0);
            }
          }
        }
      );
      setSound(s);
      setIsPlaying(true);
    } catch (e) {
      console.error("Error al reproducir audio:", e);
      Alert.alert('Error', 'No se pudo reproducir el audio: ' + (e.message || e.toString()));
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      setPlaybackPos(0);
    }
  };

  const handleDelete = () => {
    Alert.alert('Eliminar nota', '¿Eliminar esta nota permanentemente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteNote(note.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const progress = playbackDuration > 0 ? playbackPos / playbackDuration : 0;
  const styles = makeStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />

      {/* HEADER */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DETALLE</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>🗑️</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.glowDivider} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* TITLE CARD */}
        <Animated.View style={[styles.titleCard, { opacity: fadeAnim1 }]}>
          <View style={styles.titleAccentBar} />
          <Text style={styles.noteTitle}>{note.title || 'Sin título'}</Text>
          <Text style={styles.noteDate}>{formatDate(note.createdAt || note.updatedAt)}</Text>

          {/* Badges */}
          <View style={styles.badgeRow}>
            {note.imageUri && (
              <View style={[styles.badge, { backgroundColor: theme.primary + '22', borderColor: theme.primary + '55' }]}>
                <Text style={[styles.badgeText, { color: theme.primary }]}>📷 FOTO</Text>
              </View>
            )}
            {note.audioUri && (
              <View style={[styles.badge, { backgroundColor: theme.secondary + '22', borderColor: theme.secondary + '55' }]}>
                <Text style={[styles.badgeText, { color: theme.secondary }]}>🎙️ AUDIO</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* IMAGE */}
        {note.imageUri && (
          <Animated.View style={[styles.section, { opacity: fadeAnim2 }]}>
            <Text style={styles.sectionLabel}>◈ FOTOGRAFÍA</Text>
            <View style={styles.imageWrapper}>
              <Image source={{ uri: note.imageUri }} style={styles.fullImage} resizeMode="cover" />
              <View style={styles.imageOverlay}>
                <View style={styles.scanLine} />
              </View>
            </View>
          </Animated.View>
        )}

        {/* DESCRIPTION */}
        {note.description ? (
          <Animated.View style={[styles.section, { opacity: fadeAnim3 }]}>
            <Text style={styles.sectionLabel}>◈ DESCRIPCIÓN</Text>
            <View style={styles.descCard}>
              <Text style={styles.descText}>{note.description}</Text>
            </View>
          </Animated.View>
        ) : null}

        {/* AUDIO PLAYER */}
        {note.audioUri && (
          <Animated.View style={[styles.section, { opacity: fadeAnim4 }]}>
            <Text style={styles.sectionLabel}>◈ NOTA DE VOZ</Text>
            <View style={styles.playerCard}>
              {/* Waveform visual */}
              <View style={styles.waveform}>
                {Array.from({ length: 28 }).map((_, i) => {
                  const h = 8 + Math.sin(i * 0.7) * 14 + Math.random() * 10;
                  const filled = progress > 0 && i / 28 < progress;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.waveBar,
                        { height: h, backgroundColor: filled ? theme.primary : theme.cardBorder },
                      ]}
                    />
                  );
                })}
              </View>

              {/* Progress */}
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>

              <View style={styles.playerControls}>
                <Text style={styles.playerTime}>{formatDuration(playbackPos)}</Text>
                <TouchableOpacity style={styles.playBigBtn} onPress={handlePlayAudio}>
                  <Text style={styles.playBigIcon}>{isPlaying ? '⏸' : '▶'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.stopSmallBtn} onPress={stopAudio}>
                  <Text style={styles.stopSmallIcon}>⏹</Text>
                </TouchableOpacity>
                <Text style={styles.playerTime}>{formatDuration(playbackDuration)}</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* META INFO */}
        <Animated.View style={[styles.metaCard, { opacity: fadeAnim5 }]}>
          <Text style={styles.metaLabel}>ID DE NOTA</Text>
          <Text style={styles.metaValue} numberOfLines={1}>{note.id}</Text>
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
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.danger + '1A',
    borderWidth: 1,
    borderColor: theme.danger + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { fontSize: 16 },
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

  titleCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  titleAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: theme.primary,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  noteTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.text,
    marginBottom: 8,
    letterSpacing: 0.5,
    paddingLeft: 10,
  },
  noteDate: {
    fontSize: 12,
    color: theme.textMuted,
    marginBottom: 12,
    paddingLeft: 10,
    textTransform: 'capitalize',
  },
  badgeRow: { flexDirection: 'row', gap: 8, paddingLeft: 10 },
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },

  section: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.primary,
    letterSpacing: 2,
    marginBottom: 10,
  },
  imageWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  fullImage: { width: '100%', height: 260 },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  scanLine: {
    height: 1,
    backgroundColor: theme.primary,
    opacity: 0.3,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },

  descCard: {
    backgroundColor: theme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 16,
  },
  descText: { fontSize: 15, color: theme.text, lineHeight: 24 },

  // Audio Player
  playerCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 20,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    gap: 3,
    marginBottom: 12,
  },
  waveBar: { width: 3, borderRadius: 2 },
  progressTrack: {
    height: 3,
    backgroundColor: theme.cardBorder,
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 2,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  playerTime: { fontSize: 13, color: theme.textMuted, fontWeight: '600', minWidth: 36 },
  playBigBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  playBigIcon: { fontSize: 22, color: '#000' },
  stopSmallBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopSmallIcon: { fontSize: 14 },

  metaCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 14,
    marginTop: 4,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.textMuted,
    letterSpacing: 2,
    marginBottom: 4,
  },
  metaValue: { fontSize: 11, color: theme.textMuted, fontFamily: 'monospace' },
});

export default DetailScreen;
