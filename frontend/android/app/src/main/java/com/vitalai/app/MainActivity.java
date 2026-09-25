package com.vitalai.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Token de sesión cifrado con el Android Keystore (src/utils/authStorage.js)
        registerPlugin(SecureTokenPlugin.class);
        super.onCreate(savedInstanceState);

        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                // Limpiar la caché HTTP para asegurar carga de assets nuevos.
                // El almacenamiento web (idioma, preferencias) ya no se borra en cada arranque:
                // la sesión vive en el Keystore y el chat en sessionStorage.
                webView.clearCache(true);
                WebSettings settings = webView.getSettings();
                settings.setCacheMode(WebSettings.LOAD_NO_CACHE);

                // Registrar bridge para actualización directa in-app
                webView.addJavascriptInterface(new AppUpdaterBridge(this, webView), "AndroidUpdater");
            }
        } catch (Exception e) {
            // Se inicializará si el WebView carga en otro ciclo
        }
    }
}
