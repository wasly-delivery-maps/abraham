import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logoutMutation = trpc.auth.logout.useMutation();

  const logout = useCallback(async () => {
    console.log("[Auth] Starting logout process...");
    
    try {
      // 1. محاولة إبلاغ الخادم بتسجيل الخروج
      await logoutMutation.mutateAsync().catch(err => {
        console.warn("[Auth] Server logout failed or already logged out:", err);
      });

      // 2. تنظيف البيانات المحلية في tRPC cache
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
      
      // 3. مسح كافة البيانات المخزنة محلياً
      if (typeof window !== 'undefined') {
        // مسح الـ LocalStorage بالكامل لضمان عدم بقاء أي توكن أو بيانات قديمة
        localStorage.clear();
        sessionStorage.clear();
        
        // مسح الكوكيز (محاولة إضافية)
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }
      
      console.log("[Auth] Local cleanup completed.");
      
      // 4. إعادة التوجيه باستخدام استبدال الصفحة بالكامل لقتل أي حالة React متبقية
      if (typeof window !== 'undefined') {
        window.location.replace("/");
      }
    } catch (error) {
      console.error("[Auth] Critical error during logout:", error);
      // في حالة الفشل الذريع، اجبر المتصفح على الذهاب للصفحة الرئيسية
      if (typeof window !== 'undefined') {
        window.location.href = "/";
      }
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    if (meQuery.data) {
      localStorage.setItem(
        "manus-runtime-user-info",
        JSON.stringify(meQuery.data)
      );
    }
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
