<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useCrontabs } from '../composables/useCrontabs';
import { ArrowPathIcon, ArrowUturnLeftIcon, TrashIcon } from '@heroicons/vue/24/outline';

interface Props {
    id: string;
}

const props = defineProps<Props>();

// State variables
interface Crontab {
    id: number | null;
    name: string;
}

interface Logs {
    stdout: string;
    stderr: string;
}

const crontab = ref<Crontab>({ id: null, name: 'Loading...' });
const logs = ref<Logs>({ stdout: '', stderr: '' });
const activeTab = ref<'stdout' | 'stderr'>('stdout');
const autoRefresh = ref<boolean>(false);
let refreshInterval: number | null = null;

const router = useRouter();
const {
    loading,
    error,
    getCrontabLogs,
    clearCrontabLogs
} = useCrontabs();

const fetchLogs = async () => {
    const crontabLogs = await getCrontabLogs(parseInt(props.id));
    logs.value = {
        stderr: crontabLogs.logs.stderr,
        stdout: crontabLogs.logs.stdout
    }
    crontab.value = crontabLogs.crontab
};

const refreshLogs = () => {
    fetchLogs();
};

const clearLogs = async () => {
    if (!confirm('Are you sure you want to clear all logs for this crontab?')) {
        return;
    }
    await clearCrontabLogs(parseInt(props.id))
    logs.value = { stdout: '', stderr: '' };
};

const toggleAutoRefresh = () => {
    if (autoRefresh.value) {
        refreshInterval = window.setInterval(() => {
            fetchLogs();
        }, 10000);
    } else {
        clearRefreshInterval();
    }
};

const clearRefreshInterval = () => {
    if (refreshInterval !== null) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
};

const goBack = () => {
    router.push('/');
};

watch(autoRefresh, (newValue) => {
    if (newValue) {
        toggleAutoRefresh();
    } else {
        clearRefreshInterval();
    }
});

onMounted(() => {
    fetchLogs();
});

onBeforeUnmount(() => {
    clearRefreshInterval();
});
</script>

<template>
    <div class="log-detail">
        <div class="log-header">
            <h1>Name: {{ crontab.name }}</h1>
            <div class="actions">
                <button title="Refresh" @click="refreshLogs" class=" p-1 rounded-full hover:bg-secondary-main focus:outline-none focus:ring-2 focus:ring-offset-2
                    focus:ring-blue-500">
                    <ArrowPathIcon class="h-5 w-5 text-gray-700" />
                </button>

                <button title="Clear" @click="clearLogs" class=" p-1 rounded-full hover:bg-secondary-main focus:outline-none focus:ring-2 focus:ring-offset-2
                    focus:ring-blue-500">
                    <TrashIcon class="h-5 w-5 text-red-500" />
                </button>

                <button title="Back" @click="goBack" class=" p-1 rounded-full hover:bg-secondary-main focus:outline-none focus:ring-2 focus:ring-offset-2
                    focus:ring-blue-500">
                    <ArrowUturnLeftIcon class="h-5 w-5 text-gray-700" />
                </button>
            </div>
        </div>

        <!-- Options bar -->
        <div class="options-bar">
            <div class="auto-refresh">
                <label>
                    <input type="checkbox" v-model="autoRefresh" @change="toggleAutoRefresh">
                    Auto-refresh (10s)
                </label>
            </div>
        </div>

        <!-- Loading indicator -->
        <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading logs...</p>
        </div>

        <!-- Error message -->
        <div v-else-if="error" class="error-message">
            <p>{{ error }}</p>
            <button @click="refreshLogs" class="btn retry-btn">Try Again</button>
        </div>

        <!-- Log content tabs -->
        <div v-else class="log-container">
            <div class="log-tabs">
                <button :class="['tab', { active: activeTab === 'stdout' }]" @click="activeTab = 'stdout'">
                    Standard Output
                </button>
                <button :class="['tab', { active: activeTab === 'stderr' }]" @click="activeTab = 'stderr'">
                    Standard Error
                </button>
            </div>

            <!-- Log content -->
            <div class="log-content">
                <div v-if="activeTab === 'stdout'" class="log-panel">
                    <pre v-if="logs.stdout && logs.stdout !== 'No stdout logs available'">{{ logs.stdout }}</pre>
                    <div v-else class="empty-log">No standard output logs available</div>
                </div>
                <div v-else-if="activeTab === 'stderr'" class="log-panel">
                    <pre v-if="logs.stderr && logs.stderr !== 'No stderr logs available'">{{ logs.stderr }}</pre>
                    <div v-else class="empty-log">No standard error logs available</div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.log-detail {
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
}

.log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.actions {
    display: flex;
    gap: 10px;
}

.btn {
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
}

.retry-btn {
    background-color: #2196f3;
    color: white;
    margin-top: 10px;
}

.options-bar {
    display: flex;
    margin-bottom: 15px;
}

.auto-refresh {
    display: flex;
    align-items: center;
}

.auto-refresh label {
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
}

.log-container {
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
}

.log-tabs {
    display: flex;
    background-color: #f5f5f5;
    border-bottom: 1px solid #ddd;
}

.tab {
    padding: 12px 20px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    flex: 1;
}

.tab.active {
    background-color: white;
    border-bottom: 2px solid var(--color-primary-main);
}

.log-content {
    background-color: #fff;
    min-height: 400px;
}

.log-panel {
    padding: 15px;
    height: 400px;
    overflow: auto;
}

pre {
    margin: 0;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
}

.empty-log {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #757575;
    font-style: italic;
}

.loading {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 400px;
}

.spinner {
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top: 4px solid #2196f3;
    width: 30px;
    height: 30px;
    animation: spin 1s linear infinite;
    margin-bottom: 10px;
}

.error-message {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 400px;
    background-color: #ffebee;
    border: 1px solid #ffcdd2;
    border-radius: 4px;
    padding: 20px;
    text-align: center;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}
</style>