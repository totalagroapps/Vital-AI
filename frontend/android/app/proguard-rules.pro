# Reglas de R8 para el build de release (minifyEnabled true).
# Los plugins de Capacitor (incluido SecureTokenPlugin) ya los protegen las reglas
# que trae @capacitor/android.

# Métodos que el WebView llama desde JavaScript (puente de Capacitor y window.AndroidUpdater):
# si R8 los renombra o quita la anotación, el WebView no los encuentra y la llamada falla sin error.
-keepattributes JavascriptInterface,*Annotation*
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Números de línea en los informes de errores, sin exponer los nombres de archivo originales.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
