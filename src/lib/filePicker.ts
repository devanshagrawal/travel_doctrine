import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { ActionSheetIOS, Platform } from 'react-native';

export interface PickResult {
  uri: string;
  mimeType?: string;
}

function showActionSheet(options: string[]): Promise<number> {
  return new Promise((resolve) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [...options, 'Cancel'], cancelButtonIndex: options.length },
        (idx) => resolve(idx),
      );
    } else {
      // On web/Android we skip the action sheet and go straight to document
      // picker which already lets the user choose images or PDFs.
      resolve(-1);
    }
  });
}

async function pickImage(): Promise<PickResult | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.6,
  });
  if (res.canceled) return null;
  const a = res.assets[0];
  return { uri: a.uri, mimeType: a.mimeType ?? undefined };
}

async function pickDocument(): Promise<PickResult | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['image/*', 'application/pdf'],
    copyToCacheDirectory: true,
  });
  if (res.canceled) return null;
  const a = res.assets[0];
  return { uri: a.uri, mimeType: a.mimeType ?? undefined };
}

// Show an action sheet (iOS) or go straight to the document picker (web/Android).
// Returns the picked file URI + mimeType, or null if cancelled.
export async function pickFile(): Promise<PickResult | null> {
  if (Platform.OS === 'ios') {
    const idx = await showActionSheet(['Photo Library', 'Choose File (PDF)']);
    if (idx === 0) return pickImage();
    if (idx === 1) return pickDocument();
    return null; // cancel
  }
  // Web & Android: document picker already shows images + PDFs
  return pickDocument();
}
