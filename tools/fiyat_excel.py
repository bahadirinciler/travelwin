#!/usr/bin/env python3
"""Casa Di Datça fiyat tablosu (.xlsx) üretir — harici kütüphane gerektirmez.

Kurallar (otel sahibinin verdiği):
  Temmuz (1–31), 2 kişi:  1. kategori 9.000 ₺; her üst kategori bir öncekinin +%10'u
  Haziran = Temmuz −%20 · Mayıs = Haziran −%10 · Nisan = Mayıs −%10 · Ağustos = Temmuz +%10
  1–15 Eylül = Temmuz · 16 Eylül – 30 Ekim = Mayıs
  2 kişinin dışındaki her 7+ yaş kişi: +2.000 ₺/gece · Tek kişi: −1.000 ₺/gece
Tüm fiyatlar Excel formülüdür; "Parametreler" sayfasındaki değerler değişince tablo güncellenir.
Kullanım: python3 tools/fiyat_excel.py [çıktı.xlsx]
"""
import os, sys, zipfile
from xml.sax.saxutils import escape

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/Desktop/CasaDiDatca_Fiyat_Tablosu.xlsx')

P = dict(base=9000, step=0.10, jun=0.20, may=0.10, aug=0.10, extra=2000, single=1000, apr=0.10)

# Odalar: (ad, kategori, maks. kişi, teyit gerekiyor mu?)
ROOMS = [
    ('Lerici', 1, 2, False), ('Orvieto', 1, 2, False),
    ('Arezzo', 1, 3, True),
    ('Lucca', 2, 3, False), ('Portofino', 2, 2, False),
    ('Iseo-Como-Maggiore', 3, 3, False), ('Garda', 3, 3, False), ('Cinque Terre', 3, 2, False),
    ('Capri', 4, 4, False), ('Elba', 4, 5, False),
]
SEASONS = [  # (başlık, anahtar)
    ('Nisan\n1–30 Nisan', 'apr'), ('Mayıs\n1–31 Mayıs', 'may'), ('Haziran\n1–30 Haziran', 'jun'), ('Temmuz\n1–31 Temmuz', 'jul'),
    ('Ağustos\n1–31 Ağustos', 'aug'), ('Eylül (1. yarı)\n1–15 Eylül', 'sep1'), ('Eylül–Ekim\n16 Eylül – 30 Ekim', 'sep2'),
]

# ---------- Hesap (önbellek değerleri; Excel açılışta formülleri yeniden hesaplar) ----------
def R(x): return int(round(x))
jul = [P['base']]
for _ in range(3): jul.append(R(jul[-1] * (1 + P['step'])))
price = {}
for c in range(4):
    j = jul[c]; jn = R(j * (1 - P['jun'])); my = R(jn * (1 - P['may'])); ag = R(j * (1 + P['aug']))
    price[c] = dict(apr=R(my * (1 - P['apr'])), may=my, jun=jn, jul=j, aug=ag, sep1=j, sep2=my)

# ---------- Hücre yardımcıları ----------
COLS = 'ABCDEFGHIJKLMNOP'
def ref(c, r): return f'{COLS[c]}{r}'
def cell(c, r, v=None, f=None, s=0):
    a = f' r="{ref(c, r)}"' + (f' s="{s}"' if s else '')
    if f is not None:
        vv = '' if v is None else f'<v>{v}</v>'
        return f'<c{a}><f>{escape(f)}</f>{vv}</c>'
    if v is None: return f'<c{a}/>'
    if isinstance(v, (int, float)): return f'<c{a}><v>{v}</v></c>'
    return f'<c{a} t="inlineStr"><is><t xml:space="preserve">{escape(str(v))}</t></is></c>'

class Sheet:
    def __init__(self, name, widths):
        self.name, self.widths, self.rows, self.heights, self.merges = name, widths, {}, {}, []
    def put(self, c, r, v=None, f=None, s=0): self.rows.setdefault(r, []).append((c, cell(c, r, v, f, s)))
    def xml(self):
        cols = ''.join(f'<col min="{i+1}" max="{i+1}" width="{w}" customWidth="1"/>' for i, w in enumerate(self.widths))
        body = ''
        for r in sorted(self.rows):
            h = f' ht="{self.heights[r]}" customHeight="1"' if r in self.heights else ''
            body += f'<row r="{r}"{h}>' + ''.join(x for _, x in sorted(self.rows[r])) + '</row>'
        mg = (f'<mergeCells count="{len(self.merges)}">' + ''.join(f'<mergeCell ref="{m}"/>' for m in self.merges) + '</mergeCells>') if self.merges else ''
        return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
                '<sheetViews><sheetView workbookViewId="0"/></sheetViews>'
                f'<cols>{cols}</cols><sheetData>{body}</sheetData>{mg}'
                '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/></worksheet>')

# Stil numaraları (styles.xml cellXfs sırası)
DEF, BOLD, TL, PCT, HEAD, TLB, WARN, TITLE, NOTE, INPUT_TL, INPUT_PCT, CAT, TL_WARN, INPUT_N = range(14)

PS = "Parametreler"; S2 = "'2 Kişi Fiyatları'"
COL = {key: 2 + i for i, (_, key) in enumerate(SEASONS)}  # sezon → sütun indeksi
def L(key): return COLS[COL[key]]
# ---------- Sayfa 1: 2 kişi fiyatları ----------
t = Sheet('2 Kişi Fiyatları', [13, 34, 14, 14, 14, 14, 14, 15, 19])
t.put(0, 1, 'Casa Di Datça — Gecelik oda fiyatları (2 kişi, kahvaltı dahil)', s=TITLE)
t.put(0, 2, 'Tüm fiyatlar "Parametreler" sayfasındaki değerlerden formülle hesaplanır.', s=NOTE)
t.put(0, 4, 'Kategori', s=HEAD); t.put(1, 4, 'Odalar', s=HEAD)
for i, (h, _) in enumerate(SEASONS): t.put(2 + i, 4, h, s=HEAD)
t.heights[4] = 34
for c in range(4):
    r = 5 + c
    rooms = ', '.join(n + (' *' if w else '') for n, k, _, w in ROOMS if k == c + 1)
    t.put(0, r, f'{c + 1}. kategori', s=CAT); t.put(1, r, rooms, s=WARN if '*' in rooms else DEF)
    E = ref(COL['jul'], r)
    fj = f'{PS}!$B$4' if c == 0 else f'ROUND({ref(COL["jul"], r - 1)}*(1+{PS}!$B$5),0)'
    t.put(COL['jul'], r, price[c]['jul'], f=fj, s=TLB)
    t.put(COL['jun'], r, price[c]['jun'], f=f'ROUND({E}*(1-{PS}!$B$6),0)', s=TL)
    t.put(COL['may'], r, price[c]['may'], f=f'ROUND({ref(COL["jun"], r)}*(1-{PS}!$B$7),0)', s=TL)
    t.put(COL['apr'], r, price[c]['apr'], f=f'ROUND({ref(COL["may"], r)}*(1-{PS}!$B$11),0)', s=TL)
    t.put(COL['aug'], r, price[c]['aug'], f=f'ROUND({E}*(1+{PS}!$B$8),0)', s=TLB)
    t.put(COL['sep1'], r, price[c]['sep1'], f=f'{E}', s=TL)
    t.put(COL['sep2'], r, price[c]['sep2'], f=f'{ref(COL["may"], r)}', s=TL)
t.put(0, 10, '* Kategorisi teyit edilecek oda (aşağıdaki nota bakın).', s=NOTE)
t.put(0, 11, 'Ek kişi (2 kişinin dışında, 7 yaş ve üzeri): kişi başı gecelik +2.000 ₺ · Tek kişi: −1.000 ₺ → "Kişi Sayısına Göre" sayfası.', s=NOTE)
t.put(0, 12, 'Nisan = Mayıs −%10. 31 Ekim tabloda yok (16 Eylül – 30 Ekim dönemi).', s=NOTE)

# ---------- Sayfa 2: kişi sayısına göre ----------
k = Sheet('Kişi Sayısına Göre', [13, 22, 14, 14, 14, 14, 14, 15, 19])
k.put(0, 1, 'Kişi sayısına göre gecelik fiyatlar', s=TITLE)
k.put(0, 2, '1 kişi = 2 kişi fiyatı − tek kişi indirimi · 3+ kişi = 2 kişi fiyatı + (kişi − 2) × ek kişi ücreti (7 yaş ve üzeri)', s=NOTE)
row = 4
for n in (1, 2, 3, 4, 5):
    k.put(0, row, f'{n} kişi', s=HEAD); k.put(1, row, 'Uygun odalar', s=HEAD)
    for i, (h, _) in enumerate(SEASONS): k.put(2 + i, row, h, s=HEAD)
    k.heights[row] = 34
    for c in range(4):
        r = row + 1 + c
        fits = [nm for nm, kk, cap, _ in ROOMS if kk == c + 1 and cap >= n]
        k.put(0, r, f'{c + 1}. kategori', s=CAT); k.put(1, r, ', '.join(fits) if fits else '—', s=DEF)
        for i, (_, key) in enumerate(SEASONS):
            src = f"{S2}!{ref(2 + i, 5 + c)}"
            base = price[c][key]
            if n == 1: v, f = base - P['single'], f'{src}-{PS}!$B$10'
            elif n == 2: v, f = base, src
            else: v, f = base + (n - 2) * P['extra'], f'{src}+{n - 2}*{PS}!$B$9'
            k.put(2 + i, r, v if fits else None, f=f if fits else None, s=TL if fits else DEF)
            if not fits: k.put(2 + i, r, '—', s=DEF)
    row += 6

# ---------- Sayfa 3: odalar ----------
o = Sheet('Odalar', [22, 12, 11, 16, 16, 16, 44])
o.put(0, 1, 'Oda listesi', s=TITLE)
o.put(0, 2, 'Kategori sütununu (sarı) değiştirirsen fiyatlar otomatik güncellenir.', s=NOTE)
for i, h in enumerate(['Oda', 'Kategori', 'Maks. kişi', 'Mayıs (2 kişi)', 'Temmuz (2 kişi)', 'Ağustos (2 kişi)', 'Not']): o.put(i, 4, h, s=HEAD)
for j, (nm, kk, cap, warn) in enumerate(ROOMS):
    r = 5 + j
    o.put(0, r, nm, s=BOLD); o.put(1, r, kk, s=INPUT_N); o.put(2, r, cap, s=INPUT_N)
    o.put(3, r, price[kk - 1]['may'], f=f"INDEX({S2}!${L('may')}$5:${L('may')}$8,{ref(1, r)})", s=TL)
    o.put(4, r, price[kk - 1]['jul'], f=f"INDEX({S2}!${L('jul')}$5:${L('jul')}$8,{ref(1, r)})", s=TLB)
    o.put(5, r, price[kk - 1]['aug'], f=f"INDEX({S2}!${L('aug')}$5:${L('aug')}$8,{ref(1, r)})", s=TL)
    note = 'Kategori teyit edilecek (listede belirtilmemiş)' if warn else ''
    if nm in ('Capri',): note = 'Bahçe evi · kapasite teyit edilecek'
    if nm in ('Elba',): note = 'Aile dairesi · kapasite teyit edilecek'
    o.put(6, r, note, s=WARN if note else DEF)
o.put(0, 16, 'Web sitesine göre otelde 12 oda var; bu listede 10 oda adı bulunuyor.', s=NOTE)
o.put(0, 17, 'Maks. kişi değerleri fotoğraflardan tahmin edildi — lütfen kontrol edin.', s=NOTE)

# ---------- Sayfa 4: parametreler ----------
p = Sheet('Parametreler', [52, 16, 60])
p.put(0, 1, 'Fiyat parametreleri — sarı hücreleri değiştirebilirsin', s=TITLE)
p.put(0, 3, 'Parametre', s=HEAD); p.put(1, 3, 'Değer', s=HEAD); p.put(2, 3, 'Açıklama', s=HEAD)
rows = [
    ('Temmuz · 1. kategori · 2 kişi (gecelik)', P['base'], INPUT_TL, 'Lerici, Orvieto (+ Arezzo, teyit edilecek)'),
    ('Kategori artışı (bir önceki kategoriye göre)', P['step'], INPUT_PCT, '2. kat. = 1. kat. +%10 · 3. kat. = 2. kat. +%10 · 4. kat. = 3. kat. +%10'),
    ('Haziran indirimi (Temmuz\'a göre)', P['jun'], INPUT_PCT, 'Haziran = Temmuz −%20'),
    ('Mayıs indirimi (Haziran\'a göre)', P['may'], INPUT_PCT, 'Mayıs = Haziran −%10 · 16 Eylül–30 Ekim = Mayıs'),
    ('Ağustos artışı (Temmuz\'a göre)', P['aug'], INPUT_PCT, 'Ağustos = Temmuz +%10 · 1–15 Eylül = Temmuz'),
    ('Ek kişi ücreti (7 yaş ve üzeri, kişi başı gecelik)', P['extra'], INPUT_TL, '2 kişinin dışındaki her kişi için'),
    ('Tek kişi indirimi (gecelik)', P['single'], INPUT_TL, '1 kişi = 2 kişi fiyatı − bu tutar'),
    ('Nisan indirimi (Mayıs\'a göre)', P['apr'], INPUT_PCT, 'Nisan = Mayıs −%10'),
]
for j, (a, v, s_, d) in enumerate(rows):
    r = 4 + j
    p.put(0, r, a, s=BOLD); p.put(1, r, v, s=s_); p.put(2, r, d, s=NOTE)
p.put(0, 12, 'Varsayımlar (teyit edilecek)', s=TITLE)
for j, line in enumerate([
    '• Arezzo hiçbir kategoride belirtilmedi; geçici olarak 1. kategoriye kondu. (Cinque Terre = 3. kategori, otel sahibi teyit etti.)',
    '• "4. kategori: 4. kategori +%10" ifadesi "3. kategori +%10" olarak yorumlandı.',
    '• Ara değerler tam liraya yuvarlandı (örn. 4. kategori Temmuz 11.979 ₺). İstersen 50 ₺ / 100 ₺ katlarına yuvarlayabilirim.',
    '• Ek kişi ücreti ve tek kişi indirimi tüm sezonlarda sabit kabul edildi.',
]):
    p.put(0, 13 + j, line, s=NOTE); p.merges.append(f'A{13 + j}:C{13 + j}')

SHEETS = [t, k, o, p]

STYLES = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0 &quot;₺&quot;"/></numFmts>
<fonts count="6">
<font><sz val="11"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><name val="Calibri"/></font>
<font><b/><sz val="15"/><color rgb="FF0F172A"/><name val="Calibri"/></font>
<font><i/><sz val="10"/><color rgb="FF475569"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FF047857"/><name val="Calibri"/></font>
</fonts>
<fills count="6">
<fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF0F172A"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFFF59D"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFD1FAE5"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/></patternFill></fill>
</fills>
<borders count="2"><border/><border><left style="thin"><color rgb="FFE2E8F0"/></left><right style="thin"><color rgb="FFE2E8F0"/></right><top style="thin"><color rgb="FFE2E8F0"/></top><bottom style="thin"><color rgb="FFE2E8F0"/></bottom></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="14">
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="1" fillId="0" borderId="1" applyFont="1" applyBorder="1"><alignment vertical="center"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="9" fontId="0" fillId="0" borderId="1" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="0" fontId="4" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="164" fontId="5" fillId="4" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="0" fontId="0" fillId="3" borderId="1" applyFill="1" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" applyFont="1"><alignment vertical="center"/></xf>
<xf numFmtId="164" fontId="1" fillId="3" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="9" fontId="1" fillId="3" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="0" fontId="1" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf>
<xf numFmtId="164" fontId="0" fillId="3" borderId="1" applyNumberFormat="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="0" fontId="1" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>'''

def write(path):
    n = len(SHEETS)
    ct = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'
          '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
          + ''.join(f'<Override PartName="/xl/worksheets/sheet{i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' for i in range(n))
          + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>')
    rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
    wb = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'
          + ''.join(f'<sheet name="{escape(s.name)}" sheetId="{i+1}" r:id="rId{i+1}"/>' for i, s in enumerate(SHEETS))
          + '</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>')
    wbrels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
              + ''.join(f'<Relationship Id="rId{i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i+1}.xml"/>' for i in range(n))
              + f'<Relationship Id="rId{n+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>')
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', ct); z.writestr('_rels/.rels', rels)
        z.writestr('xl/workbook.xml', wb); z.writestr('xl/_rels/workbook.xml.rels', wbrels)
        z.writestr('xl/styles.xml', STYLES)
        for i, s in enumerate(SHEETS): z.writestr(f'xl/worksheets/sheet{i+1}.xml', s.xml())

write(OUT)
print(OUT)
for c in range(4): print(f'{c+1}. kat', price[c])
