import fitz, os

output = '/home/z/my-project/download/GHMS_Business_Proposal.pdf'

# Use PyMuPDF (fitz) which is more robust
result = fitz.open()

# Insert cover as page 0
cover = fitz.open('/home/z/my-project/scripts/proposal_cover.pdf')
result.insert_pdf(cover)
cover.close()

# Insert body pages after cover
body = fitz.open('/home/z/my-project/scripts/proposal_body.pdf')
result.insert_pdf(body)
body.close()

# Set metadata
result.set_metadata({
    'title': 'GHMS Business Proposal',
    'author': 'GHMS Team',
    'subject': 'Guest House Management System Business Proposal for Stakeholders'
})

result.save(output)
size_kb = os.path.getsize(output) / 1024
print(f'Total pages: {result.page_count}, Size: {size_kb:.0f} KB')
print(f'Saved: {output}')
