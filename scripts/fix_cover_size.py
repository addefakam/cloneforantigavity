from pypdf import PdfReader, PdfWriter
from pypdf.generic import ArrayObject, FloatObject, NameObject
import copy

cover_reader = PdfReader('scripts/ghms_proposal_cover.pdf')
body_reader = PdfReader('scripts/ghms_proposal_body.pdf')

bp = body_reader.pages[0]
tw = float(bp.mediabox.width)
th = float(bp.mediabox.height)

cp = cover_reader.pages[0]
sw = float(cp.mediabox.width)
sh = float(cp.mediabox.height)

print(f'Cover: {sw:.2f} x {sh:.2f}')
print(f'Body:  {tw:.2f} x {th:.2f}')

writer = PdfWriter()

# Deep copy cover and override mediabox
cp2 = copy.deepcopy(cp)
cp2[NameObject('/MediaBox')] = ArrayObject([FloatObject(0), FloatObject(0), FloatObject(tw), FloatObject(th)])
writer.add_page(cp2)

for p in body_reader.pages:
    writer.add_page(p)

writer.write('download/GHMS_Proposal.pdf')
print('Done. Total pages:', len(body_reader.pages) + 1)
