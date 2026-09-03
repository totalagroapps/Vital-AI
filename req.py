import urllib.request
try:
    with urllib.request.urlopen('https://vitalia.up.railway.app') as response:
        html = response.read()
        print("STATUS:", response.status)
        print("HTML LENGTH:", len(html))
        print("HTML PREVIEW:", html[:200])
except Exception as e:
    print("ERROR:", e)
