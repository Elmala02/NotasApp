import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const NOTES_KEY = '@nextnotes_notes';
const isWeb = Platform.OS === 'web';

const IMAGES_DIR = isWeb ? '' : FileSystem.documentDirectory + 'images/';
const AUDIO_DIR = isWeb ? '' : FileSystem.documentDirectory + 'audio/';

// Ensure directories exist
const ensureDirectories = async () => {
  if (isWeb) return;
  const imgInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
  if (!imgInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
  }
  const audioInfo = await FileSystem.getInfoAsync(AUDIO_DIR);
  if (!audioInfo.exists) {
    await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
  }
};

export const saveNote = async (note) => {
  try {
    await ensureDirectories();
    const existing = await getNotes();
    const noteToSave = { ...note, updatedAt: new Date().toISOString() };

    // Copy image to permanent storage (native only)
    if (!isWeb && note.imageUri && note.imageUri.startsWith('file://')) {
      const imgFileName = `img_${note.id}.jpg`;
      const destImgPath = IMAGES_DIR + imgFileName;
      const imgExists = await FileSystem.getInfoAsync(note.imageUri);
      if (imgExists.exists) {
        await FileSystem.copyAsync({ from: note.imageUri, to: destImgPath });
        noteToSave.imageUri = destImgPath;
      }
    }

    // Copy audio to permanent storage (native only)
    if (!isWeb && note.audioUri && note.audioUri.startsWith('file://')) {
      const audioFileName = `audio_${note.id}.m4a`;
      const destAudioPath = AUDIO_DIR + audioFileName;
      const audioExists = await FileSystem.getInfoAsync(note.audioUri);
      if (audioExists.exists) {
        await FileSystem.copyAsync({ from: note.audioUri, to: destAudioPath });
        noteToSave.audioUri = destAudioPath;
      }
    }

    const idx = existing.findIndex(n => n.id === note.id);
    if (idx >= 0) {
      existing[idx] = noteToSave;
    } else {
      existing.unshift(noteToSave);
    }

    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(existing));
    return noteToSave;
  } catch (error) {
    console.error('Error saving note:', error);
    throw error;
  }
};

export const getNotes = async () => {
  try {
    const data = await AsyncStorage.getItem(NOTES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting notes:', error);
    return [];
  }
};

export const deleteNote = async (id) => {
  try {
    const existing = await getNotes();
    const note = existing.find(n => n.id === id);

    // Delete associated files (native only)
    if (!isWeb && note?.imageUri) {
      const info = await FileSystem.getInfoAsync(note.imageUri);
      if (info.exists) await FileSystem.deleteAsync(note.imageUri);
    }
    if (!isWeb && note?.audioUri) {
      const info = await FileSystem.getInfoAsync(note.audioUri);
      if (info.exists) await FileSystem.deleteAsync(note.audioUri);
    }

    const updated = existing.filter(n => n.id !== id);
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

export const getNoteById = async (id) => {
  const notes = await getNotes();
  return notes.find(n => n.id === id) || null;
};
