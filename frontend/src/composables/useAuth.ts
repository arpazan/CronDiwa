import { ref, computed } from 'vue';
import { useApi } from './useApi';
import { useRouter } from 'vue-router';

export function useAuth() {
  const router = useRouter()
  const { login: apiLogin, logout: apiLogout, isAuthenticated } = useApi();
  
  const user = ref<string | null>(null);
  const loading = ref(false);
  const error = ref('');
  
  // Check if user is already logged in
  const checkAuth = () => {
    if (isAuthenticated()) {
      // Extract username from Basic Auth token
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const decoded = atob(token);
          const username = decoded.split(':')[0];
          user.value = username;
        } catch (e) {
          // Invalid token format
          apiLogout();
        }
      }
    } else {
      user.value = null;
    }
    
    return user.value !== null;
  };
  
  // Initialize auth state
  checkAuth();
  
  // Login function
  const login = async (username: string, password: string) => {
    loading.value = true;
    error.value = '';
    
    try {
      const success = await apiLogin(username, password);
      if (success) {
        user.value = username;
        const redirect = router.currentRoute.value.query.redirect as string || '/'
        router.push(redirect)
        return true;
      } else {
        error.value = 'Invalid credentials';
        return false;
      }
    } catch (err) {
      error.value = 'Login failed';
      return false;
    } finally {
      loading.value = false;
    }
  };
  
  // Logout function
  const logout = () => {
    apiLogout();
    user.value = null;
  };
  
  // Computed property for authentication state
  const authenticated = computed(() => user.value !== null);
  
  return {
    user,
    loading,
    error,
    authenticated,
    login,
    logout,
    checkAuth
  };
}