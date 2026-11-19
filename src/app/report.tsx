import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Button, Chip, Rule, Screen, Section, Text } from '@/components/ui';
import { sitesRepo } from '@/db/repo';
import { currentPosition, ensureLocationPermission } from '@/features/hunt/service';
import { buildReportRequest, fetchSiteReport } from '@/features/report/api';
import type { ReportResponse, ReportTarget } from '@/features/report/types';
import { useSettings } from '@/features/settings/store';
import { backendConfigured } from '@/lib/config';
import { useData } from '@/lib/useData';
import { colors, space } from '@/theme/tokens';

const TARGETS: ReportTarget[] = ['general', 'coin', 'jewelry', 'relic', 'gold'];
type When = 'today' | 'tomorrow' | 'weekend';

function dateFor(when: When): Date {
  const d = new Date();
  if (when === 'tomorrow') d.setDate(d.getDate() + 1);
  if (when === 'weekend') d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
  return d;
}

export default function Report() {
  const { t } = useTranslation();
  const router = useRouter();
  const language = useSettings((s) => s.language);
  const { data: sites = [] } = useData(() => sitesRepo.list());

  const [siteId, setSiteId] = useState<string | null>(null);
  const [when, setWhen] = useState<When>('today');
  const [target, setTarget] = useState<ReportTarget>('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportResponse | null>(null);

  const generate = async () => {
    setError(null);
    setLoading(true);
    try {
      let lat: number;
      let lng: number;
      const site = sites.find((s) => s.id === siteId);
      if (site) {
        lat = site.centerLat;
        lng = site.centerLng;
      } else {
        if ((await ensureLocationPermission()) === 'denied') throw new Error('location');
        const pos = await currentPosition();
        if (!pos) throw new Error('location');
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }
      const req = await buildReportRequest({ lat, lng, date: dateFor(when), target, language, siteId: site?.id });
      setReport(await fetchSiteReport(req));
    } catch {
      setError(t('report.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={{ gap: space.xs }}>
        <Button title={`← ${t('common.back')}`} kind="ghost" style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} onPress={() => router.back()} />
        <Text variant="label">{t('home.siteReport')}</Text>
        <Text variant="display">{t('report.title')}</Text>
        <Text variant="muted">{t('report.body')}</Text>
      </View>

      {!backendConfigured ? (
        <Text variant="muted" style={{ color: colors.danger }}>
          {t('report.notConfigured')}
        </Text>
      ) : null}

      <Section label={t('start.where')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          <Chip label={t('report.useCurrent')} selected={siteId === null} onPress={() => setSiteId(null)} />
          {sites.map((s) => (
            <Chip key={s.id} label={s.name} selected={siteId === s.id} onPress={() => setSiteId(s.id)} />
          ))}
        </View>
      </Section>

      <Section label={t('report.date')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {(['today', 'tomorrow', 'weekend'] as When[]).map((w) => (
            <Chip key={w} label={t(`report.${w}`)} selected={when === w} onPress={() => setWhen(w)} />
          ))}
        </View>
      </Section>

      <Section label={t('start.target')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {TARGETS.map((x) => (
            <Chip key={x} label={t(`target.${x}`)} selected={target === x} onPress={() => setTarget(x)} />
          ))}
        </View>
      </Section>

      <Button title={t('report.generate')} size="lg" loading={loading} disabled={!backendConfigured} onPress={generate} />
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}

      {report ? <ReportView report={report} /> : null}
    </Screen>
  );
}

function ReportView({ report }: { report: ReportResponse }) {
  const { t } = useTranslation();
  const r = report.recommendation;
  return (
    <View style={{ gap: space.xl }}>
      <Rule strong />
      <Section label={t('report.region')}>
        <Text variant="heading">{report.region.summary}</Text>
        {report.region.periods.length ? <Text variant="muted">{report.region.periods.join(' · ')}</Text> : null}
      </Section>
      <View style={{ flexDirection: 'row', gap: space.lg }}>
        <View style={{ flex: 1, gap: space.xs }}>
          <Text variant="label">{t('report.soil')}</Text>
          <Text variant="body">{report.soil.summary}</Text>
        </View>
        <View style={{ flex: 1, gap: space.xs }}>
          <Text variant="label">{t('report.weather')}</Text>
          <Text variant="body">{report.weather.summary}</Text>
          <Text variant="muted">{report.weather.groundCondition}</Text>
        </View>
      </View>

      <View style={{ backgroundColor: colors.ink, padding: space.xl, gap: space.sm, borderRadius: 2 }}>
        <Text variant="label" tone="dark">
          {t('report.recommendation')}
          {r.deviceModel ? ` · ${r.deviceModel}` : ''}
        </Text>
        <Text tone="dark">{r.mode}</Text>
        <Text tone="dark">{r.groundBalance}</Text>
        <Text tone="dark">{r.coil}</Text>
        {r.notes.map((n, i) => (
          <Text key={i} variant="muted" tone="dark">
            {n}
          </Text>
        ))}
      </View>

      {report.history ? (
        <Section label={t('report.history')}>
          <Text variant="body">{report.history}</Text>
        </Section>
      ) : null}

      <Text variant="caption">{t('report.protectedNote')}</Text>

      {report.sources.length ? (
        <Section label={t('report.sources')}>
          {report.sources.map((s) => (
            <Pressable key={s.url} accessibilityRole="link" onPress={() => Linking.openURL(s.url)}>
              <Text variant="muted" style={{ textDecorationLine: 'underline' }}>
                {s.title}
              </Text>
            </Pressable>
          ))}
        </Section>
      ) : null}
    </View>
  );
}
