import re

# 1. Fix styles_home.xml
styles_file = r'C:\Users\crist\OneDrive\Documentos\Proyecto\kiosk-launcher\app\src\main\res\values\styles_home.xml'
with open(styles_file, 'r', encoding='utf-8') as f:
    s = f.read()

# TileTitle textSize from 17sp to 15sp
s = re.sub(r'(<style name="TileTitle".*?>.*?<item name="android:textSize">)17sp(</item>)', r'\g<1>15sp\2', s, flags=re.DOTALL)
# TileSub textSize from 12sp to 11sp, margin to 2dp
s = re.sub(r'(<style name="TileSub".*?>.*?<item name="android:textSize">)12sp(</item>)', r'\g<1>11sp\2', s, flags=re.DOTALL)
s = re.sub(r'(<style name="TileSub".*?>.*?<item name="android:layout_marginTop">)6dp(</item>)', r'\g<1>2dp\2', s, flags=re.DOTALL)
# WideTitle textSize from 26sp to 22sp
s = re.sub(r'(<style name="WideTitle".*?>.*?<item name="android:textSize">)26sp(</item>)', r'\g<1>22sp\2', s, flags=re.DOTALL)
# WideSub textSize from 17sp to 14sp
s = re.sub(r'(<style name="WideSub".*?>.*?<item name="android:textSize">)17sp(</item>)', r'\g<1>14sp\2', s, flags=re.DOTALL)
# IconCircle size 64->52, padding 16->12
s = re.sub(r'(<style name="IconCircle".*?>.*?<item name="android:layout_width">)64dp(</item>)', r'\g<1>52dp\2', s, flags=re.DOTALL)
s = re.sub(r'(<style name="IconCircle".*?>.*?<item name="android:layout_height">)64dp(</item>)', r'\g<1>52dp\2', s, flags=re.DOTALL)
s = re.sub(r'(<style name="IconCircle".*?>.*?<item name="android:padding">)16dp(</item>)', r'\g<1>12dp\2', s, flags=re.DOTALL)

with open(styles_file, 'w', encoding='utf-8') as f:
    f.write(s)

# 2. Fix activity_main.xml overrides and paddings
layout_file = r'C:\Users\crist\OneDrive\Documentos\Proyecto\kiosk-launcher\app\src\main\res\layout\activity_main.xml'
with open(layout_file, 'r', encoding='utf-8') as f:
    xml = f.read()

# FrameLayout padding for HomeTile cards from 14dp to 10dp to give text more room
xml = xml.replace('<FrameLayout\n                    android:layout_width="match_parent"\n                    android:layout_height="match_parent"\n                    android:padding="14dp">', '<FrameLayout\n                    android:layout_width="match_parent"\n                    android:layout_height="match_parent"\n                    android:padding="10dp">')
xml = xml.replace('android:padding="14dp"', 'android:padding="10dp"')

# Adjust manual text sizes in MIVOR header
xml = xml.replace('android:textSize="28sp"', 'android:textSize="20sp"')
xml = xml.replace('android:textSize="30sp"', 'android:textSize="22sp"')

# Reduce Logo size from 100dp to 70dp so it doesn't force a huge height clipping
xml = xml.replace('android:layout_width="100dp"\n                    android:layout_height="100dp"', 'android:layout_width="70dp"\n                    android:layout_height="70dp"')

# Reduce the inner padding for Wide cards from 16dp to 12dp
xml = xml.replace('android:padding="16dp"', 'android:padding="12dp"')

with open(layout_file, 'w', encoding='utf-8') as f:
    f.write(xml)

