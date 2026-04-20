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
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      // محاولة استدعاء logout من الخادم
      try {
        await logoutMutation.mutateAsync();
      } catch (error: unknown) {
        // إذا حدث خطأ UNAUTHORIZED، تجاهله (المستخدم بالفعل غير مصرح)
        if (
          error instanceof TRPCClientError &&
          error.data?.code === "UNAUTHORIZED"
        ) {
          // تجاهل الخطأ وتابع مع التنظيف المحلي
          console.warn("[Auth] User already unauthorized, proceeding with cleanup");
        } else {
          // إذا كان هناك خطأ آخر، أعد رفعه
          throw error;
        }
      }
    } finally {
      // تنظيف البيانات المحلية بغض النظر عن نجاح الخادم
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
      
      // مسح localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('manus-runtime-user-info');
        // مسح أي بيانات أخرى متعلقة بالمستخدم
        localStorage.removeItem('sidebar-width');
      }
      
      console.log("[Auth] Logout cleanup completed successfully");
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );
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

  // تم تعطيل إعادة التوجيه التلقائي هنا لتجنب مشكلة تسجيل الدخول المزدوج.
  // يتم التعامل مع حماية المسارات من خلال مكون ProtectedRoute في App.tsx.
  /*
  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    state.user,
  ]);
  */

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
