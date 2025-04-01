import { ref } from 'vue';
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, AxiosError, HttpStatusCode } from 'axios';
import {  useRouter } from 'vue-router';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface ApiResponse<T = any> {
  data: T;
  loading: boolean;
  error: string | null;
}

export function useApi() {
  const router = useRouter()
  const api: AxiosInstance = axios.create({
    baseURL: API_URL,
  });

  // Add request interceptor for authentication
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Basic ${token}`;
    }
    return config;
  });

  const request = async <T>(
    method: string,
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    const loading = ref(true);
    const error = ref<string | null>(null);
    let responseData: T = {} as T;

    try {
      let response: AxiosResponse<T>;

      switch (method.toLowerCase()) {
        case 'get':
          response = await api.get<T>(url, config);
          break;
        case 'post':
          response = await api.post<T>(url, data, config);
          break;
        case 'put':
          response = await api.put<T>(url, data, config);
          break;
        case 'patch':
          response = await api.patch<T>(url, data, config);
          break;
        case 'delete':
          response = await api.delete<T>(url, config);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      responseData = response.data;
    } catch (err) {
      const axiosError = err as AxiosError<{
        statusCode: number,
        error: string,
        message: string,
      }>;
      error.value = axiosError.response?.data?.error || axiosError.message || 'An error occurred';
      if(axiosError.status == HttpStatusCode.Unauthorized){
        logout()
      }
      throw error.value;
    } finally {
      loading.value = false;
    }

    return {
      data: responseData,
      loading: loading.value,
      error: error.value,
    };
  };

  const get = <T>(url: string, config?: AxiosRequestConfig) => 
    request<T>('get', url, undefined, config);
  
  const post = <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    request<T>('post', url, data, config);
  
  const put = <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    request<T>('put', url, data, config);
  
  const patch = <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    request<T>('patch', url, data, config);
  
  const del = <T>(url: string, config?: AxiosRequestConfig) => 
    request<T>('delete', url, undefined, config);

  // Auth functions
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Create Base64 encoded credentials
      const token = btoa(`${username}:${password}`);
      
      await get('/login', {
        headers: {
          Authorization: `Basic ${token}`
        }
      });
      
      localStorage.setItem('auth_token', token);
      return true;
    } catch (error) {
      localStorage.removeItem('auth_token');
      return false;
    }
  };

  const logout = (): void => {
    localStorage.removeItem('auth_token');
    console.log({router})
    if (router) {
      router.push('/login');
    }
  };

  const isAuthenticated = (): boolean => {
    return !!localStorage.getItem('auth_token');
  };

  return {
    api,
    request,
    get,
    post,
    put,
    patch,
    delete: del,
    login,
    logout,
    isAuthenticated
  };
}