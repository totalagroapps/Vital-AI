import re

target = r'C:\Users\crist\OneDrive\Documentos\Proyecto\kiosk-launcher\app\src\main\res\layout\activity_main.xml'
with open(target, 'r', encoding='utf-8') as f:
    xml_str = f.read()

# Replace the horizontal rows layout definition
old_row = """        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:baselineAligned="false"
            android:orientation="horizontal">"""
            
new_row = """        <LinearLayout
            android:layout_width="match_parent"
            android:layout_height="0dp"
            android:layout_weight="1.2"
            android:baselineAligned="false"
            android:orientation="horizontal">"""

xml_str = xml_str.replace(old_row, new_row)

# The wide cards were given 1.1 layout_weight. Let's make them 1.0
xml_str = xml_str.replace('android:layout_weight="1.1"', 'android:layout_weight="1"')

# Let's give the Mic container a weight of 1.4 so it has plenty of space.
xml_str = xml_str.replace('android:layout_weight="1.2"\n            android:layout_gravity="center_horizontal"', 'android:layout_weight="1.4"\n            android:layout_gravity="center_horizontal"')

# We also need to shrink the text sizes a tiny bit because they are wrapping and overflowing (e.g. "Llamar por teléfono")
xml_str = xml_str.replace('android:textSize="20sp"', 'android:textSize="17sp"')
xml_str = xml_str.replace('android:textSize="14sp"', 'android:textSize="12sp"')

with open(target, 'w', encoding='utf-8') as f:
    f.write(xml_str)
