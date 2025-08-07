import { ref, computed } from "vue";
import { useApi } from "./useApi";
import { useRouter } from "vue-router";

export interface MeResponse {
  user: {
    account: string;
    name: string;
  };
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

export function useAuth() {
  const router = useRouter();
  const { get, post } = useApi();

  const user = ref<MeResponse["user"] | null>(null);
  const loading = ref(false);
  const error = ref("");

  const saveTokens = (access: string, refresh: string) => {
    localStorage.setItem("auth_token", access);
    localStorage.setItem("refresh_token", refresh);
  };

  const fetchUserProfile = async () => {
    try {
      const profile = await get<MeResponse>("auth/me");
      user.value = profile.data?.user || null;
    } catch (err) {
      console.error("Failed to fetch user profile", err);
      user.value = null;
    }
  };

  const refreshToken = async () => {
    const refresh_token = localStorage.getItem("refresh_token");
    if (!refresh_token) return false;

    try {
      const res = await post<{ access_token: string; refresh_token: string }>(
        "auth/refresh",
        { refresh_token }
      );
      saveTokens(res.data.access_token, res.data.refresh_token);
      return true;
    } catch {
      logout();
      return false;
    }
  };

  const checkAuth = async () => {
    if (localStorage.getItem("auth_token")) {
      await fetchUserProfile();
      return true;
    }
    return false;
  };

  const login = async (username: string, password: string) => {
    loading.value = true;
    error.value = "";

    try {
      const res = await post<LoginResponse>("auth/login", {
        username,
        password,
      });
      saveTokens(res.data.access_token, res.data.refresh_token);
      await fetchUserProfile();
      router.push("/");
      return true;
    } catch {
      error.value = "Login failed";
      return false;
    } finally {
      loading.value = false;
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    user.value = null;
  };

  const authenticated = computed(() => !!user.value);
  return {
    user,
    loading,
    error,
    authenticated,
    login,
    logout,
    checkAuth,
    fetchUserProfile,
    refreshToken,
  };
}
