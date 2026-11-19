import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { Field } from '@/components/Field';
import { Button, Chip, Rule, Screen, Section, Text } from '@/components/ui';
import { devicesRepo } from '@/db/repo';
import type { Device } from '@/db/schema';
import { DEVICE_CATALOG, catalogEntry } from '@/features/devices/catalog';
import { parseDayMonthYear, parseOptionalInt, toDayMonthYear } from '@/lib/format';
import { space } from '@/theme/tokens';

const TECHS: Device['technology'][] = ['vlf', 'smf', 'pi', 'other'];

export default function EditDevice() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { t } = useTranslation();
  const router = useRouter();

  const [catalogId, setCatalogId] = useState<string | null>(null);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [technology, setTechnology] = useState<Device['technology']>('vlf');
  const [frequencies, setFrequencies] = useState('');
  const [coil, setCoil] = useState('');
  const [serial, setSerial] = useState('');
  const [purchased, setPurchased] = useState('');
  const [warranty, setWarranty] = useState('');

  useEffect(() => {
    if (!id) return;
    void devicesRepo.get(id).then((d) => {
      if (!d) return;
      setCatalogId(d.catalogId);
      setBrand(d.brand);
      setModel(d.model);
      setTechnology(d.technology);
      setFrequencies(d.frequencies ?? '');
      setCoil(d.coil ?? '');
      setSerial(d.serial ?? '');
      setPurchased(toDayMonthYear(d.purchasedAt));
      setWarranty(d.warrantyMonths != null ? String(d.warrantyMonths) : '');
    });
  }, [id]);

  const applyCatalog = (entryId: string) => {
    const c = catalogEntry(entryId);
    if (!c) return;
    setCatalogId(c.id);
    setBrand(c.brand);
    setModel(c.model);
    setTechnology(c.technology);
    setFrequencies(c.frequencies);
    setCoil(c.coil);
    setWarranty(String(c.warrantyMonths));
  };

  const save = async () => {
    if (!brand.trim() || !model.trim()) {
      Alert.alert(t('devices.brand'), t('devices.model'));
      return;
    }
    const values = {
      catalogId,
      brand: brand.trim(),
      model: model.trim(),
      technology,
      frequencies: frequencies.trim() || null,
      coil: coil.trim() || null,
      serial: serial.trim() || null,
      purchasedAt: parseDayMonthYear(purchased),
      warrantyMonths: parseOptionalInt(warranty),
      notes: null,
    };
    if (id) await devicesRepo.update(id, values);
    else await devicesRepo.create(values);
    router.back();
  };

  const remove = async () => {
    if (!id) return;
    await devicesRepo.remove(id);
    router.back();
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ gap: space.xs }}>
        <Text variant="label">{t('devices.title')}</Text>
        <Text variant="title">{id ? `${brand} ${model}` : t('devices.add')}</Text>
      </View>

      {!id ? (
        <Section label={t('devices.fromCatalog')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {DEVICE_CATALOG.map((c) => (
              <Chip key={c.id} label={`${c.brand} ${c.model}`} selected={catalogId === c.id} onPress={() => applyCatalog(c.id)} />
            ))}
          </View>
          <Text variant="caption">{t('devices.catalogNote')}</Text>
        </Section>
      ) : null}

      <Rule strong />

      <Field label={t('devices.brand')} value={brand} onChangeText={setBrand} />
      <Field label={t('devices.model')} value={model} onChangeText={setModel} />
      <Section label={t('devices.technology')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {TECHS.map((x) => (
            <Chip key={x} label={t(`devices.tech.${x}`)} selected={technology === x} onPress={() => setTechnology(x)} />
          ))}
        </View>
      </Section>
      <Field label={t('devices.frequencies')} value={frequencies} onChangeText={setFrequencies} />
      <Field label={t('devices.coil')} value={coil} onChangeText={setCoil} />
      <Field label={t('devices.serial')} value={serial} onChangeText={setSerial} autoCapitalize="characters" />
      <Field label={t('devices.purchasedAt')} value={purchased} onChangeText={setPurchased} keyboardType="numbers-and-punctuation" />
      <Field label={t('devices.warrantyMonths')} value={warranty} onChangeText={setWarranty} keyboardType="number-pad" />

      <Button title={t('common.save')} size="lg" onPress={save} />
      {id ? <Button title={t('common.delete')} kind="danger" onPress={remove} /> : null}
      <Button title={t('common.cancel')} kind="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
