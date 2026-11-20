import { getLegalDocument, isLegalDocId } from '../documents';

describe('legal documents', () => {
  it('recognises only known ids', () => {
    expect(isLegalDocId('privacy')).toBe(true);
    expect(isLegalDocId('terms')).toBe(true);
    expect(isLegalDocId('cookies')).toBe(false);
    expect(isLegalDocId(undefined)).toBe(false);
  });

  it('picks Turkish for tr locales and English otherwise', () => {
    expect(getLegalDocument('privacy', 'tr-TR').title).toBe('Gizlilik Politikası');
    expect(getLegalDocument('terms', 'de').title).toBe('Terms of Use');
  });

  it('keeps TR and EN versions structurally aligned', () => {
    for (const id of ['privacy', 'terms'] as const) {
      const tr = getLegalDocument(id, 'tr');
      const en = getLegalDocument(id, 'en');
      expect(tr.sections).toHaveLength(en.sections.length);
      tr.sections.forEach((s, i) => expect(s.body).toHaveLength(en.sections[i]!.body.length));
    }
  });
});
