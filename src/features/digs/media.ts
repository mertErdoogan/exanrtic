import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

/**
 * Photos and voice notes are copied into the app's document directory so
 * they survive cache cleanup. EXIF is not requested, and the copy keeps
 * the user's location out of any file the app might later share.
 */
function mediaDir(kind: 'photos' | 'voice'): Directory {
  const dir = new Directory(Paths.document, kind);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

async function persist(sourceUri: string, kind: 'photos' | 'voice', name: string): Promise<string> {
  const source = new File(sourceUri);
  const target = new File(mediaDir(kind), name);
  await source.copy(target);
  return target.uri;
}

export async function capturePhoto(digId: string, fromLibrary = false): Promise<string | null> {
  const perm = fromLibrary
    ? await ImagePicker.requestMediaLibraryPermissionsAsync()
    : await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const options: ImagePicker.ImagePickerOptions = { quality: 0.7, exif: false, mediaTypes: ['images'] };
  const result = fromLibrary
    ? await ImagePicker.launchImageLibraryAsync(options)
    : await ImagePicker.launchCameraAsync(options);
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;
  return persist(asset.uri, 'photos', `${digId}-${Date.now()}.jpg`);
}

export async function persistVoiceNote(digId: string, recordingUri: string): Promise<string> {
  const ext = recordingUri.split('.').pop() || 'm4a';
  return persist(recordingUri, 'voice', `${digId}-${Date.now()}.${ext}`);
}
