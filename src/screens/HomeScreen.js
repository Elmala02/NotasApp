import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getNotes, deleteNote } from '../services/storage';
import NoteCard from '../components/NoteCard';
import FloatingButton from '../components/FloatingButton';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);
  const headerY = useRef(new Animated.Value(-60)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerY, { toValue: 0, friction: 6, tension: 100, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(fadeAnim1, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim2, { toValue: 1, duration: 500, delay: 300, useNativeDriver: true })
    ]).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [])
  );

  const loadNotes = async () => {
    const data = await getNotes();
    setNotes(data);
    setFiltered(data);
  };

  const handleSearch = (text) => {
    setSearch(text);
    if (!text.trim()) {
      setFiltered(notes);
      return;
    }
    const q = text.toLowerCase();
    setFiltered(
      notes.filter(
        n =>
          n.title?.toLowerCase().includes(q) ||
          n.description?.toLowerCase().includes(q)
      )
    );
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Eliminar nota',
      '¿Estás seguro de que deseas eliminar esta nota?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteNote(id);
            loadNotes();
          },
        },
      ]
    );
  };

  const headerAnimStyle = {
    transform: [{ translateY: headerY }],
    opacity: headerOpacity,
  };

  const styles = makeStyles(theme);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyGlyph}>◈</Text>
      <Text style={styles.emptyTitle}>SIN NOTAS</Text>
      <Text style={styles.emptySubtitle}>Toca el botón + para crear{'\n'}tu primera nota</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />

      {/* HEADER */}
      <Animated.View style={[styles.header, headerAnimStyle]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>NEXT</Text>
          <Text style={styles.headerTitleAccent}>NOTES</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.noteCount}>{notes.length} notas</Text>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeBtn}>
            <Text style={styles.themeBtnText}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* GLOWING DIVIDER */}
      <View style={styles.glowDivider} />

      {/* SEARCH BAR */}
      <Animated.View style={[styles.searchWrapper, { opacity: fadeAnim1 }]} >
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar notas..."
            placeholderTextColor={theme.textMuted}
            value={search}
            onChangeText={handleSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* STATS BAR */}
      <Animated.View style={[styles.statsBar, { opacity: fadeAnim2 }]}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{notes.filter(n => n.imageUri).length}</Text>
          <Text style={styles.statLabel}>📷 FOTOS</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{notes.filter(n => n.audioUri).length}</Text>
          <Text style={styles.statLabel}>🎙️ AUDIOS</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{notes.length}</Text>
          <Text style={styles.statLabel}>📝 TOTAL</Text>
        </View>
      </Animated.View>

      {/* NOTES LIST */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <NoteCard
            note={item}
            index={index}
            onPress={() => navigation.navigate('Detail', { note: item })}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <FloatingButton onPress={() => navigation.navigate('CreateNote')} />
    </SafeAreaView>
  );
};

const makeStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.text,
    letterSpacing: 4,
  },
  headerTitleAccent: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.primary,
    letterSpacing: 4,
    textShadowColor: theme.primary,
    textShadowRadius: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noteCount: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '600',
    letterSpacing: 1,
  },
  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeBtnText: { fontSize: 16 },
  glowDivider: {
    height: 1,
    backgroundColor: theme.primary,
    marginHorizontal: 20,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 4,
  },
  searchWrapper: { paddingHorizontal: 16, paddingVertical: 12 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchIcon: {
    fontSize: 20,
    color: theme.textMuted,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.text,
    fontWeight: '500',
  },
  clearBtn: {
    color: theme.textMuted,
    fontSize: 14,
    paddingLeft: 8,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    paddingVertical: 10,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.primary,
    textShadowColor: theme.primary,
    textShadowRadius: 6,
  },
  statLabel: { fontSize: 9, color: theme.textMuted, fontWeight: '700', letterSpacing: 1, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: theme.cardBorder },
  listContent: { paddingBottom: 100, paddingTop: 4 },
  listEmpty: { flex: 1 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyGlyph: {
    fontSize: 56,
    color: theme.primary,
    opacity: 0.3,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.textMuted,
    letterSpacing: 4,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.6,
  },
});

export default HomeScreen;
