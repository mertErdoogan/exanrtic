import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { space } from '@/theme/tokens';

import { persistVoiceNote } from './media';

export function VoiceNote({
  digId,
  uri,
  onSaved,
}: {
  digId: string;
  uri: string | null;
  onSaved: (uri: string) => void;
}) {
  const { t } = useTranslation();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);
  const player = useAudioPlayer(uri ?? undefined);

  const toggle = async () => {
    if (state.isRecording) {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      if (recorder.uri) onSaved(await persistVoiceNote(digId, recorder.uri));
      return;
    }
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) return;
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  return (
    <View style={{ gap: space.sm }}>
      <Button
        title={state.isRecording ? t('dig.recording') : t('dig.voice')}
        kind={state.isRecording ? 'danger' : 'secondary'}
        onPress={toggle}
      />
      {uri && !state.isRecording ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="caption">{t('dig.voiceSaved')}</Text>
          <Button
            title={t('dig.play')}
            kind="ghost"
            onPress={() => {
              player.seekTo(0);
              player.play();
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
