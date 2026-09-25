cards_grid = [
    ('cardCall', 'call_card', '@android:drawable/ic_menu_call', 'blue_icon', 'Llamar\npor teléfono', 'Realiza una\nllamada directa', 'blue_icon'),
    ('cardWhatsapp', 'whatsapp_card', '@drawable/ic_whatsapp', 'green_icon', 'Llamar\npor WhatsApp', 'Contacta fácilmente\npor WhatsApp', 'green_icon'),
    ('cardSos', 'sos_card', '@drawable/ic_sos_emergency', 'red_icon', 'Necesito\nayuda', 'Llamar o enviar aviso\na los servicios...', 'red_icon'),
    ('cardCamera', 'settings_card', '@android:drawable/ic_menu_camera', 'purple_icon', 'Acceder\na cámara', 'Toma una foto de tus\nanálisis o...', 'purple_icon'),
    ('cardGallery', 'meds_card', '@android:drawable/ic_menu_gallery', 'orange_icon', 'Galería', 'Selecciona una foto\no documento', 'orange_icon'),
    ('cardAdd', 'background_blue', '@android:drawable/ic_menu_add', 'secondary_text', 'Agregar\notra función', 'Personaliza tu inicio\ncon más opciones', 'secondary_text'),
]

xml = '''<?xml version="1.0" encoding="utf-8"?>
<ScrollView xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:fillViewport="true"
    android:background="#DDF3FF">

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
            android:layout_marginTop="32dp"
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
            android:textSize="22sp"
            android:textStyle="bold"
            android:layout_marginTop="16dp"
            android:layout_marginBottom="24dp" />

        <!-- 1. FULL WIDTH: MIVOR SALUD -->
        <androidx.cardview.widget.CardView
            android:id="@+id/cardMivor"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_margin="8dp"
            app:cardCornerRadius="24dp"
            app:cardElevation="0dp"
            app:cardBackgroundColor="@color/white">
            <androidx.constraintlayout.widget.ConstraintLayout
                android:layout_width="match_parent"
                android:layout_height="match_parent"
                android:padding="16dp">
                <ImageView android:id="@+id/imgMivor" android:layout_width="64dp" android:layout_height="64dp" android:src="@drawable/logo_mivor_real" android:scaleType="centerCrop" app:layout_constraintTop_toTopOf="parent" app:layout_constraintStart_toStartOf="parent" app:layout_constraintBottom_toBottomOf="parent"/>
                <TextView android:id="@+id/txtMivor" android:layout_width="0dp" android:layout_height="wrap_content" android:text="Acceder a\nMIVOR Salud" android:textColor="@color/navy_text" android:textSize="18sp" android:textStyle="bold" android:layout_marginStart="16dp" app:layout_constraintTop_toTopOf="parent" app:layout_constraintStart_toEndOf="@id/imgMivor" />
                <TextView android:layout_width="0dp" android:layout_height="wrap_content" android:text="Tu asistente de salud" android:textColor="@color/secondary_text" android:textSize="13sp" android:layout_marginTop="4dp" app:layout_constraintTop_toBottomOf="@id/txtMivor" app:layout_constraintStart_toStartOf="@id/txtMivor" />
                <androidx.cardview.widget.CardView android:layout_width="28dp" android:layout_height="28dp" app:cardCornerRadius="14dp" app:cardElevation="0dp" app:cardBackgroundColor="#EBF4FF" app:layout_constraintBottom_toBottomOf="parent" app:layout_constraintEnd_toEndOf="parent" app:layout_constraintTop_toTopOf="parent">
                    <TextView android:layout_width="match_parent" android:layout_height="match_parent" android:text=">" android:textColor="@color/blue_icon" android:textStyle="bold" android:gravity="center" android:textSize="16sp"/>
                </androidx.cardview.widget.CardView>
            </androidx.constraintlayout.widget.ConstraintLayout>
        </androidx.cardview.widget.CardView>

        <!-- 2x3 GRID -->
        <GridLayout
            android:id="@+id/gridLayout"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:columnCount="2"
            android:rowCount="3"
            android:useDefaultMargins="true">
'''

for cid, bg_color, icon, icon_tint, title, sub, arrow_tint in cards_grid:
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
                    
                    <androidx.cardview.widget.CardView
                        android:id="@+id/imgWrap_{cid}"
                        android:layout_width="48dp"
                        android:layout_height="48dp"
                        app:cardCornerRadius="24dp"
                        app:cardElevation="0dp"
                        app:cardBackgroundColor="@color/{icon_tint}"
                        app:layout_constraintTop_toTopOf="parent"
                        app:layout_constraintStart_toStartOf="parent">
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
                        android:textSize="13sp"
                        android:textStyle="bold"
                        android:layout_marginStart="12dp"
                        app:layout_constraintTop_toTopOf="@id/imgWrap_{cid}"
                        app:layout_constraintStart_toEndOf="@id/imgWrap_{cid}"
                        app:layout_constraintEnd_toEndOf="parent" />
                        
                    <TextView
                        android:id="@+id/sub_{cid}"
                        android:layout_width="0dp"
                        android:layout_height="wrap_content"
                        android:text="{sub}"
                        android:textColor="@color/secondary_text"
                        android:textSize="10sp"
                        android:layout_marginTop="4dp"
                        app:layout_constraintTop_toBottomOf="@id/txt_{cid}"
                        app:layout_constraintStart_toStartOf="@id/txt_{cid}"
                        app:layout_constraintEnd_toEndOf="parent" />
                        
                    <androidx.cardview.widget.CardView
                        android:layout_width="20dp"
                        android:layout_height="20dp"
                        app:cardCornerRadius="10dp"
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
                            android:textSize="12sp"/>
                    </androidx.cardview.widget.CardView>
                </androidx.constraintlayout.widget.ConstraintLayout>
            </androidx.cardview.widget.CardView>
'''

xml += '''
        </GridLayout>

        <!-- FULL WIDTH: AJUSTES -->
        <androidx.cardview.widget.CardView
            android:id="@+id/cardSettings"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_margin="8dp"
            app:cardCornerRadius="24dp"
            app:cardElevation="0dp"
            app:cardBackgroundColor="@color/settings_card">
            <androidx.constraintlayout.widget.ConstraintLayout
                android:layout_width="match_parent"
                android:layout_height="match_parent"
                android:padding="16dp">
                <androidx.cardview.widget.CardView android:id="@+id/imgSet" android:layout_width="48dp" android:layout_height="48dp" app:cardCornerRadius="24dp" app:cardElevation="0dp" app:cardBackgroundColor="@color/purple_icon" app:layout_constraintTop_toTopOf="parent" app:layout_constraintStart_toStartOf="parent" app:layout_constraintBottom_toBottomOf="parent">
                    <ImageView android:layout_width="28dp" android:layout_height="28dp" android:layout_gravity="center" android:src="@android:drawable/ic_menu_manage" app:tint="@color/white" />
                </androidx.cardview.widget.CardView>
                <TextView android:id="@+id/txtSet" android:layout_width="0dp" android:layout_height="wrap_content" android:text="Acceder a ajustes" android:textColor="@color/navy_text" android:textSize="16sp" android:textStyle="bold" android:layout_marginStart="16dp" app:layout_constraintTop_toTopOf="parent" app:layout_constraintStart_toEndOf="@id/imgSet" />
                <TextView android:layout_width="0dp" android:layout_height="wrap_content" android:text="Configura tu aplicación" android:textColor="@color/secondary_text" android:textSize="12sp" android:layout_marginTop="4dp" app:layout_constraintTop_toBottomOf="@id/txtSet" app:layout_constraintStart_toStartOf="@id/txtSet" />
                <androidx.cardview.widget.CardView android:layout_width="28dp" android:layout_height="28dp" app:cardCornerRadius="14dp" app:cardElevation="0dp" app:cardBackgroundColor="#1A000000" app:layout_constraintBottom_toBottomOf="parent" app:layout_constraintEnd_toEndOf="parent" app:layout_constraintTop_toTopOf="parent">
                    <TextView android:layout_width="match_parent" android:layout_height="match_parent" android:text=">" android:textColor="@color/purple_icon" android:textStyle="bold" android:gravity="center" android:textSize="16sp"/>
                </androidx.cardview.widget.CardView>
            </androidx.constraintlayout.widget.ConstraintLayout>
        </androidx.cardview.widget.CardView>

        <!-- FULL WIDTH: SALIR -->
        <androidx.cardview.widget.CardView
            android:id="@+id/cardLogout"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_margin="8dp"
            app:cardCornerRadius="24dp"
            app:cardElevation="0dp"
            app:cardBackgroundColor="@color/appts_card">
            <androidx.constraintlayout.widget.ConstraintLayout
                android:layout_width="match_parent"
                android:layout_height="match_parent"
                android:padding="16dp">
                <androidx.cardview.widget.CardView android:id="@+id/imgOut" android:layout_width="48dp" android:layout_height="48dp" app:cardCornerRadius="24dp" app:cardElevation="0dp" app:cardBackgroundColor="@color/red_icon" app:layout_constraintTop_toTopOf="parent" app:layout_constraintStart_toStartOf="parent" app:layout_constraintBottom_toBottomOf="parent">
                    <ImageView android:layout_width="28dp" android:layout_height="28dp" android:layout_gravity="center" android:src="@android:drawable/ic_lock_lock" app:tint="@color/white" />
                </androidx.cardview.widget.CardView>
                <TextView android:id="@+id/txtOut" android:layout_width="0dp" android:layout_height="wrap_content" android:text="Salir con clave" android:textColor="@color/navy_text" android:textSize="16sp" android:textStyle="bold" android:layout_marginStart="16dp" app:layout_constraintTop_toTopOf="parent" app:layout_constraintStart_toEndOf="@id/imgOut" />
                <TextView android:layout_width="0dp" android:layout_height="wrap_content" android:text="Cierra tu sesión de forma segura" android:textColor="@color/secondary_text" android:textSize="12sp" android:layout_marginTop="4dp" app:layout_constraintTop_toBottomOf="@id/txtOut" app:layout_constraintStart_toStartOf="@id/txtOut" />
                <androidx.cardview.widget.CardView android:layout_width="28dp" android:layout_height="28dp" app:cardCornerRadius="14dp" app:cardElevation="0dp" app:cardBackgroundColor="#1A000000" app:layout_constraintBottom_toBottomOf="parent" app:layout_constraintEnd_toEndOf="parent" app:layout_constraintTop_toTopOf="parent">
                    <TextView android:layout_width="match_parent" android:layout_height="match_parent" android:text=">" android:textColor="@color/red_icon" android:textStyle="bold" android:gravity="center" android:textSize="16sp"/>
                </androidx.cardview.widget.CardView>
            </androidx.constraintlayout.widget.ConstraintLayout>
        </androidx.cardview.widget.CardView>

        <!-- Dummies -->
        <View android:id="@+id/cardFamily" android:layout_width="0dp" android:layout_height="0dp" android:visibility="gone" />
        <View android:id="@+id/cardMeds" android:layout_width="0dp" android:layout_height="0dp" android:visibility="gone" />
        <View android:id="@+id/cardAppts" android:layout_width="0dp" android:layout_height="0dp" android:visibility="gone" />
        <TextView android:id="@+id/tvDate" android:layout_width="0dp" android:layout_height="0dp" android:visibility="gone" />
        <TextView android:id="@+id/tvClock" android:layout_width="0dp" android:layout_height="0dp" android:visibility="gone" />
    </LinearLayout>
</ScrollView>
'''

with open('app/src/main/res/layout/activity_main.xml', 'w', encoding='utf-8') as f:
    f.write(xml)
print("UI written perfectly for new image!")
