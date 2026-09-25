cards_grid = [
    [
        ('cardCall', '#FFFFFF', '@android:drawable/ic_menu_call', '#DBEAFE', '#2563EB', 'Llamar\npor teléfono', 'Llamada directa'),
        ('cardWhatsapp', '#FFFFFF', '@drawable/ic_whatsapp', '#DCFCE7', '#16A34A', 'WhatsApp', 'Mensaje rápido')
    ],
    [
        ('cardSos', '#FFFFFF', '@drawable/ic_sos_emergency', '#FEE2E2', '#EF4444', 'Necesito\nayuda', 'Servicios médicos'),
        ('cardCamera', '#FFFFFF', '@android:drawable/ic_menu_camera', '#F3E8FF', '#9333EA', 'Cámara', 'Toma fotos')
    ],
    [
        ('cardGallery', '#FFFFFF', '@android:drawable/ic_menu_gallery', '#FFEDD5', '#EA580C', 'Galería', 'Ver documentos'),
        ('cardAdd', '#FFFFFF', '@android:drawable/ic_menu_add', '#F1F5F9', '#64748B', 'Agregar\nfunción', 'Personalizar')
    ]
]

xml = '''<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="12dp"
    android:background="#F4F9FF"> <!-- Soft sophisticated background -->

    <!-- MIC BUTTON (Elegant, with depth) -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:gravity="center"
        android:layout_marginBottom="4dp"
        android:layout_marginTop="6dp">
        <androidx.cardview.widget.CardView
            android:id="@+id/pillVoice"
            android:layout_width="96dp"
            android:layout_height="96dp"
            app:cardCornerRadius="48dp"
            app:cardElevation="4dp" 
            app:cardBackgroundColor="#2563EB"> <!-- Premium Blue -->
            <ImageView
                android:layout_width="44dp"
                android:layout_height="44dp"
                android:layout_gravity="center"
                android:src="@android:drawable/ic_btn_speak_now"
                app:tint="#FFFFFF" />
        </androidx.cardview.widget.CardView>
        <TextView
            android:id="@+id/tvVoiceStatus"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="Toca para hablar"
            android:fontFamily="sans-serif-medium"
            android:textColor="#0F172A"
            android:textSize="20sp"
            android:layout_marginTop="6dp" /> <!-- Reduced space -->
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
            android:layout_margin="6dp"
            app:cardCornerRadius="20dp"
            app:cardElevation="2dp"
            app:cardBackgroundColor="#FFFFFF">
            <androidx.constraintlayout.widget.ConstraintLayout
                android:layout_width="match_parent"
                android:layout_height="match_parent"
                android:padding="16dp">
                
                <!-- Slightly smaller logo -->
                <ImageView android:id="@+id/imgMivor" android:layout_width="52dp" android:layout_height="52dp" android:src="@drawable/logo_mivor_real" android:scaleType="centerCrop" app:layout_constraintTop_toTopOf="parent" app:layout_constraintStart_toStartOf="parent" app:layout_constraintBottom_toBottomOf="parent"/>
                
                <TextView android:id="@+id/txtMivor" android:layout_width="0dp" android:layout_height="wrap_content" android:text="Acceder a MIVOR Salud" android:fontFamily="sans-serif-medium" android:textColor="#0F172A" android:textSize="20sp" android:layout_marginStart="16dp" app:layout_constraintBottom_toTopOf="@id/subMivor" app:layout_constraintStart_toEndOf="@id/imgMivor" app:layout_constraintEnd_toStartOf="@id/arrowMivor" app:layout_constraintVertical_chainStyle="packed" app:layout_constraintTop_toTopOf="parent"/>
                <!-- Higher contrast subtitle -->
                <TextView android:id="@+id/subMivor" android:layout_width="0dp" android:layout_height="wrap_content" android:text="Tu asistente de salud" android:fontFamily="sans-serif" android:textColor="#475569" android:textSize="14sp" android:layout_marginTop="2dp" app:layout_constraintTop_toBottomOf="@id/txtMivor" app:layout_constraintStart_toStartOf="@id/txtMivor" app:layout_constraintEnd_toStartOf="@id/arrowMivor" app:layout_constraintBottom_toBottomOf="parent" />
                
                <!-- Larger arrow -->
                <androidx.cardview.widget.CardView android:id="@+id/arrowMivor" android:layout_width="32dp" android:layout_height="32dp" app:cardCornerRadius="16dp" app:cardElevation="0dp" app:cardBackgroundColor="#F1F5F9" app:layout_constraintBottom_toBottomOf="parent" app:layout_constraintEnd_toEndOf="parent" app:layout_constraintTop_toTopOf="parent">
                    <TextView android:layout_width="match_parent" android:layout_height="match_parent" android:text=">" android:textColor="#94A3B8" android:fontFamily="sans-serif-medium" android:gravity="center" android:textSize="16sp"/>
                </androidx.cardview.widget.CardView>
            </androidx.constraintlayout.widget.ConstraintLayout>
        </androidx.cardview.widget.CardView>

'''

for row in cards_grid:
    xml += '        <LinearLayout android:layout_width="match_parent" android:layout_height="0dp" android:layout_weight="1.1" android:orientation="horizontal">\n'
    for cid, bg_color, icon, icon_bg, icon_tint, title, sub in row:
        xml += f'''
            <androidx.cardview.widget.CardView
                android:id="@+id/{cid}"
                android:layout_width="0dp"
                android:layout_height="match_parent"
                android:layout_weight="1"
                android:layout_margin="6dp"
                app:cardCornerRadius="20dp"
                app:cardElevation="2dp"
                app:cardBackgroundColor="{bg_color}">
                
                <androidx.constraintlayout.widget.ConstraintLayout
                    android:layout_width="match_parent"
                    android:layout_height="match_parent"
                    android:padding="12dp">
                    
                    <androidx.cardview.widget.CardView
                        android:id="@+id/imgWrap_{cid}"
                        android:layout_width="44dp"
                        android:layout_height="44dp"
                        app:cardCornerRadius="22dp"
                        app:cardElevation="0dp"
                        app:cardBackgroundColor="{icon_bg}"
                        app:layout_constraintTop_toTopOf="parent"
                        app:layout_constraintBottom_toBottomOf="parent"
                        app:layout_constraintStart_toStartOf="parent">
                        <ImageView
                            android:layout_width="24dp"
                            android:layout_height="24dp"
                            android:layout_gravity="center"
                            android:src="{icon}"
                            app:tint="{icon_tint}" />
                    </androidx.cardview.widget.CardView>
                        
                    <TextView
                        android:id="@+id/txt_{cid}"
                        android:layout_width="0dp"
                        android:layout_height="wrap_content"
                        android:text="{title}"
                        android:fontFamily="sans-serif-medium"
                        android:textColor="#0F172A"
                        android:textSize="16sp"
                        android:layout_marginStart="10dp"
                        android:layout_marginEnd="6dp"
                        app:layout_constraintTop_toTopOf="parent"
                        app:layout_constraintBottom_toTopOf="@id/sub_{cid}"
                        app:layout_constraintVertical_chainStyle="packed"
                        app:layout_constraintStart_toEndOf="@id/imgWrap_{cid}"
                        app:layout_constraintEnd_toStartOf="@id/arrow_{cid}" />
                        
                    <TextView
                        android:id="@+id/sub_{cid}"
                        android:layout_width="0dp"
                        android:layout_height="wrap_content"
                        android:text="{sub}"
                        android:fontFamily="sans-serif"
                        android:textColor="#475569" 
                        android:textSize="11sp"
                        android:layout_marginTop="2dp"
                        android:layout_marginEnd="6dp"
                        app:layout_constraintTop_toBottomOf="@id/txt_{cid}"
                        app:layout_constraintStart_toStartOf="@id/txt_{cid}"
                        app:layout_constraintEnd_toStartOf="@id/arrow_{cid}"
                        app:layout_constraintBottom_toBottomOf="parent" />
                        
                    <!-- Larger navigation arrows -->
                    <androidx.cardview.widget.CardView
                        android:id="@+id/arrow_{cid}"
                        android:layout_width="28dp"
                        android:layout_height="28dp"
                        app:cardCornerRadius="14dp"
                        app:cardElevation="0dp"
                        app:cardBackgroundColor="#F1F5F9"
                        app:layout_constraintTop_toTopOf="parent"
                        app:layout_constraintBottom_toBottomOf="parent"
                        app:layout_constraintEnd_toEndOf="parent">
                        <TextView
                            android:layout_width="match_parent"
                            android:layout_height="match_parent"
                            android:text=">"
                            android:textColor="#94A3B8"
                            android:fontFamily="sans-serif-medium"
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
            android:layout_margin="6dp"
            app:cardCornerRadius="20dp"
            app:cardElevation="2dp"
            app:cardBackgroundColor="#FFFFFF">
            <androidx.constraintlayout.widget.ConstraintLayout
                android:layout_width="match_parent"
                android:layout_height="match_parent"
                android:padding="16dp">
                
                <androidx.cardview.widget.CardView android:id="@+id/imgSet" android:layout_width="48dp" android:layout_height="48dp" app:cardCornerRadius="24dp" app:cardElevation="0dp" app:cardBackgroundColor="#F3E8FF" app:layout_constraintTop_toTopOf="parent" app:layout_constraintStart_toStartOf="parent" app:layout_constraintBottom_toBottomOf="parent">
                    <ImageView android:layout_width="24dp" android:layout_height="24dp" android:layout_gravity="center" android:src="@android:drawable/ic_menu_manage" app:tint="#9333EA" />
                </androidx.cardview.widget.CardView>
                
                <TextView android:id="@+id/txtSet" android:layout_width="0dp" android:layout_height="wrap_content" android:text="Acceder a ajustes" android:fontFamily="sans-serif-medium" android:textColor="#0F172A" android:textSize="18sp" android:layout_marginStart="16dp" app:layout_constraintBottom_toTopOf="@id/subSet" app:layout_constraintStart_toEndOf="@id/imgSet" app:layout_constraintEnd_toStartOf="@id/arrowSet" app:layout_constraintVertical_chainStyle="packed" app:layout_constraintTop_toTopOf="parent" />
                <TextView android:id="@+id/subSet" android:layout_width="0dp" android:layout_height="wrap_content" android:text="Configura tu aplicación" android:fontFamily="sans-serif" android:textColor="#475569" android:textSize="14sp" android:layout_marginTop="2dp" app:layout_constraintTop_toBottomOf="@id/txtSet" app:layout_constraintStart_toStartOf="@id/txtSet" app:layout_constraintEnd_toStartOf="@id/arrowSet" app:layout_constraintBottom_toBottomOf="parent" />
                
                <androidx.cardview.widget.CardView android:id="@+id/arrowSet" android:layout_width="32dp" android:layout_height="32dp" app:cardCornerRadius="16dp" app:cardElevation="0dp" app:cardBackgroundColor="#F1F5F9" app:layout_constraintBottom_toBottomOf="parent" app:layout_constraintEnd_toEndOf="parent" app:layout_constraintTop_toTopOf="parent">
                    <TextView android:layout_width="match_parent" android:layout_height="match_parent" android:text=">" android:textColor="#94A3B8" android:fontFamily="sans-serif-medium" android:gravity="center" android:textSize="16sp"/>
                </androidx.cardview.widget.CardView>
            </androidx.constraintlayout.widget.ConstraintLayout>
        </androidx.cardview.widget.CardView>

        <!-- FULL WIDTH: SALIR -->
        <androidx.cardview.widget.CardView
            android:id="@+id/cardLogout"
            android:layout_width="match_parent"
            android:layout_height="0dp"
            android:layout_weight="1"
            android:layout_margin="6dp"
            app:cardCornerRadius="20dp"
            app:cardElevation="2dp"
            app:cardBackgroundColor="#FFFFFF">
            <androidx.constraintlayout.widget.ConstraintLayout
                android:layout_width="match_parent"
                android:layout_height="match_parent"
                android:padding="16dp">
                
                <!-- Softer Coral/Red for Logout -->
                <androidx.cardview.widget.CardView android:id="@+id/imgOut" android:layout_width="48dp" android:layout_height="48dp" app:cardCornerRadius="24dp" app:cardElevation="0dp" app:cardBackgroundColor="#FEE2E2" app:layout_constraintTop_toTopOf="parent" app:layout_constraintStart_toStartOf="parent" app:layout_constraintBottom_toBottomOf="parent">
                    <ImageView android:layout_width="24dp" android:layout_height="24dp" android:layout_gravity="center" android:src="@android:drawable/ic_lock_lock" app:tint="#EF4444" />
                </androidx.cardview.widget.CardView>
                
                <TextView android:id="@+id/txtOut" android:layout_width="0dp" android:layout_height="wrap_content" android:text="Salir con clave" android:fontFamily="sans-serif-medium" android:textColor="#0F172A" android:textSize="18sp" android:layout_marginStart="16dp" app:layout_constraintBottom_toTopOf="@id/subOut" app:layout_constraintStart_toEndOf="@id/imgOut" app:layout_constraintEnd_toStartOf="@id/arrowOut" app:layout_constraintVertical_chainStyle="packed" app:layout_constraintTop_toTopOf="parent" />
                <TextView android:id="@+id/subOut" android:layout_width="0dp" android:layout_height="wrap_content" android:text="Cierra tu sesión de forma segura" android:fontFamily="sans-serif" android:textColor="#475569" android:textSize="14sp" android:layout_marginTop="2dp" app:layout_constraintTop_toBottomOf="@id/txtOut" app:layout_constraintStart_toStartOf="@id/txtOut" app:layout_constraintEnd_toStartOf="@id/arrowOut" app:layout_constraintBottom_toBottomOf="parent" />
                
                <androidx.cardview.widget.CardView android:id="@+id/arrowOut" android:layout_width="32dp" android:layout_height="32dp" app:cardCornerRadius="16dp" app:cardElevation="0dp" app:cardBackgroundColor="#F1F5F9" app:layout_constraintBottom_toBottomOf="parent" app:layout_constraintEnd_toEndOf="parent" app:layout_constraintTop_toTopOf="parent">
                    <TextView android:layout_width="match_parent" android:layout_height="match_parent" android:text=">" android:textColor="#94A3B8" android:fontFamily="sans-serif-medium" android:gravity="center" android:textSize="16sp"/>
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
print("Accessibility and visual hierarchy perfected!")
