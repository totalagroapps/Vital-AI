import base64
import requests
import json

# create a dummy image
from PIL import Image
import io

img = Image.new('RGB', (100, 100), color = 'red')
buffered = io.BytesIO()
img.save(buffered, format="JPEG")
img_str = buffered.getvalue()

files = {'file': ('test.jpg', img_str, 'image/jpeg')}
resp = requests.post("http://127.0.0.1:8000/api/documents/upload", files=files)
print(resp.status_code)
print(json.dumps(resp.json(), indent=2))
