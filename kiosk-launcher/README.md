# MIVOR Kiosk Launcher — Android Senior Mode

Aplicación independiente nativa de Android que funciona como pantalla de inicio (*Launcher / Home Screen*) restringiendo el dispositivo al 100% para personas mayores o dependientes, integrando la app oficial de MIVOR Salud de forma segura.

---

## 🎯 Características Principales

1. **🩺 MIVOR Salud**: Acceso directo con 1 toque a la app médica oficial (`com.vitalai.app`), manteniendo el historial clínico, citas y consultas con especialistas.
2. **📞 Foto-Llamadas Directas**: Tarjetas de llamada de gran tamaño y alto contraste para llamar a hijos o cuidadores con un solo toque (sin marcar ni perderse en la agenda).
3. **🚨 Botón SOS de Emergencia**: Al presionar, obtiene la ubicación GPS exacta del paciente, dispara una alerta con enlace a Google Maps por WhatsApp a los cuidadores y enlaza una llamada de auxilio directa al 112 / 911.
4. **💬 WhatsApp Familiar**: Acceso directo al chat o grupo de la familia.
5. **🖼️ Álbum de Recuerdos**: Visualizador de fotos y memorias familiares para estimular la mente activa y la tranquilidad.
6. **🔒 Modo Cuidador con PIN**: Panel protegido con la clave que el cuidador crea al instalar la app (4 a 8 números; se guarda cifrada con hash, nunca en texto) para:
   - Salir del modo Kiosko y liberar el teléfono.
   - Ajustar redes Wi-Fi y volumen.
   - Configurar los teléfonos de emergencia y familiares.

---

## 📱 Cómo abrir en Android Studio

1. Abre **Android Studio**.
2. Selecciona **Open** y navega a la carpeta:
   `C:\Users\crist\OneDrive\Documentos\Proyecto\kiosk-launcher`
3. Deja que Gradle sincronice las dependencias.
4. Conecta un dispositivo Android por USB o inicia un emulador.
5. Presiona **Run** (`Shift + F10`).

---

## 🛡️ Bloqueo Total como Propietario del Dispositivo (Device Owner)

Para convertir la tablet o teléfono en un Kiosko 100% infranqueable (sin barra de notificaciones desplegable ni botón de inicio que escape):

```bash
adb shell dpm set-device-owner ai.mivor.kiosk/.KioskDeviceAdminReceiver
```

Para retirar los permisos de administrador en cualquier momento:
```bash
adb shell dpm remove-active-admin ai.mivor.kiosk/.KioskDeviceAdminReceiver
```
O simplemente ingresa a **Ajustes Cuidador** dentro de la app con la clave del cuidador y presiona **Salir del Modo Kiosko**.
