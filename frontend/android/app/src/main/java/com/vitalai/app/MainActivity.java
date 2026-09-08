package com.vitalai.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebStorage;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                // Limpiar caché y storage del WebView para asegurar carga de assets nuevos
                webView.clearCache(true);
                WebStorage.getInstance().deleteAllData();
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
