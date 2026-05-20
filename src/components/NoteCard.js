import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const NoteCard = ({ note, onPress, onDelete, index = 0 }) => {
  const { theme } = useTheme();
  const translateX = useRef(new Animated.Value(-width)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const delay = index * 80;
    
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(translateX, { toValue: 0, friction: 6, tension: 120, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true })
      ])
    ]).start();
  }, []);

  const animStyle = {
    transform: [{ translateX }, { scale }],
    opacity,
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const styles = makeStyles(theme);

  return (
    <Animated.View style={[styles.cardWrapper, animStyle]}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {/* Glow accent line */}
        <View style={styles.accentLine} />

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              {note.imageUri ? (
                <View style={styles.imgBadge}>
                  <Text style={styles.badgeIcon}>📷</Text>
                </View>
              ) : null}
              {note.audioUri ? (
                <View style={[styles.imgBadge, { backgroundColor: theme.secondary + '33' }]}>
                  <Text style={styles.badgeIcon}>🎙️</Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.deleteIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title} numberOfLines={2}>{note.title || 'Sin título'}</Text>

          {note.description ? (
            <Text style={styles.description} numberOfLines={3}>{note.description}</Text>
          ) : null}

          {note.imageUri ? (
            <Image source={{ uri: note.imageUri }} style={styles.thumbnail} resizeMode="cover" />
          ) : null}

          <View style={styles.footer}>
            <Text style={styles.date}>{formatDate(note.createdAt || note.updatedAt)}</Text>
            <View style={styles.tagRow}>
              {note.audioUri && <Text style={styles.tag}>AUDIO</Text>}
              {note.imageUri && <Text style={[styles.tag, { borderColor: theme.gradient2, color: theme.gradient2 }]}>FOTO</Text>}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const makeStyles = (theme) => StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    overflow: 'hidden',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  accentLine: {
    height: 2,
    backgroundColor: theme.primary,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  imgBadge: {
    backgroundColor: theme.primary + '22',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeIcon: { fontSize: 12 },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.danger + '22',
    borderWidth: 1,
    borderColor: theme.danger + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    color: theme.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.text,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  thumbnail: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  date: {
    fontSize: 11,
    color: theme.textMuted,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.primary,
    borderWidth: 1,
    borderColor: theme.primary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    letterSpacing: 1,
  },
});

export default NoteCard;
