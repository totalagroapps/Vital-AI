cards_grid = [
    [
        ('cardCall', 'call_card', '@android:drawable/ic_menu_call', 'blue_icon', 'Teléfono'),
        ('cardWhatsapp', 'whatsapp_card', '@drawable/ic_whatsapp', 'green_icon', 'WhatsApp'),
    ],
    [
        ('cardSos', 'sos_card', '@drawable/ic_sos_emergency', 'red_icon', 'Ayuda (SOS)'),
        ('cardCamera', 'settings_card', '@android:drawable/ic_menu_camera', 'purple_icon', 'Cámara'),
    ],
    [
        ('cardGallery', 'meds_card', '@android:drawable/ic_menu_gallery', 'orange_icon', 'Galería'),
        ('cardAdd', 'background_blue', '@android:drawable/ic_menu_add', 'secondary_text', 'Agregar'),
    ]
]

xml = '''<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="8dp"
    android:background="#DDF3FF">

    <!-- MIC HEADER (Compacted to save space for cards) -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:gravity="center"
        android:layout_marginBottom="8dp"
        android:layout_marginTop="8dp">
        <androidx.cardview.widget.CardView
            android:id="@+id/pillVoice"
            android:layout_width="80dp"
            android:layout_height="80dp"
            app:cardCornerRadius="40dp"
            app:cardElevation="0dp"
            app:cardBackgroundColor="@color/blue_icon">
            <ImageView
                android:layout_width="40dp"
                android:layout_height="40dp"
                android:layout_gravity="center"
                android:src="@android:drawable/ic_btn_speak_now"
                app:tint="@color/white" />
        </androidx.cardview.widget.CardView>
        <TextView
            android:id="@+id/tvVoiceStatus"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="Toca para hablar"
            android:textColor="@color/navy_text"
            android:textSize="18sp"
            android:textStyle="bold"
            android:layout_marginTop="4dp" />
    </LinearLayout>

    <!-- CONTENT AREA (WEIGHT = 1 -> STRETCHES TO FILL, ZERO SCROLL) -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:orientation="vertical">

        <!-- MIVOR SALUD (Full width) -->
        <androidx.cardview.widget.CardView
            android:id="@+id/cardMivor"
            android:layout_width="match_parent"
            android:layout_height="0dp"
            android:layout_weight="1.2"
            android:layout_margin="4dp"
            app:cardCornerRadius="20dp"
            app:cardElevation="0dp"
            app:cardBackgroundColor="@color/white">
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="match_parent"
                android:orientation="horizontal"
                android:gravity="center_vertical"
                android:padding="8dp">
                <ImageView
                    android:layout_width="0dp"
                    android:layout_height="match_parent"
                    android:layout_weight="0.3"
                    android:src="@drawable/logo_mivor_real"
                    android:scaleType="fitCenter" />
                <TextView
                    android:layout_width="0dp"
                    android:layout_height="match_parent"
                    android:layout_weight="0.7"
                    android:text="Acceder a MIVOR Salud"
                    android:textColor="@color/navy_text"
                    android:textStyle="bold"
                    android:gravity="center_vertical|start"
                    android:layout_marginStart="8dp"
                    app:autoSizeTextType="uniform"
                    app:autoSizeMinTextSize="16sp"
                    app:autoSizeMaxTextSize="28sp"
                    app:autoSizeStepGranularity="1sp" />
            </LinearLayout>
        </androidx.cardview.widget.CardView>

'''

for row in cards_grid:
    xml += '        <LinearLayout android:layout_width="match_parent" android:layout_height="0dp" android:layout_weight="1" android:orientation="horizontal">\n'
    for cid, bg_color, icon, icon_tint, title in row:
        xml += f'''
            <androidx.cardview.widget.CardView
                android:id="@+id/{cid}"
                android:layout_width="0dp"
                android:layout_height="match_parent"
                android:layout_weight="1"
                android:layout_margin="4dp"
                app:cardCornerRadius="20dp"
                app:cardElevation="0dp"
                app:cardBackgroundColor="@color/{bg_color}">
                <LinearLayout
                    android:layout_width="match_parent"
                    android:layout_height="match_parent"
                    android:orientation="horizontal"
                    android:gravity="center_vertical"
                    android:padding="8dp">
                    <androidx.cardview.widget.CardView
                        android:layout_width="0dp"
                        android:layout_height="match_parent"
                        android:layout_weight="0.4"
                        app:cardCornerRadius="16dp"
                        app:cardElevation="0dp"
                        app:cardBackgroundColor="@color/{icon_tint}">
                        <ImageView
                            android:layout_width="24dp"
                            android:layout_height="24dp"
                            android:layout_gravity="center"
                            android:src="{icon}"
                            app:tint="@color/white" />
                    </androidx.cardview.widget.CardView>
                    <TextView
                        android:layout_width="0dp"
                        android:layout_height="match_parent"
                        android:layout_weight="0.6"
                        android:text="{title}"
                        android:textColor="@color/navy_text"
                        android:textStyle="bold"
                        android:gravity="center_vertical|center_horizontal"
                        android:layout_marginStart="4dp"
                        app:autoSizeTextType="uniform"
                        app:autoSizeMinTextSize="14sp"
                        app:autoSizeMaxTextSize="24sp"
                        app:autoSizeStepGranularity="1sp" />
                </LinearLayout>
            </androidx.cardview.widget.CardView>
'''
    xml += '        </LinearLayout>\n'

xml += '''
        <!-- AJUSTES -->
        <androidx.cardview.widget.CardView
            android:id="@+id/cardSettings"
            android:layout_width="match_parent"
            android:layout_height="0dp"
            android:layout_weight="1"
            android:layout_margin="4dp"
            app:cardCornerRadius="20dp"
            app:cardElevation="0dp"
            app:cardBackgroundColor="@color/settings_card">
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="match_parent"
                android:orientation="horizontal"
                android:gravity="center_vertical"
                android:padding="8dp">
                <androidx.cardview.widget.CardView
                    android:layout_width="0dp"
                    android:layout_height="match_parent"
                    android:layout_weight="0.2"
                    app:cardCornerRadius="16dp"
                    app:cardElevation="0dp"
                    app:cardBackgroundColor="@color/purple_icon">
                    <ImageView
                        android:layout_width="24dp"
                        android:layout_height="24dp"
                        android:layout_gravity="center"
                        android:src="@android:drawable/ic_menu_manage"
                        app:tint="@color/white" />
                </androidx.cardview.widget.CardView>
                <TextView
                    android:layout_width="0dp"
                    android:layout_height="match_parent"
                    android:layout_weight="0.8"
                    android:text="Ajustes de cuidador"
                    android:textColor="@color/navy_text"
                    android:textStyle="bold"
                    android:gravity="center_vertical|start"
                    android:layout_marginStart="12dp"
                    app:autoSizeTextType="uniform"
                    app:autoSizeMinTextSize="16sp"
                    app:autoSizeMaxTextSize="26sp"
                    app:autoSizeStepGranularity="1sp" />
            </LinearLayout>
        </androidx.cardview.widget.CardView>

        <!-- SALIR -->
        <androidx.cardview.widget.CardView
            android:id="@+id/cardLogout"
            android:layout_width="match_parent"
            android:layout_height="0dp"
            android:layout_weight="1"
            android:layout_margin="4dp"
            app:cardCornerRadius="20dp"
            app:cardElevation="0dp"
            app:cardBackgroundColor="@color/appts_card">
            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="match_parent"
                android:orientation="horizontal"
                android:gravity="center_vertical"
                android:padding="8dp">
                <androidx.cardview.widget.CardView
                    android:layout_width="0dp"
                    android:layout_height="match_parent"
                    android:layout_weight="0.2"
                    app:cardCornerRadius="16dp"
                    app:cardElevation="0dp"
                    app:cardBackgroundColor="@color/red_icon">
                    <ImageView
                        android:layout_width="24dp"
                        android:layout_height="24dp"
                        android:layout_gravity="center"
                        android:src="@android:drawable/ic_lock_lock"
                        app:tint="@color/white" />
                </androidx.cardview.widget.CardView>
                <TextView
                    android:layout_width="0dp"
                    android:layout_height="match_parent"
                    android:layout_weight="0.8"
                    android:text="Salir con clave"
                    android:textColor="@color/navy_text"
                    android:textStyle="bold"
                    android:gravity="center_vertical|start"
                    android:layout_marginStart="12dp"
                    app:autoSizeTextType="uniform"
                    app:autoSizeMinTextSize="16sp"
                    app:autoSizeMaxTextSize="26sp"
                    app:autoSizeStepGranularity="1sp" />
            </LinearLayout>
        </androidx.cardview.widget.CardView>

    </LinearLayout>

    <!-- Dummies -->
    <View android:id="@+id/cardFamily" android:layout_width="0dp" android:layout_height="0dp" android:visibility="gone" />
    <View android:id="@+id/cardMeds" android:layout_width="0dp" android:layout_height="0dp" android:visibility="gone" />
    <View android:id="@+id/cardAppts" android:layout_width="0dp" android:layout_height="0dp" android:visibility="gone" />
    <TextView android:id="@+id/tvDate" android:layout_width="0dp" android:layout_height="0dp" android:visibility="gone" />
    <TextView android:id="@+id/tvClock" android:layout_width="0dp" android:layout_height="0dp" android:visibility="gone" />
</LinearLayout>
'''

with open('app/src/main/res/layout/activity_main.xml', 'w', encoding='utf-8') as f:
    f.write(xml)
print("Zero scroll maximum size UI generated!")
