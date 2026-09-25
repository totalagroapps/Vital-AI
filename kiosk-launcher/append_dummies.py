with open('app/src/main/res/layout/activity_main.xml', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(len(lines)-1, -1, -1):
    if '</LinearLayout>' in lines[i]:
        lines.insert(i, """
    <!-- Dummies for MainActivity.kt -->
    <View android:id="@+id/cardFamily" android:layout_width="0dp" android:layout_height="0dp" android:visibility="gone" />
    <View android:id="@+id/cardMeds" android:layout_width="0dp" android:layout_height="0dp" android:visibility="gone" />
    <View android:id="@+id/cardAppts" android:layout_width="0dp" android:layout_height="0dp" android:visibility="gone" />
    <TextView android:id="@+id/tvDate" android:layout_width="0dp" android:layout_height="0dp" android:visibility="gone" />
    <TextView android:id="@+id/tvClock" android:layout_width="0dp" android:layout_height="0dp" android:visibility="gone" />
""")
        break

with open('app/src/main/res/layout/activity_main.xml', 'w', encoding='utf-8') as f:
    f.writelines(lines)
