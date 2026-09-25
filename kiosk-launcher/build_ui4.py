cards_grid = [
    [
        ('cardCall', 'call_card', '@android:drawable/ic_menu_call', 'blue_icon', 'Llamar\npor teléfono', 'Realiza una\nllamada directa', 'blue_icon'),
        ('cardWhatsapp', 'whatsapp_card', '@drawable/ic_whatsapp', 'green_icon', 'Llamar\npor WhatsApp', 'Contacta fácilmente\npor WhatsApp', 'green_icon')
    ],
    [
        ('cardSos', 'sos_card', '@drawable/ic_sos_emergency', 'red_icon', 'Necesito\nayuda', 'Llamar a los\nservicios...', 'red_icon'),
        ('cardCamera', 'settings_card', '@android:drawable/ic_menu_camera', 'purple_icon', 'Acceder\na cámara', 'Toma una foto de\ntus análisis...', 'purple_icon')
    ],
    [
        ('cardGallery', 'meds_card', '@android:drawable/ic_menu_gallery', 'orange_icon', 'Galería', 'Selecciona una foto\no documento', 'orange_icon'),
        ('cardAdd', 'background_blue', '@android:drawable/ic_menu_add', 'secondary_text', 'Agregar\notra función', 'Personaliza tu inicio\ncon opciones', 'secondary_text')
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

    <!-- MIC BUTTON -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:gravity="center"
        android:layout_marginBottom="4dp"
        android:layout_marginTop="8dp">
        <androidx.cardview.widget.CardView
            android:id="@+id/pillVoice"
            android:layout_width="100dp"
            android:layout_height="100dp"
            app:cardCornerRadius="50dp"
            app:cardElevation="0dp"
            app:cardBackgroundColor="@color/blue_icon">
            <ImageView
                android:layout_width="48dp"
                android:layout_height="48dp"
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
            android:textSize="22sp"
            android:textStyle="bold"
            android:layout_marginTop="8dp" />
    </LinearLayout>

    <!-- WEIGHTED CONTAINER FOR CARDS (ZERO SCROLL) -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:orientation="vertical">

        <!-- 1. FULL WIDTH: MIVOR SALUD -->
        <androidx.cardview.widget.CardView
            android:id="@+id/cardMivor"
            android:layout_width="match_parent"
            android:layout_height="0dp"
            android:layout_weight="1.2"
            android:layout_margin="4dp"
            app:cardCornerRadius="24dp"
            app:cardElevation="0dp"
            app:cardBackgroundColor="@color/white">
            <androidx.constraintlayout.widget.ConstraintLayout
                android:layout_width="match_parent"
                android:layout_height="match_parent"
                android:padding="16dp">
                
                <!-- Center the icon vertically -->
                <ImageView android:id="@+id/imgMivor" android:layout_width="72dp" android:layout_height="72dp" android:src="@drawable/logo_mivor_real" android:scaleType="centerCrop" app:layout_constraintTop_toTopOf="parent" app:layout_constraintStart_toStartOf="parent" app:layout_constraintBottom_toBottomOf="parent"/>
                
                <!-- Center the texts vertically -->
                <TextView android:id="@+id/txtMivor" android:layout_width="0dp" android:layout_height="wrap_content" android:text="Acceder a MIVOR Salud" android:textColor="@color/navy_text" android:textSize="22sp" android:textStyle="bold" android:layout_marginStart="16dp" app:layout_constraintBottom_toTopOf="@id/subMivor" app:layout_constraintStart_toEndOf="@id/imgMivor" app:layout_constraintEnd_toStartOf="@id/arrowMivor" app:layout_constraintVertical_chainStyle="packed" app:layout_constraintTop_toTopOf="parent"/>
                <TextView android:id="@+id/subMivor" android:layout_width="0dp" android:layout_height="wrap_content" android:text="Tu asistente de salud" android:textColor="@color/secondary_text" android:textSize="16sp" android:layout_marginTop="4dp" app:layout_constraintTop_toBottomOf="@id/txtMivor" app:layout_constraintStart_toStartOf="@id/txtMivor" app:layout_constraintEnd_toStartOf="@id/arrowMivor" app:layout_constraintBottom_toBottomOf="parent" />
                
                <!-- Arrow -->
                <androidx.cardview.widget.CardView android:id="@+id/arrowMivor" android:layout_width="32dp" android:layout_height="32dp" app:cardCornerRadius="16dp" app:cardElevation="0dp" app:cardBackgroundColor="#EBF4FF" app:layout_constraintBottom_toBottomOf="parent" app:layout_constraintEnd_toEndOf="parent" app:layout_constraintTop_toTopOf="parent">
                    <TextView android:layout_width="match_parent" android:layout_height="match_parent" android:text=">" android:textColor="@color/blue_icon" android:textStyle="bold" android:gravity="center" android:textSize="18sp"/>
                </androidx.cardview.widget.CardView>
            </androidx.constraintlayout.widget.ConstraintLayout>
        </androidx.cardview.widget.CardView>

'''

for row in cards_grid:
    xml += '        <LinearLayout android:layout_width="match_parent" android:layout_height="0dp" android:layout_weight="1.1" android:orientation="horizontal">\n'
    for cid, bg_color, icon, icon_tint, title, sub, arrow_tint in row:
        xml += f'''
            <androidx.cardview.widget.CardView
                android:id="@+id/{cid}"
                android:layout_width="0dp"
                android:layout_height="match_parent"
                android:layout_weight="1"
                android:layout_margin="4dp"
                app:cardCornerRadius="24dp"
                app:cardElevation="0dp"
                app:cardBackgroundColor="@color/{bg_color}">
                
                <androidx.constraintlayout.widget.ConstraintLayout
                    android:layout_width="match_parent"
                    android:layout_height="match_parent"
                    android:padding="12dp">
                    
                    <androidx.cardview.widget.CardView
                        android:id="@+id/imgWrap_{cid}"
                        android:layout_width="48dp"
                        android:layout_height="48dp"
                        app:cardCornerRadius="24dp"
                        app:cardElevation="0dp"
                        app:cardBackgroundColor="@color/{icon_tint}"
                        app:layout_constraintTop_toTopOf="parent"
                        app:layout_constraintBottom_toBottomOf="parent"
                        app:layout_constraintStart_toStartOf="parent"
                        app:layout_constraintVertical_bias="0.4">
                        <ImageView
                            android:layout_width="28dp"
                            android:layout_height="28dp"
                            android:layout_gravity="center"
                            android:src="{icon}"
                            app:tint="@color/white" />
                    </androidx.cardview.widget.CardView>
                        
                    <TextView
                        android:id="@+id/txt_{cid}"
                        android:layout_width="0dp"
                        android:layout_height="wrap_content"
                        android:text="{title}"
                        android:textColor="@color/navy_text"
                        android:textSize="17sp"
                        android:textStyle="bold"
                        android:layout_marginStart="10dp"
                        app:layout_constraintTop_toTopOf="parent"
                        app:layout_constraintBottom_toTopOf="@id/sub_{cid}"
                        app:layout_constraintVertical_chainStyle="packed"
                        app:layout_constraintStart_toEndOf="@id/imgWrap_{cid}"
                        app:layout_constraintEnd_toEndOf="parent" />
                        
                    <TextView
                        android:id="@+id/sub_{cid}"
                        android:layout_width="0dp"
                        android:layout_height="wrap_content"
                        android:text="{sub}"
                        android:textColor="@color/secondary_text"
                        android:textSize="12sp"
                        android:layout_marginTop="2dp"
                        app:layout_constraintTop_toBottomOf="@id/txt_{cid}"
                        app:layout_constraintStart_toStartOf="@id/txt_{cid}"
                        app:layout_constraintEnd_toEndOf="parent"
                        app:layout_constraintBottom_toBottomOf="parent" />
                        
                    <androidx.cardview.widget.CardView
                        android:layout_width="24dp"
                        android:layout_height="24dp"
                        app:cardCornerRadius="12dp"
                        app:cardElevation="0dp"
                        app:cardBackgroundColor="#1A000000"
                        app:layout_constraintBottom_toBottomOf="parent"
                        app:layout_constraintEnd_toEndOf="parent">
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
    xml += '        </LinearLayout>\n'

xml += '''
        <!-- FULL WIDTH: AJUSTES -->
        <androidx.cardview.widget.CardView
            android:id="@+id/cardSettings"
            android:layout_width="match_parent"
            android:layout_height="0dp"
            android:layout_weight="1"
            android:layout_margin="4dp"
            app:cardCornerRadius="24dp"
            app:cardElevation="0dp"
            app:cardBackgroundColor="@color/settings_card">
            <androidx.constraintlayout.widget.ConstraintLayout
                android:layout_width="match_parent"
                android:layout_height="match_parent"
                android:padding="16dp">
                
                <androidx.cardview.widget.CardView android:id="@+id/imgSet" android:layout_width="52dp" android:layout_height="52dp" app:cardCornerRadius="26dp" app:cardElevation="0dp" app:cardBackgroundColor="@color/purple_icon" app:layout_constraintTop_toTopOf="parent" app:layout_constraintStart_toStartOf="parent" app:layout_constraintBottom_toBottomOf="parent">
                    <ImageView android:layout_width="28dp" android:layout_height="28dp" android:layout_gravity="center" android:src="@android:drawable/ic_menu_manage" app:tint="@color/white" />
                </androidx.cardview.widget.CardView>
                
                <TextView android:id="@+id/txtSet" android:layout_width="0dp" android:layout_height="wrap_content" android:text="Acceder a ajustes" android:textColor="@color/navy_text" android:textSize="20sp" android:textStyle="bold" android:layout_marginStart="16dp" app:layout_constraintBottom_toTopOf="@id/subSet" app:layout_constraintStart_toEndOf="@id/imgSet" app:layout_constraintEnd_toStartOf="@id/arrowSet" app:layout_constraintVertical_chainStyle="packed" app:layout_constraintTop_toTopOf="parent" />
                <TextView android:id="@+id/subSet" android:layout_width="0dp" android:layout_height="wrap_content" android:text="Configura tu aplicación" android:textColor="@color/secondary_text" android:textSize="14sp" android:layout_marginTop="2dp" app:layout_constraintTop_toBottomOf="@id/txtSet" app:layout_constraintStart_toStartOf="@id/txtSet" app:layout_constraintEnd_toStartOf="@id/arrowSet" app:layout_constraintBottom_toBottomOf="parent" />
                
                <androidx.cardview.widget.CardView android:id="@+id/arrowSet" android:layout_width="32dp" android:layout_height="32dp" app:cardCornerRadius="16dp" app:cardElevation="0dp" app:cardBackgroundColor="#1A000000" app:layout_constraintBottom_toBottomOf="parent" app:layout_constraintEnd_toEndOf="parent" app:layout_constraintTop_toTopOf="parent">
                    <TextView android:layout_width="match_parent" android:layout_height="match_parent" android:text=">" android:textColor="@color/purple_icon" android:textStyle="bold" android:gravity="center" android:textSize="18sp"/>
                </androidx.cardview.widget.CardView>
            </androidx.constraintlayout.widget.ConstraintLayout>
        </androidx.cardview.widget.CardView>

        <!-- FULL WIDTH: SALIR -->
        <androidx.cardview.widget.CardView
            android:id="@+id/cardLogout"
            android:layout_width="match_parent"
            android:layout_height="0dp"
            android:layout_weight="1"
            android:layout_margin="4dp"
            app:cardCornerRadius="24dp"
            app:cardElevation="0dp"
            app:cardBackgroundColor="@color/appts_card">
            <androidx.constraintlayout.widget.ConstraintLayout
                android:layout_width="match_parent"
                android:layout_height="match_parent"
                android:padding="16dp">
                
                <androidx.cardview.widget.CardView android:id="@+id/imgOut" android:layout_width="52dp" android:layout_height="52dp" app:cardCornerRadius="26dp" app:cardElevation="0dp" app:cardBackgroundColor="@color/red_icon" app:layout_constraintTop_toTopOf="parent" app:layout_constraintStart_toStartOf="parent" app:layout_constraintBottom_toBottomOf="parent">
                    <ImageView android:layout_width="28dp" android:layout_height="28dp" android:layout_gravity="center" android:src="@android:drawable/ic_lock_lock" app:tint="@color/white" />
                </androidx.cardview.widget.CardView>
                
                <TextView android:id="@+id/txtOut" android:layout_width="0dp" android:layout_height="wrap_content" android:text="Salir con clave" android:textColor="@color/navy_text" android:textSize="20sp" android:textStyle="bold" android:layout_marginStart="16dp" app:layout_constraintBottom_toTopOf="@id/subOut" app:layout_constraintStart_toEndOf="@id/imgOut" app:layout_constraintEnd_toStartOf="@id/arrowOut" app:layout_constraintVertical_chainStyle="packed" app:layout_constraintTop_toTopOf="parent" />
                <TextView android:id="@+id/subOut" android:layout_width="0dp" android:layout_height="wrap_content" android:text="Cierra tu sesión de forma segura" android:textColor="@color/secondary_text" android:textSize="14sp" android:layout_marginTop="2dp" app:layout_constraintTop_toBottomOf="@id/txtOut" app:layout_constraintStart_toStartOf="@id/txtOut" app:layout_constraintEnd_toStartOf="@id/arrowOut" app:layout_constraintBottom_toBottomOf="parent" />
                
                <androidx.cardview.widget.CardView android:id="@+id/arrowOut" android:layout_width="32dp" android:layout_height="32dp" app:cardCornerRadius="16dp" app:cardElevation="0dp" app:cardBackgroundColor="#1A000000" app:layout_constraintBottom_toBottomOf="parent" app:layout_constraintEnd_toEndOf="parent" app:layout_constraintTop_toTopOf="parent">
                    <TextView android:layout_width="match_parent" android:layout_height="match_parent" android:text=">" android:textColor="@color/red_icon" android:textStyle="bold" android:gravity="center" android:textSize="18sp"/>
                </androidx.cardview.widget.CardView>
            </androidx.constraintlayout.widget.ConstraintLayout>
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
print("Massive fonts with centered alignment generated!")
