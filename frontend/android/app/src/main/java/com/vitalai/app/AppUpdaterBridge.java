package com.vitalai.app;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
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
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import org.json.JSONObject;

/**
 * Descarga e instala actualizaciones de la app desde JavaScript (window.AndroidUpdater).
 *
 * Como cualquier contenido del WebView puede llamar a este puente, el APK se verifica antes de
 * abrir el instalador:
 *  1. Solo HTTPS y solo dominios permitidos (también en cada redirección).
 *  2. SHA-256 del archivo, si el servidor lo publica.
 *  3. Mismo nombre de paquete y misma firma que la app instalada: aunque la URL fuera maliciosa,
 *     no se puede instalar otra app ni una versión firmada por otra persona.
 */
public class AppUpdaterBridge {

    /** Dominios desde los que se aceptan APK (y sus redirecciones). */
    private static final String[] ALLOWED_HOSTS = {
        "github.com",
        "objects.githubusercontent.com",
        "release-assets.githubusercontent.com",
        "med-ai-hub-v2-production.up.railway.app",
        "vitalai.up.railway.app"
    };
    /** En github.com solo se aceptan las Releases del repositorio oficial. */
    private static final String GITHUB_RELEASES_PATH = "/totalagroapps/Vital-AI/releases/";

    private static final int MAX_REDIRECTS = 5;
    private static final long MAX_APK_BYTES = 250L * 1024 * 1024;

    private final Activity activity;
    private final WebView webView;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private volatile boolean isDownloading = false;

    public AppUpdaterBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
    }

    @JavascriptInterface
    public boolean isNative() {
        return true;
    }

    /** Compatibilidad con versiones anteriores del frontend (sin hash). */
    @JavascriptInterface
    public void downloadAndInstall(final String apkUrl) {
        downloadAndInstallVerified(apkUrl, null);
    }

    /** @param expectedSha256 hash hexadecimal del APK publicado por el servidor, o vacío/null. */
    @JavascriptInterface
    public void downloadAndInstallVerified(final String apkUrl, final String expectedSha256) {
        if (isDownloading) return;
        isDownloading = true;

        new Thread(() -> {
            File apkFile = null;
            try {
                HttpURLConnection connection = openVerifiedConnection(apkUrl);

                final long fileLength = connection.getContentLengthLong();
                if (fileLength > MAX_APK_BYTES) {
                    connection.disconnect();
                    throw new Exception("El archivo de actualización es demasiado grande");
                }

                // Caché interna: otras apps no pueden cambiar el archivo entre la verificación y la instalación
                File updatesDir = new File(activity.getCacheDir(), "updates");
                if (!updatesDir.exists()) {
                    updatesDir.mkdirs();
                }
                apkFile = new File(updatesDir, "mivor-update.apk");
                if (apkFile.exists()) {
                    apkFile.delete();
                }

                MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
                try (InputStream input = connection.getInputStream();
                     FileOutputStream output = new FileOutputStream(apkFile)) {
                    byte[] data = new byte[8192];
                    long total = 0;
                    int count;
                    long lastUpdateTime = 0;

                    while ((count = input.read(data)) != -1) {
                        total += count;
                        if (total > MAX_APK_BYTES) {
                            throw new Exception("El archivo de actualización es demasiado grande");
                        }
                        output.write(data, 0, count);
                        sha256.update(data, 0, count);

                        long currentTime = System.currentTimeMillis();
                        if (currentTime - lastUpdateTime > 80 || total == fileLength) {
                            lastUpdateTime = currentTime;
                            final int percent = (fileLength > 0) ? (int) ((total * 100) / fileLength) : -1;
                            final long currentBytes = total;
                            mainHandler.post(() -> runJs(String.format(Locale.ROOT,
                                "window.onApkDownloadProgress && window.onApkDownloadProgress(%d, %d, %d);",
                                percent, currentBytes, fileLength)));
                        }
                    }
                    output.flush();
                } finally {
                    connection.disconnect();
                }

                verifyHash(sha256.digest(), expectedSha256);
                verifyPackageAndSignature(apkFile);

                final File finalApk = apkFile;
                mainHandler.post(() -> {
                    isDownloading = false;
                    runJs("window.onApkDownloadSuccess && window.onApkDownloadSuccess();");
                    installApk(finalApk);
                });

            } catch (final Exception e) {
                if (apkFile != null && apkFile.exists()) {
                    apkFile.delete();
                }
                final String errorMsg = e.getMessage() != null ? e.getMessage() : "Error en la descarga";
                mainHandler.post(() -> {
                    isDownloading = false;
                    // JSONObject.quote escapa comillas, barras y saltos de línea: el texto no se ejecuta como código
                    runJs("window.onApkDownloadError && window.onApkDownloadError(" + JSONObject.quote(errorMsg) + ");");
                });
            }
        }).start();
    }

    /** Sigue las redirecciones a mano para comprobar el dominio de cada salto. */
    private HttpURLConnection openVerifiedConnection(String apkUrl) throws Exception {
        String currentUrl = apkUrl;
        for (int redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
            URL url = new URL(currentUrl);
            checkAllowedUrl(url);

            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(15000);
            connection.setReadTimeout(30000);
            connection.setInstanceFollowRedirects(false);
            connection.connect();

            int status = connection.getResponseCode();
            if (status == HttpURLConnection.HTTP_MOVED_TEMP || status == HttpURLConnection.HTTP_MOVED_PERM ||
                status == HttpURLConnection.HTTP_SEE_OTHER || status == 307 || status == 308) {
                String location = connection.getHeaderField("Location");
                connection.disconnect();
                if (location == null || location.isEmpty()) {
                    throw new Exception("Redirección sin destino");
                }
                currentUrl = new URL(url, location).toString(); // admite rutas relativas
                continue;
            }
            if (status != HttpURLConnection.HTTP_OK) {
                connection.disconnect();
                throw new Exception("Error al conectar con el servidor: HTTP " + status);
            }
            return connection;
        }
        throw new Exception("Demasiadas redirecciones");
    }

    private static void checkAllowedUrl(URL url) throws Exception {
        if (!"https".equalsIgnoreCase(url.getProtocol())) {
            throw new Exception("Descarga bloqueada: la actualización debe venir por HTTPS");
        }
        String host = url.getHost().toLowerCase(Locale.ROOT);
        boolean allowed = Arrays.asList(ALLOWED_HOSTS).contains(host);
        if (allowed && host.equals("github.com")) {
            allowed = url.getPath().startsWith(GITHUB_RELEASES_PATH);
        }
        if (!allowed) {
            throw new Exception("Descarga bloqueada: origen no autorizado (" + host + ")");
        }
    }

    private static void verifyHash(byte[] actual, String expectedSha256) throws Exception {
        if (expectedSha256 == null) return;
        String expected = expectedSha256.trim().toLowerCase(Locale.ROOT);
        if (expected.isEmpty() || expected.equals("undefined") || expected.equals("null")) return;

        StringBuilder hex = new StringBuilder();
        for (byte b : actual) {
            hex.append(String.format(Locale.ROOT, "%02x", b));
        }
        if (!hex.toString().equals(expected)) {
            throw new Exception("El archivo descargado está dañado o fue modificado (SHA-256 no coincide)");
        }
    }

    /** El APK debe ser esta misma app y estar firmado con la misma clave que la instalada. */
    @SuppressWarnings("deprecation")
    private void verifyPackageAndSignature(File apkFile) throws Exception {
        PackageManager pm = activity.getPackageManager();
        String ourPackage = activity.getPackageName();
        boolean modernApi = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P;

        PackageInfo archive = pm.getPackageArchiveInfo(apkFile.getAbsolutePath(),
            modernApi ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES);
        if (archive == null) {
            throw new Exception("El archivo descargado no es un APK válido");
        }
        if (!ourPackage.equals(archive.packageName)) {
            throw new Exception("El APK descargado no es MIVOR (" + archive.packageName + ")");
        }

        boolean sameSigner;
        if (modernApi) {
            // Todos los firmantes del APK deben ser certificados de la app instalada
            Signature[] signers = archive.signingInfo == null ? null : archive.signingInfo.getApkContentsSigners();
            sameSigner = signers != null && signers.length > 0;
            if (signers != null) {
                for (Signature s : signers) {
                    sameSigner &= pm.hasSigningCertificate(ourPackage, s.toByteArray(), PackageManager.CERT_INPUT_RAW_X509);
                }
            }
        } else {
            Signature[] installed = pm.getPackageInfo(ourPackage, PackageManager.GET_SIGNATURES).signatures;
            sameSigner = archive.signatures != null && installed != null &&
                new HashSet<>(Arrays.asList(archive.signatures)).equals(new HashSet<>(Arrays.asList(installed)));
        }

        if (!sameSigner) {
            throw new Exception("La actualización no está firmada con la misma clave que la app instalada. " +
                "Por seguridad no se instalará.");
        }
    }

    private void runJs(String script) {
        if (webView != null) {
            webView.evaluateJavascript(script, null);
        }
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
