import os

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_func = '''
  const clearAttachments = () => {
    setSelectedImage(null);
    setSelectedImagePreview(null);
    setSelectedImageFile(null);
    setSelectedPdf(null);
    setSelectedPdfName("");
  };
'''

if 'const clearAttachments =' not in content:
    content = content.replace("  const handleImageChange =", new_func + "\n  const handleImageChange =")
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added clearAttachments")
