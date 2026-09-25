cards = [
    ('cardMivor', 'mivor_card', '@drawable/logo_mivor_real', 'blue_icon', 'Acceder a\nMIVOR Salud', 'Tu asistente de salud', 'blue_icon'),
    ('cardFamily', 'family_card', '@android:drawable/ic_menu_myplaces', 'green_icon', 'Familia\ny amigos', 'Conecta con familiares', 'green_icon'),
    ('cardSettings', 'settings_card', '@android:drawable/ic_menu_manage', 'purple_icon', 'Ajuste de\ncuidador', 'Gestiona el acceso', 'purple_icon'),
    ('cardSos', 'sos_card', '@drawable/ic_sos_emergency', 'red_icon', 'Necesito\nayuda', 'Llamar a emergencias', 'red_icon'),
    ('cardCall', 'call_card', '@android:drawable/ic_menu_call', 'blue_icon', 'Llamar por\nteléfono', 'Llamada directa', 'blue_icon'),
    ('cardWhatsapp', 'whatsapp_card', '@drawable/ic_whatsapp', 'green_icon', 'Llamar por\nWhatsApp', 'Mensaje rápido', 'green_icon'),
    ('cardMeds', 'meds_card', '@android:drawable/ic_menu_sort_by_size', 'orange_icon', 'Mis\nmedicamentos', 'Horarios y avisos', 'orange_icon'),
    ('cardAppts', 'appts_card', '@android:drawable/ic_menu_today', 'pink_icon', 'Mis citas\nmédicas', 'Próximas visitas', 'pink_icon'),
]

xml = '''<?xml version="1.0" encoding="utf-8"?>
<ScrollView xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:fillViewport="true"
    android:background="@color/background_blue">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:padding="16dp"
        android:gravity="center_horizontal">

        <!-- MIC BUTTON -->
        <androidx.cardview.widget.CardView
            android:id="@+id/pillVoice"
            android:layout_width="160dp"
            android:layout_height="160dp"
            android:layout_marginTop="40dp"
            app:cardCornerRadius="80dp"
            app:cardElevation="0dp"
            app:cardBackgroundColor="@color/blue_icon">
            
            <ImageView
                android:layout_width="64dp"
                android:layout_height="64dp"
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
            android:textSize="24sp"
            android:textStyle="bold"
            android:layout_marginTop="24dp"
            android:layout_marginBottom="32dp" />

        <GridLayout
            android:id="@+id/gridLayout"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:columnCount="2"
            android:rowCount="4"
            android:useDefaultMargins="true">
'''

for cid, bg_color, icon, icon_tint, title, sub, arrow_tint in cards:
    tint_attr = f'app:tint="@color/{icon_tint}"' if 'logo_mivor' not in icon else ''
    scale_type = 'centerCrop' if 'logo_mivor' in icon else 'fitCenter'
    
    xml += f'''
            <androidx.cardview.widget.CardView
                android:id="@+id/{cid}"
                android:layout_width="0dp"
                android:layout_height="wrap_content"
                android:layout_columnWeight="1"
                android:layout_rowWeight="1"
                android:layout_margin="8dp"
                app:cardCornerRadius="24dp"
                app:cardElevation="0dp"
                app:cardBackgroundColor="@color/{bg_color}">
                
                <androidx.constraintlayout.widget.ConstraintLayout
                    android:layout_width="match_parent"
                    android:layout_height="match_parent"
                    android:padding="16dp">
                    
                    <ImageView
                        android:id="@+id/img_{cid}"
                        android:layout_width="48dp"
                        android:layout_height="48dp"
                        android:src="{icon}"
                        android:scaleType="{scale_type}"
                        {tint_attr}
                        app:layout_constraintTop_toTopOf="parent"
                        app:layout_constraintStart_toStartOf="parent" />
                        
                    <TextView
                        android:id="@+id/txt_{cid}"
                        android:layout_width="0dp"
                        android:layout_height="wrap_content"
                        android:text="{title}"
                        android:textColor="@color/navy_text"
                        android:textSize="15sp"
                        android:textStyle="bold"
                        android:layout_marginStart="12dp"
                        app:layout_constraintTop_toTopOf="@id/img_{cid}"
                        app:layout_constraintStart_toEndOf="@id/img_{cid}"
                        app:layout_constraintEnd_toEndOf="parent" />
                        
                    <TextView
                        android:id="@+id/sub_{cid}"
                        android:layout_width="0dp"
                        android:layout_height="wrap_content"
                        android:text="{sub}"
                        android:textColor="@color/secondary_text"
                        android:textSize="11sp"
                        android:layout_marginTop="4dp"
                        app:layout_constraintTop_toBottomOf="@id/txt_{cid}"
                        app:layout_constraintStart_toStartOf="@id/txt_{cid}"
                        app:layout_constraintEnd_toEndOf="parent" />
                        
                    <androidx.cardview.widget.CardView
                        android:layout_width="24dp"
                        android:layout_height="24dp"
                        app:cardCornerRadius="12dp"
                        app:cardElevation="0dp"
                        app:cardBackgroundColor="#1A000000"
                        android:layout_marginTop="16dp"
                        app:layout_constraintBottom_toBottomOf="parent"
                        app:layout_constraintEnd_toEndOf="parent"
                        app:layout_constraintTop_toBottomOf="@id/sub_{cid}"
                        app:layout_constraintVertical_bias="1.0">
                        <TextView
                            android:layout_width="match_parent"
                            android:layout_height="match_parent"
                            android:text=">"
                            android:textColor="@color/{arrow_tint}"
                            android:textStyle="bold"
                            android:gravity="center"
                            android:textSize="14sp"/>
                    </androidx.cardview.widget.CardView>
                </androidx.constraintlayout.widget.ConstraintLayout>
            </androidx.cardview.widget.CardView>
'''

xml += '''
        </GridLayout>
        
        <!-- Dummies -->
        <View android:id="@+id/cardPhotos" android:layout_width="0dp" android:layout_height="0dp" android:visibility="gone" />
        <TextView android:id="@+id/tvDate" android:layout_width="0dp" android:layout_height="0dp" android:visibility="gone" />
        <TextView android:id="@+id/tvClock" android:layout_width="0dp" android:layout_height="0dp" android:visibility="gone" />
    </LinearLayout>
</ScrollView>
'''

with open('app/src/main/res/layout/activity_main.xml', 'w', encoding='utf-8') as f:
    f.write(xml)
print("UI written perfectly!")
