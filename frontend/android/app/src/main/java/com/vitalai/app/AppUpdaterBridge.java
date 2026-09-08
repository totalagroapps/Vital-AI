package com.vitalai.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class AppUpdaterBridge {
    private final Activity activity;
    private final WebView webView;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private boolean isDownloading = false;

    public AppUpdaterBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
    }

    @JavascriptInterface
    public boolean isNative() {
        return true;
    }

    @JavascriptInterface
    public void downloadAndInstall(final String apkUrl) {
        if (isDownloading) return;
        isDownloading = true;

        new Thread(new Runnable() {
            @Override
            public void run() {
                File apkFile = null;
                try {
                    String currentUrl = apkUrl;
                    HttpURLConnection connection = null;
                    int redirectCount = 0;

                    // Manejo de redirecciones automáticas (hasta 5)
                    while (redirectCount < 5) {
                        URL url = new URL(currentUrl);
                        connection = (HttpURLConnection) url.openConnection();
                        connection.setRequestMethod("GET");
                        connection.setConnectTimeout(15000);
                        connection.setReadTimeout(30000);
                        connection.setInstanceFollowRedirects(true);
                        connection.connect();

                        int status = connection.getResponseCode();
                        if (status == HttpURLConnection.HTTP_MOVED_TEMP || 
                            status == HttpURLConnection.HTTP_MOVED_PERM || 
                            status == 307 || status == 308) {
                            String redirectUrl = connection.getHeaderField("Location");
                            if (redirectUrl != null && !redirectUrl.isEmpty()) {
                                currentUrl = redirectUrl;
                                redirectCount++;
                                continue;
                            }
                        }
                        break;
                    }

                    if (connection == null || connection.getResponseCode() != HttpURLConnection.HTTP_OK) {
                        throw new Exception("Error al conectar con el servidor: HTTP " + 
                            (connection != null ? connection.getResponseCode() : "desconocido"));
                    }

                    final long fileLength = connection.getContentLength();
                    File cacheDir = activity.getExternalCacheDir();
                    if (cacheDir == null) {
                        cacheDir = activity.getCacheDir();
                    }
                    File updatesDir = new File(cacheDir, "updates");
                    if (!updatesDir.exists()) {
                        updatesDir.mkdirs();
                    }
                    apkFile = new File(updatesDir, "mivor-update.apk");
                    if (apkFile.exists()) {
                        apkFile.delete();
                    }

                    InputStream input = connection.getInputStream();
                    FileOutputStream output = new FileOutputStream(apkFile);

                    byte[] data = new byte[8192];
                    long total = 0;
                    int count;
                    long lastUpdateTime = 0;

                    while ((count = input.read(data)) != -1) {
                        total += count;
                        output.write(data, 0, count);

                        long currentTime = System.currentTimeMillis();
                        if (currentTime - lastUpdateTime > 80 || total == fileLength) {
                            lastUpdateTime = currentTime;
                            final int percent = (fileLength > 0) ? (int) ((total * 100) / fileLength) : -1;
                            final long currentBytes = total;
                            final long totalBytes = fileLength;
                            mainHandler.post(new Runnable() {
                                @Override
                                public void run() {
                                    if (webView != null) {
                                        webView.evaluateJavascript(
                                            String.format("window.onApkDownloadProgress && window.onApkDownloadProgress(%d, %d, %d);", percent, currentBytes, totalBytes),
                                            null
                                        );
                                    }
                                }
                            });
                        }
                    }

                    output.flush();
                    output.close();
                    input.close();

                    final File finalApk = apkFile;
                    mainHandler.post(new Runnable() {
                        @Override
                        public void run() {
                            isDownloading = false;
                            if (webView != null) {
                                webView.evaluateJavascript("window.onApkDownloadSuccess && window.onApkDownloadSuccess();", null);
                            }
                            installApk(finalApk);
                        }
                    });

                } catch (final Exception e) {
                    isDownloading = false;
                    mainHandler.post(new Runnable() {
                        @Override
                        public void run() {
                            if (webView != null) {
                                String errorMsg = e.getMessage() != null ? e.getMessage().replace("'", "\\'") : "Error en la descarga";
                                webView.evaluateJavascript(
                                    String.format("window.onApkDownloadError && window.onApkDownloadError('%s');", errorMsg),
                                    null
                                );
                            }
                        }
                    });
                }
            }
        }).start();
    }

    private void installApk(File apkFile) {
        try {
            if (apkFile == null || !apkFile.exists()) return;

            // En Android 8+ verificar si tiene permiso para instalar aplicaciones desconocidas
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (!activity.getPackageManager().canRequestPackageInstalls()) {
                    Intent permIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                    permIntent.setData(Uri.parse("package:" + activity.getPackageName()));
                    activity.startActivity(permIntent);
                }
            }

            Uri apkUri = FileProvider.getUriForFile(
                activity,
                activity.getPackageName() + ".fileprovider",
                apkFile
            );

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            activity.startActivity(intent);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
