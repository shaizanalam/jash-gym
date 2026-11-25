package com.nutrimentor.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(OnDeviceAiPlugin.class);
        super.onCreate(savedInstanceState);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        View decorView = getWindow().getDecorView();
        decorView.setBackgroundColor(Color.parseColor("#06141B"));

        WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(getWindow(), decorView);
        if (insetsController != null) {
            insetsController.setAppearanceLightStatusBars(false);
            insetsController.setAppearanceLightNavigationBars(false);
        }

        ViewCompat.setOnApplyWindowInsetsListener(decorView, (v, windowInsets) -> {
            Insets bars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            boolean imeVisible = windowInsets.isVisible(WindowInsetsCompat.Type.ime());
            Insets ime = windowInsets.getInsets(WindowInsetsCompat.Type.ime());
            int softInputMode = getWindow().getAttributes().softInputMode
                & WindowManager.LayoutParams.SOFT_INPUT_MASK_ADJUST;
            boolean applyImePadding = imeVisible && softInputMode != WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING;
            int bottom = applyImePadding ? Math.max(bars.bottom, ime.bottom) : bars.bottom;

            v.setPadding(bars.left, bars.top, bars.right, bottom);

            WindowInsetsCompat.Builder builder = new WindowInsetsCompat.Builder(windowInsets)
                .setInsets(WindowInsetsCompat.Type.systemBars(), Insets.NONE)
                .setInsets(WindowInsetsCompat.Type.displayCutout(), Insets.NONE)
                .setInsetsIgnoringVisibility(WindowInsetsCompat.Type.systemBars(), Insets.NONE)
                .setInsetsIgnoringVisibility(WindowInsetsCompat.Type.displayCutout(), Insets.NONE);

            if (applyImePadding) {
                builder.setInsets(WindowInsetsCompat.Type.ime(), Insets.NONE);
            }

            return builder.build();
        });
        ViewCompat.requestApplyInsets(decorView);

        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            webView.setVerticalScrollBarEnabled(true);
            webView.setHorizontalScrollBarEnabled(false);
            webView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);
            webView.setOverScrollMode(View.OVER_SCROLL_IF_CONTENT_SCROLLS);
            webView.setNestedScrollingEnabled(true);
            webView.setFocusableInTouchMode(true);
        }

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() != null && getBridge().getWebView() != null && getBridge().getWebView().canGoBack()) {
                    getBridge().getWebView().goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                    setEnabled(true);
                }
            }
        });
    }
}
