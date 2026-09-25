import xml.etree.ElementTree as ET
import os

source = r'C:\Users\crist\Downloads\claude_temp\res\res\layout\activity_main.xml'
target = r'C:\Users\crist\OneDrive\Documentos\Proyecto\kiosk-launcher\app\src\main\res\layout\activity_main.xml'

with open(source, 'r', encoding='utf-8') as f:
    xml_str = f.read()

# 1. Rename IDs for MainActivity
xml_str = xml_str.replace('btnMic', 'pillVoice')
xml_str = xml_str.replace('cardPhone', 'cardCall')
xml_str = xml_str.replace('cardEmergency', 'cardSos')
xml_str = xml_str.replace('cardAddFunction', 'cardAdd')
xml_str = xml_str.replace('@mipmap/ic_launcher', '@drawable/logo_mivor_real')

# 2. Modify to Zero Scroll
# Change ScrollView to LinearLayout
xml_str = xml_str.replace('<ScrollView', '<LinearLayout')
xml_str = xml_str.replace('</ScrollView>', '</LinearLayout>')
# Add orientation to the root LinearLayout (it was a ScrollView)
# Wait, ScrollView doesn't have orientation. So:
xml_str = xml_str.replace('android:fillViewport="true"', 'android:orientation="vertical"')

# The inner LinearLayout is now redundant but we can keep it as the main weight container.
# Let's change the inner LinearLayout's layout_height from "wrap_content" to "match_parent"
# Actually, let's just make the inner LinearLayout match_parent and have weight sum.
xml_str = xml_str.replace('android:layout_height="wrap_content"\n        android:orientation="vertical"\n        android:paddingHorizontal="10dp"', 'android:layout_height="match_parent"\n        android:orientation="vertical"\n        android:paddingHorizontal="10dp"')

# For every MaterialCardView acting as a row (HomeWide) or LinearLayout acting as a row, we add layout_weight="1" and change height to 0dp.
# It's easier to do this with regex or string replacement, or just parse XML.
# Let's use regex for safety and precision.
import re

# Fix top Mic wrapper
xml_str = re.sub(r'(<FrameLayout[^>]*?android:layout_height=")230dp(")', r'\g<1>0dp\2\n            android:layout_weight="1.2"', xml_str, count=1)
# Wait, FrameLayout uses fixed 230dp, and the circles inside use 230dp/190dp/150dp. If we change to 0dp, they will squash.
# Better to scale down the circles.
xml_str = xml_str.replace('230dp', '160dp')
xml_str = xml_str.replace('190dp', '130dp')
xml_str = xml_str.replace('150dp', '100dp')
xml_str = xml_str.replace('72dp', '50dp') # Mic icon

# Make the inner LinearLayout height match_parent
xml_str = xml_str.replace('android:layout_height="wrap_content"\n        android:orientation="vertical"\n        android:paddingHorizontal="10dp"', 'android:layout_height="match_parent"\n        android:orientation="vertical"\n        android:paddingHorizontal="10dp"')

# Add layout_weight to rows
# Row 1: Mivor
xml_str = xml_str.replace('android:id="@+id/cardMivor"\n            style="@style/HomeWide"', 'android:id="@+id/cardMivor"\n            style="@style/HomeWide"\n            android:layout_height="0dp"\n            android:layout_weight="1.1"')

# Row 2, 3, 4: LinearLayouts horizontal
xml_str = xml_str.replace('android:layout_height="wrap_content"\n            android:layout_marginBottom="12dp"\n            android:baselineAligned="false"\n            android:orientation="horizontal"', 'android:layout_height="0dp"\n            android:layout_weight="1"\n            android:layout_marginBottom="12dp"\n            android:baselineAligned="false"\n            android:orientation="horizontal"')

# Inside horizontal LinearLayouts, cards are match_parent.
# Wait, style="@style/HomeHalf" probably sets height. Let's make sure it stretches.
# We will inject android:layout_height="match_parent" inside the style definition or directly in the tags.
xml_str = xml_str.replace('style="@style/HomeHalf"', 'style="@style/HomeHalf"\n                android:layout_height="match_parent"')

# Row 5: Settings
xml_str = xml_str.replace('android:id="@+id/cardSettings"\n            style="@style/HomeWide"', 'android:id="@+id/cardSettings"\n            style="@style/HomeWide"\n            android:layout_height="0dp"\n            android:layout_weight="1"')

# Row 6: Logout
xml_str = xml_str.replace('android:id="@+id/cardLogout"\n            style="@style/HomeWide"', 'android:id="@+id/cardLogout"\n            style="@style/HomeWide"\n            android:layout_height="0dp"\n            android:layout_weight="1"')


# Remove previous height from HomeWide in the XML string if present
xml_str = xml_str.replace('style="@style/HomeWide"\n            android:layout_height="wrap_content"', 'style="@style/HomeWide"')

# Fix inner Layouts of HomeWide to match_parent so they center vertically
xml_str = xml_str.replace('<LinearLayout\n                android:layout_width="match_parent"\n                android:layout_height="wrap_content"\n                android:gravity="center_vertical"', '<LinearLayout\n                android:layout_width="match_parent"\n                android:layout_height="match_parent"\n                android:gravity="center_vertical"')

# Finally append Dummies right before the last </LinearLayout>
dummies = """
    <!-- Dummies -->
    <View android:id="@+id/cardFamily" android:layout_width="0dp" android:layout_height="0dp" android:visibility="gone" />
    <View android:id="@+id/cardMeds" android:layout_width="0dp" android:layout_height="0dp" android:visibility="gone" />
    <View android:id="@+id/cardAppts" android:layout_width="0dp" android:layout_height="0dp" android:visibility="gone" />
    <TextView android:id="@+id/tvDate" android:layout_width="0dp" android:layout_height="0dp" android:visibility="gone" />
    <TextView android:id="@+id/tvClock" android:layout_width="0dp" android:layout_height="0dp" android:visibility="gone" />
    <TextView android:id="@+id/tvVoiceStatus" android:layout_width="0dp" android:layout_height="0dp" android:visibility="gone" />
</LinearLayout>
"""

# Find the last occurrence of </LinearLayout> and replace it
idx = xml_str.rfind('</LinearLayout>')
if idx != -1:
    xml_str = xml_str[:idx] + dummies + xml_str[idx+15:]

with open(target, 'w', encoding='utf-8') as f:
    f.write(xml_str)
