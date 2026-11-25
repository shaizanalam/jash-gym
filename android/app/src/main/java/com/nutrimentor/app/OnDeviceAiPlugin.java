package com.nutrimentor.app;

import android.app.ActivityManager;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.os.StatFs;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mediapipe.framework.image.BitmapImageBuilder;
import com.google.mediapipe.framework.image.MPImage;
import com.google.mediapipe.tasks.components.containers.Category;
import com.google.mediapipe.tasks.core.BaseOptions;
import com.google.mediapipe.tasks.genai.llminference.LlmInference;
import com.google.mediapipe.tasks.vision.core.RunningMode;
import com.google.mediapipe.tasks.vision.imageclassifier.ImageClassifier;
import com.google.mediapipe.tasks.vision.imageclassifier.ImageClassifierResult;
import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "OnDeviceAi")
public class OnDeviceAiPlugin extends Plugin {

    private static final String MODEL_DIR = "models";
    private static final String LLM_FILENAME = "gemma_meal_parser.task";
    private static final String VISION_FILENAME = "food_classifier.tflite";

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private LlmInference cachedLlm = null;
    private ImageClassifier cachedClassifier = null;

    private File getModelDir() {
        File dir = new File(getContext().getFilesDir(), MODEL_DIR);
        if (!dir.exists()) {
            dir.mkdirs();
        }
        return dir;
    }

    private File getModelFile(String modelType) {
        if ("llm".equals(modelType)) {
            return new File(getModelDir(), LLM_FILENAME);
        }
        return new File(getModelDir(), VISION_FILENAME);
    }

    private boolean isArm64Device() {
        for (String abi : Build.SUPPORTED_ABIS) {
            if ("arm64-v8a".equalsIgnoreCase(abi)) {
                return true;
            }
        }
        return false;
    }

    private long getTotalRamMb() {
        ActivityManager am = (ActivityManager) getContext().getSystemService(Context.ACTIVITY_SERVICE);
        if (am == null) return 0;
        ActivityManager.MemoryInfo info = new ActivityManager.MemoryInfo();
        am.getMemoryInfo(info);
        return info.totalMem / (1024L * 1024L);
    }

    private long getAvailableStorageMb() {
        StatFs stat = new StatFs(getContext().getFilesDir().getAbsolutePath());
        return stat.getAvailableBytes() / (1024L * 1024L);
    }

    private synchronized void releaseLlm() {
        if (cachedLlm != null) {
            try {
                cachedLlm.close();
            } catch (Exception ignored) {}
            cachedLlm = null;
        }
    }

    private synchronized void releaseClassifier() {
        if (cachedClassifier != null) {
            try {
                cachedClassifier.close();
            } catch (Exception ignored) {}
            cachedClassifier = null;
        }
    }

    @PluginMethod
    public void getDeviceCapabilities(PluginCall call) {
        boolean arm64 = isArm64Device();
        long ramMb = getTotalRamMb();
        long storageMb = getAvailableStorageMb();
        File llmFile = getModelFile("llm");
        File visionFile = getModelFile("vision");

        JSObject res = new JSObject();
        res.put("supported", arm64);
        res.put("isNativeAndroid", true);
        res.put("abi", Build.SUPPORTED_ABIS.length > 0 ? Build.SUPPORTED_ABIS[0] : "unknown");
        res.put("totalRamMb", ramMb);
        res.put("availableStorageMb", storageMb);
        res.put("llmModelReady", llmFile.exists() && llmFile.length() > 1024L);
        res.put("llmModelSizeMb", llmFile.exists() ? (llmFile.length() / (1024L * 1024L)) : 0);
        res.put("visionModelReady", visionFile.exists() && visionFile.length() > 1024L);
        res.put("visionModelSizeMb", visionFile.exists() ? (visionFile.length() / (1024L * 1024L)) : 0);
        if (!arm64) {
            res.put("reason", "On-device MediaPipe inference requires an arm64-v8a Android device.");
        }
        call.resolve(res);
    }

    @PluginMethod
    public void downloadModel(PluginCall call) {
        String modelType = call.getString("modelType", "");
        String rawUrl = call.getString("url", "");

        if (!"llm".equals(modelType) && !"vision".equals(modelType)) {
            call.reject("Invalid modelType. Expected 'llm' or 'vision'.");
            return;
        }
        if (rawUrl == null || !rawUrl.startsWith("https://")) {
            call.reject("A valid https:// model download URL is required.");
            return;
        }

        executor.execute(() -> {
            File target = getModelFile(modelType);
            File tempFile = new File(target.getAbsolutePath() + ".part");
            HttpURLConnection conn = null;
            try {
                if ("llm".equals(modelType)) releaseLlm();
                else releaseClassifier();

                URL url = new URL(rawUrl);
                conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(60000);
                conn.setInstanceFollowRedirects(true);
                conn.connect();

                int code = conn.getResponseCode();
                if (code < 200 || code >= 300) {
                    call.reject("Model download failed with HTTP status " + code);
                    return;
                }

                long totalBytes = conn.getContentLengthLong();
                long downloaded = 0L;
                int lastPct = -1;

                try (InputStream in = new BufferedInputStream(conn.getInputStream());
                     FileOutputStream out = new FileOutputStream(tempFile)) {
                    byte[] buffer = new byte[32768];
                    int read;
                    while ((read = in.read(buffer)) != -1) {
                        out.write(buffer, 0, read);
                        downloaded += read;
                        if (totalBytes > 0) {
                            int pct = (int) ((downloaded * 100L) / totalBytes);
                            if (pct != lastPct && (pct % 2 == 0 || pct == 100)) {
                                lastPct = pct;
                                JSObject evt = new JSObject();
                                evt.put("modelType", modelType);
                                evt.put("progress", pct);
                                evt.put("downloadedMb", Math.round(downloaded / (1024.0 * 1024.0)));
                                evt.put("totalMb", Math.round(totalBytes / (1024.0 * 1024.0)));
                                notifyListeners("modelDownloadProgress", evt);
                            }
                        }
                    }
                    out.flush();
                }

                if (target.exists()) {
                    target.delete();
                }
                if (!tempFile.renameTo(target)) {
                    call.reject("Failed to finalize downloaded model file.");
                    return;
                }

                JSObject res = new JSObject();
                res.put("path", target.getAbsolutePath());
                res.put("sizeBytes", target.length());
                call.resolve(res);
            } catch (Exception e) {
                if (tempFile.exists()) tempFile.delete();
                call.reject("Model download error: " + e.getMessage());
            } finally {
                if (conn != null) conn.disconnect();
            }
        });
    }

    @PluginMethod
    public void deleteModel(PluginCall call) {
        String modelType = call.getString("modelType", "");
        if (!"llm".equals(modelType) && !"vision".equals(modelType)) {
            call.reject("Invalid modelType.");
            return;
        }
        if ("llm".equals(modelType)) releaseLlm();
        else releaseClassifier();

        File target = getModelFile(modelType);
        boolean deleted = !target.exists() || target.delete();
        JSObject res = new JSObject();
        res.put("deleted", deleted);
        call.resolve(res);
    }

    @PluginMethod
    public void parseMealText(PluginCall call) {
        String prompt = call.getString("prompt", "");
        if (prompt == null || prompt.trim().isEmpty()) {
            call.reject("Prompt is required.");
            return;
        }
        File llmFile = getModelFile("llm");
        if (!llmFile.exists()) {
            call.reject("Tier 2 LLM model is not downloaded.");
            return;
        }

        executor.execute(() -> {
            long start = System.currentTimeMillis();
            try {
                synchronized (this) {
                    if (cachedLlm == null) {
                        LlmInference.LlmInferenceOptions options =
                            LlmInference.LlmInferenceOptions.builder()
                                .setModelPath(llmFile.getAbsolutePath())
                                .setMaxTokens(512)
                                .setMaxTopK(40)
                                .build();
                        cachedLlm = LlmInference.createFromOptions(getContext(), options);
                    }
                }
                String formattedPrompt = "<start_of_turn>user\n" + prompt + "<end_of_turn>\n<start_of_turn>model\n";
                String responseText = cachedLlm.generateResponse(formattedPrompt);
                JSObject res = new JSObject();
                res.put("text", responseText);
                res.put("latencyMs", System.currentTimeMillis() - start);
                call.resolve(res);
            } catch (Exception e) {
                call.reject("On-device LLM inference failed: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void classifyFoodImage(PluginCall call) {
        String base64Image = call.getString("base64Image", "");
        if (base64Image == null || base64Image.trim().isEmpty()) {
            call.reject("base64Image is required.");
            return;
        }
        File visionFile = getModelFile("vision");
        if (!visionFile.exists()) {
            call.reject("Tier 2 vision classifier model is not downloaded.");
            return;
        }

        executor.execute(() -> {
            long start = System.currentTimeMillis();
            try {
                byte[] bytes = Base64.decode(base64Image, Base64.DEFAULT);
                Bitmap bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
                if (bitmap == null) {
                    call.reject("Could not decode image bitmap.");
                    return;
                }

                synchronized (this) {
                    if (cachedClassifier == null) {
                        try (FileInputStream fis = new FileInputStream(visionFile);
                             FileChannel channel = fis.getChannel()) {
                            MappedByteBuffer modelBuffer =
                                channel.map(FileChannel.MapMode.READ_ONLY, 0, channel.size());
                            BaseOptions baseOptions = BaseOptions.builder()
                                .setModelAssetBuffer(modelBuffer)
                                .build();
                            ImageClassifier.ImageClassifierOptions options =
                                ImageClassifier.ImageClassifierOptions.builder()
                                    .setBaseOptions(baseOptions)
                                    .setRunningMode(RunningMode.IMAGE)
                                    .setMaxResults(3)
                                    .build();
                            cachedClassifier = ImageClassifier.createFromOptions(getContext(), options);
                        }
                    }
                }

                MPImage mpImage = new BitmapImageBuilder(bitmap).build();
                ImageClassifierResult result = cachedClassifier.classify(mpImage);

                JSArray labels = new JSArray();
                if (result != null
                        && result.classificationResult() != null
                        && !result.classificationResult().classifications().isEmpty()) {
                    List<Category> cats = result.classificationResult().classifications().get(0).categories();
                    for (Category cat : cats) {
                        JSObject item = new JSObject();
                        String labelName =
                            (cat.displayName() != null && !cat.displayName().isEmpty())
                                ? cat.displayName()
                                : cat.categoryName();
                        item.put("label", labelName);
                        item.put("confidence", cat.score());
                        labels.put(item);
                    }
                }

                JSObject res = new JSObject();
                res.put("labels", labels);
                res.put("latencyMs", System.currentTimeMillis() - start);
                call.resolve(res);
            } catch (Exception e) {
                call.reject("On-device food classification failed: " + e.getMessage());
            }
        });
    }

    @Override
    protected void handleOnDestroy() {
        releaseLlm();
        releaseClassifier();
        executor.shutdownNow();
        super.handleOnDestroy();
    }
}
