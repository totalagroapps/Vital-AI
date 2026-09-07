package com.vitalai.app;

import android.content.Context;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebStorage;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                // 1. Limpiar caché del WebView y Storage para garantizar que siempre
                // cargue los bundles y assets más recientes del APK sin quedar atrapado en versiones viejas.
                webView.clearCache(true);
                WebStorage.getInstance().deleteAllData();

                WebSettings settings = webView.getSettings();
                settings.setCacheMode(WebSettings.LOAD_NO_CACHE);

                // 2. Interfaz nativa para impresión y exportación de PDFs (PrintManager de Android)
                webView.addJavascriptInterface(new AndroidPrintInterface(), "AndroidPrinter");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public class AndroidPrintInterface {
        @JavascriptInterface
        public void printHtml(final String title, final String htmlContent) {
            runOnUiThread(() -> {
                try {
                    final WebView printWebView = new WebView(MainActivity.this);
                    printWebView.setWebViewClient(new WebViewClient() {
                        @Override
                        public void onPageFinished(WebView view, String url) {
                            try {
                                PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                                String jobName = (title != null && !title.isEmpty()) ? title : "MIVOR Document";
                                PrintDocumentAdapter printAdapter = printWebView.createPrintDocumentAdapter(jobName);
                                printManager.print(jobName, printAdapter, new PrintAttributes.Builder().build());
                            } catch (Exception ex) {
                                ex.printStackTrace();
                            }
                        }
                    });
                    printWebView.loadDataWithBaseURL(null, htmlContent, "text/html", "UTF-8", null);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        }
    }
}
