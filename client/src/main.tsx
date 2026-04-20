import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // تم تعطيل إعادة التوجيه التلقائي هنا لتجنب مشكلة تسجيل الدخول المزدوج.
  // يتم التعامل مع حماية المسارات من خلال مكون ProtectedRoute في App.tsx.
  console.warn("[Auth] Unauthorized access detected, but auto-redirect is disabled to prevent double login.");
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

// ============================================
// Service Worker Registration for PWA
// ============================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered successfully:', registration);
        
        // التحقق من التحديثات
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New version available, please refresh the page');
              }
            });
          }
        });
        
        // مراقبة المستودع للتحديثات كل دقيقة
        setInterval(() => {
          registration.update().catch((error) => {
            console.warn('[PWA] Failed to check for updates:', error);
          });
        }, 60000);
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });
} else {
  console.warn('[PWA] Service Worker not supported by this browser');
}

// ============================================
// Notification Permission Handler
// ============================================
if ('Notification' in window) {
  if (Notification.permission === 'default') {
    Notification.requestPermission().then((permission) => {
      console.log('[PWA] Notification permission:', permission);
      if (permission === 'granted') {
        console.log('[PWA] Notifications enabled successfully');
      }
    }).catch((error) => {
      console.error('[PWA] Error requesting notification permission:', error);
    });
  } else if (Notification.permission === 'granted') {
    console.log('[PWA] Notifications already enabled');
  }
} else {
  console.warn('[PWA] Notifications not supported by this browser');
}

// ============================================
// Geolocation API Check (Fallback)
// ============================================
if ('geolocation' in navigator) {
  console.log('[PWA] Geolocation API available');
} else {
  console.warn('[PWA] Geolocation not supported by this browser');
}

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
