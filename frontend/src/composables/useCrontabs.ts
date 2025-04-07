import { ref, onMounted } from 'vue';
import { useApi } from './useApi';

export interface Crontab {
  id: number;
  name: string;
  schedule: string;
  command: string;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface CrontabLogResponse {
  crontab: Pick<Crontab, "id" | "name">
  logs: {
    stdout: string
    stderr: string
  }
}

export interface CrontabInput {
  name: string;
  schedule: string;
  command: string;
  active?: number;
}

export interface CrontabsResponse {
  crontabs: Crontab[];
}

export interface CrontabResponse {
  crontab: Crontab;
}

export function useCrontabs() {
  const { get, post, put, patch, delete: del } = useApi();
  
  const crontabs = ref<Crontab[]>([]);
  const loading = ref(false);
  const error = ref('');

  const fetchCrontabs = async () => {
    loading.value = true;
    error.value = '';
    
    try {
      const response = await get<CrontabsResponse>('/crontabs');
      crontabs.value = response.data.crontabs;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to fetch crontabs';
      console.error(error.value);
    } finally {
      loading.value = false;
    }
  };

  const addCrontab = async (crontab: CrontabInput) => {
    loading.value = true;
    error.value = '';
    
    try {
      const response = await post<CrontabResponse>('/crontabs', crontab);
      crontabs.value.push(response.data.crontab);
      return response.data.crontab;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to add crontab';
      console.error(error.value);
      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  const updateCrontab = async (id: number, crontab: Partial<CrontabInput>) => {
    loading.value = true;
    error.value = '';
    
    try {
      const response = await put<CrontabResponse>(`/crontabs/${id}`, crontab);
      const index = crontabs.value.findIndex(c => c.id === id);
      if (index !== -1) {
        crontabs.value[index] = response.data.crontab;
      }
      return response.data.crontab;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to update crontab';
      console.error(error.value);
      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  const deleteCrontab = async (id: number) => {
    loading.value = true;
    error.value = '';
    
    try {
      await del(`/crontabs/${id}`);
      crontabs.value = crontabs.value.filter(c => c.id !== id);
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to delete crontab';
      console.error(error.value);
      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  const toggleCrontab = async (id: number) => {
    loading.value = true;
    error.value = '';
    
    try {
      const response = await patch<CrontabResponse>(`/crontabs/${id}/toggle`, {});
      const index = crontabs.value.findIndex(c => c.id === id);
      if (index !== -1) {
        crontabs.value[index] = response.data.crontab;
      }
      return response.data.crontab;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to toggle crontab';
      console.error(error.value);
      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  // Fetch logs for a specific crontab
  const getCrontabLogs = async (id: number) => {
    loading.value = true;
    error.value = '';
    
    try {
      const response = await get<CrontabLogResponse>(`/crontabs/${id}/logs`);
      return response.data;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to fetch crontab logs';
      console.error(error.value);
      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  // Clear logs for a specific crontab
  const clearCrontabLogs = async (id: number) => {
    loading.value = true;
    error.value = '';
    
    try {
      await del(`/crontabs/${id}/logs`);
      return true;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to clear crontab logs';
      console.error(error.value);
      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  // Test a command
  const testCommand = async (command: string) => {
    loading.value = true;
    error.value = '';
    
    try {
      const response = await post('/crontabs/test-command', { command });
      return response.data;
    } catch (err: any) {
      error.value = typeof err === 'string' ? err : 'Failed to test command';
      console.error(error.value);
      throw error.value;
    } finally {
      loading.value = false;
    }
  };

  onMounted(fetchCrontabs);

  return {
    crontabs,
    loading,
    error,
    fetchCrontabs,
    addCrontab,
    updateCrontab,
    deleteCrontab,
    toggleCrontab,
    getCrontabLogs,
    clearCrontabLogs,
    testCommand
  };
}