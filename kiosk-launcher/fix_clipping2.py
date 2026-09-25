import re

# 1. Update styles_home.xml
styles_file = r'C:\Users\crist\OneDrive\Documentos\Proyecto\kiosk-launcher\app\src\main\res\values\styles_home.xml'
with open(styles_file, 'r', encoding='utf-8') as f:
    s = f.read()

# Shrink margins from 6dp to 3dp to give cards more height
s = s.replace('<item name="android:layout_margin">6dp</item>', '<item name="android:layout_margin">3dp</item>')

# Shrink IconCircle to 44dp and padding 8dp (was 52dp/12dp)
s = re.sub(r'(<style name="IconCircle".*?>.*?<item name="android:layout_width">)52dp(</item>)', r'\g<1>44dp\2', s, flags=re.DOTALL)
s = re.sub(r'(<style name="IconCircle".*?>.*?<item name="android:layout_height">)52dp(</item>)', r'\g<1>44dp\2', s, flags=re.DOTALL)
s = re.sub(r'(<style name="IconCircle".*?>.*?<item name="android:padding">)12dp(</item>)', r'\g<1>8dp\2', s, flags=re.DOTALL)

# TileSub text size 11sp -> 10sp, add maxLines and ellipsize
s = re.sub(r'(<style name="TileSub".*?>.*?<item name="android:textSize">)11sp(</item>)', r'\g<1>10sp\2', s, flags=re.DOTALL)
if '<item name="android:maxLines">' not in s:
    s = s.replace('</style>', '    <item name="android:maxLines">2</item>\n        <item name="android:ellipsize">end</item>\n    </style>', 1)
# Wait, replacing just the first </style> might break HomeCard.
# Let's insert it specifically into TileSub
tile_sub_style = """    <style name="TileSub">
        <item name="android:textColor">@color/text_sub</item>
        <item name="android:textSize">10sp</item>
        <item name="android:fontFamily">sans-serif-condensed</item>
        <item name="android:layout_marginTop">1dp</item>
        <item name="android:lineSpacingMultiplier">0.9</item>
        <item name="android:maxLines">2</item>
        <item name="android:ellipsize">end</item>
    </style>"""
s = re.sub(r'<style name="TileSub">.*?</style>', tile_sub_style, s, flags=re.DOTALL)

# WideSub text size 14sp -> 12sp
s = re.sub(r'(<style name="WideSub".*?>.*?<item name="android:textSize">)14sp(</item>)', r'\g<1>12sp\2', s, flags=re.DOTALL)
wide_sub_style = """    <style name="WideSub" parent="TileSub">
        <item name="android:textSize">12sp</item>
        <item name="android:maxLines">1</item>
    </style>"""
s = re.sub(r'<style name="WideSub" parent="TileSub">.*?</style>', wide_sub_style, s, flags=re.DOTALL)

with open(styles_file, 'w', encoding='utf-8') as f:
    f.write(s)


# 2. Update activity_main.xml
layout_file = r'C:\Users\crist\OneDrive\Documentos\Proyecto\kiosk-launcher\app\src\main\res\layout\activity_main.xml'
with open(layout_file, 'r', encoding='utf-8') as f:
    xml = f.read()

# Inner card frame paddings 10dp -> 6dp
xml = xml.replace('android:padding="10dp"', 'android:padding="6dp"')
xml = xml.replace('android:padding="12dp"', 'android:padding="8dp"') # For Mivor/Settings Wide cards

# Fix Logo size 70dp -> 54dp
xml = xml.replace('android:layout_width="70dp"\n                    android:layout_height="70dp"', 'android:layout_width="54dp"\n                    android:layout_height="54dp"')

# Adjust layout weights to redistribute vertical space
# Mic: 1.4 -> 1.2
xml = xml.replace('android:layout_weight="1.4"', 'android:layout_weight="1.2"')

# Mivor: 1.0 -> 1.0 (unchanged)
# Settings: 1 -> 0.8
xml = xml.replace('android:id="@+id/cardSettings"\n            style="@style/HomeWide"\n            android:layout_height="0dp"\n            android:layout_weight="1"', 'android:id="@+id/cardSettings"\n            style="@style/HomeWide"\n            android:layout_height="0dp"\n            android:layout_weight="0.8"')
# Logout: 1 -> 0.8
xml = xml.replace('android:id="@+id/cardLogout"\n            style="@style/HomeWide"\n            android:layout_height="0dp"\n            android:layout_weight="1"', 'android:id="@+id/cardLogout"\n            style="@style/HomeWide"\n            android:layout_height="0dp"\n            android:layout_weight="0.8"')

# 2x3 grid rows are 1.2. Let's make them 1.35.
xml = xml.replace('android:layout_weight="1.2"\n            android:baselineAligned="false"', 'android:layout_weight="1.35"\n            android:baselineAligned="false"')

# Fix chevron width/height issue inside Settings/Logout so they aren't huge
xml = xml.replace('<ImageView\n                    style="@style/ChevronBig"', '<ImageView\n                    style="@style/Chevron"')

with open(layout_file, 'w', encoding='utf-8') as f:
    f.write(xml)
