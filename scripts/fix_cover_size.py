import fitz, os, copy

input_path = '/home/z/my-project/download/GHMS_Business_Proposal.pdf'
output_path = '/home/z/my-project/download/GHMS_Business_Proposal.pdf'
a4_w, a4_h = 595.28, 841.89

with fitz.open(input_path) as src:
    with fitz.open() as out:
        for i in range(src.page_count):
            page = src.load_page(i)
            rect = page.rect
            pw, ph = rect.width, rect.height
            if abs(pw - a4_w) > 1 or abs(ph - a4_h) > 1:
                pix_w, pix_h = int(pw), int(ph)
                new_rect = fitz.Rect(a4_w, 0, a4_w + a4_w, a4_h)
                new_pix = fitz.Pixmap(pix_w, pix_h)
                new_pix.write_bytes(page.get_pixmap(clip=new_rect).tobytes())
                new_page = fitz.Page(new_pix)
                out.insert_pdf(new_page)
                print(f'Page {i}: rescaled')
            else:
                out.insert_pdf(page)
                print(f'Page {i}: OK')
        out.set_metadata({'title': 'GHMS Business Proposal', 'author': 'GHMS Team', 'subject': 'Guest House Management System Business Proposal'})
        out.save(output_path)
size_kb = os.path.getsize(output_path) / 1024
print(f'{out.page_count} pages, {size_kb:.0f} KB')
        print(f'Saved: {output_path}')
