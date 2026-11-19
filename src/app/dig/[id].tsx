import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Field } from '@/components/Field';
import { Button, Rule, Screen, Text } from '@/components/ui';
import { digsRepo } from '@/db/repo';
import { DIG_RESULTS, type Dig, type DigPhoto, type DigResult } from '@/db/schema';
import { capturePhoto } from '@/features/digs/media';
import { VoiceNote } from '@/features/digs/VoiceNote';
import { parseOptionalInt } from '@/lib/format';
import { colors, fonts, radius, space, touch } from '@/theme/tokens';

const AUTO_CLOSE_S = 10;
const PICKABLE: DigResult[] = DIG_RESULTS.filter((r) => r !== 'unknown');

export default function DigSheet() {
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const { t } = useTranslation();
  const router = useRouter();

  const [dig, setDig] = useState<Dig | undefined>();
  const [photos, setPhotos] = useState<DigPhoto[]>([]);
  const [details, setDetails] = useState(fresh !== '1');
  const [countdown, setCountdown] = useState<number | null>(fresh === '1' ? AUTO_CLOSE_S : null);
  const [targetId, setTargetId] = useState('');
  const [depth, setDepth] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const closed = useRef(false);

  useEffect(() => {
    (async () => {
      const d = await digsRepo.get(id);
      setDig(d);
      if (d) {
        setTargetId(d.targetId != null ? String(d.targetId) : '');
        setDepth(d.depthCm != null ? String(d.depthCm) : '');
        setTitle(d.title ?? '');
        setNote(d.note ?? '');
      }
      setPhotos(await digsRepo.photos(id));
    })();
  }, [id]);

  const close = useCallback(() => {
    if (closed.current) return;
    closed.current = true;
    if (router.canGoBack()) router.back();
  }, [router]);

  // Fresh digs close themselves so a busy hand never has to come back to the phone.
  useEffect(() => {
    if (countdown == null) return;
    const timer = setTimeout(() => {
      if (countdown <= 1) close();
      else setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, close]);

  const interact = () => setCountdown(null);

  const saveFields = async (patch: Partial<Dig> = {}) => {
    await digsRepo.update(id, {
      targetId: parseOptionalInt(targetId),
      depthCm: parseOptionalInt(depth),
      title: title.trim() || null,
      note: note.trim() || null,
      ...patch,
    });
  };

  const pickResult = async (result: DigResult) => {
    interact();
    await Haptics.selectionAsync();
    setDig((d) => (d ? { ...d, result } : d));
    await saveFields({ result });
    if (!details) close();
  };

  const addPhoto = async (fromLibrary: boolean) => {
    interact();
    const uri = await capturePhoto(id, fromLibrary);
    if (!uri) return;
    await digsRepo.addPhoto(id, uri);
    setPhotos(await digsRepo.photos(id));
  };

  const remove = () => {
    Alert.alert(t('common.delete'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await digsRepo.remove(id);
          close();
        },
      },
    ]);
  };

  if (!dig) return <Screen>{null}</Screen>;

  return (
    <Screen edges={['top', 'bottom']}>
      <Pressable onPressIn={interact} style={{ gap: space.xl }}>
        <View style={{ gap: space.xs }}>
          <Text variant="label">{t('dig.saved')}</Text>
          <Text variant="title">{t('dig.title')}</Text>
          {countdown != null ? <Text variant="caption">{t('dig.autoClose', { s: countdown })}</Text> : null}
        </View>

        <View style={styles.grid}>
          {PICKABLE.map((r) => {
            const selected = dig.result === r;
            return (
              <Pressable
                key={r}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => pickResult(r)}
                style={({ pressed }) => [
                  styles.result,
                  { backgroundColor: selected ? colors.ink : 'transparent', opacity: pressed ? 0.75 : 1 },
                ]}
              >
                <Text style={[styles.resultText, { color: selected ? colors.ivory : colors.ink }]}>
                  {t(`dig.result.${r}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {!details ? (
          <Button
            title={t('dig.details')}
            kind="ghost"
            onPress={() => {
              interact();
              setDetails(true);
            }}
          />
        ) : (
          <View style={{ gap: space.xl }}>
            <Rule strong />
            <View style={{ flexDirection: 'row', gap: space.lg }}>
              <View style={{ flex: 1 }}>
                <Field label={t('dig.targetId')} keyboardType="number-pad" value={targetId} onChangeText={setTargetId} onFocus={interact} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label={t('dig.depth')} keyboardType="number-pad" value={depth} onChangeText={setDepth} onFocus={interact} />
              </View>
            </View>
            <Field
              label={t('dig.titleField')}
              placeholder={t('dig.titlePlaceholder')}
              value={title}
              onChangeText={setTitle}
              onFocus={interact}
            />
            <Field label={t('dig.note')} value={note} onChangeText={setNote} multiline onFocus={interact} />

            {photos.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                {photos.map((p) => (
                  <Image key={p.id} source={{ uri: p.uri }} style={styles.photo} contentFit="cover" accessibilityIgnoresInvertColors />
                ))}
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Button title={t('dig.photo')} kind="secondary" style={{ flex: 1 }} onPress={() => addPhoto(false)} />
              <Button title={t('dig.addPhoto')} kind="secondary" style={{ flex: 1 }} onPress={() => addPhoto(true)} />
            </View>

            <VoiceNote
              digId={id}
              uri={dig.voiceUri}
              onSaved={async (uri) => {
                interact();
                await digsRepo.update(id, { voiceUri: uri });
                setDig((d) => (d ? { ...d, voiceUri: uri } : d));
              }}
            />

            <Button
              title={t('common.save')}
              size="lg"
              onPress={async () => {
                await saveFields();
                close();
              }}
            />
            <Button title={t('common.delete')} kind="danger" onPress={remove} />
          </View>
        )}
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  result: {
    width: '48.5%',
    minHeight: touch.large + 8,
    borderWidth: 1,
    borderColor: colors.ink,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultText: { fontFamily: fonts.display, fontSize: 24 },
  photo: { width: 96, height: 96, borderRadius: radius.sm, backgroundColor: colors.ivoryDeep },
});
