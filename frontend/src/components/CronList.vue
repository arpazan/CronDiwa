<script setup lang="ts">
import { ref } from 'vue';
import { useCrontabs, type Crontab } from '../composables/useCrontabs';
import { ArrowUpOnSquareStackIcon, PlusIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline';
import CronItem from './CronItem.vue'
import CronDialogForm from './CronDialogForm.vue';
const {
    crontabs,
    loading,
    error,
    fetchCrontabs,
    deleteCrontab,
    toggleCrontab
} = useCrontabs();

// Form state
const showFormDialog = ref(false);
const currentCrontab = ref<Crontab | null>(null);


// Delete confirmation
const showDeleteConfirm = ref(false);
const deleteLoading = ref(false);
const crontabToDelete = ref<number | null>(null);


const openAddForm = () => {
    currentCrontab.value = null;
    showFormDialog.value = true;
};

const editCrontab = (crontab: Crontab) => {
    currentCrontab.value = crontab;
    showFormDialog.value = true;
};

const handleFormSaved = () => {
    fetchCrontabs();
};


// Confirm delete
const confirmDelete = (id: number) => {
    crontabToDelete.value = id;
    showDeleteConfirm.value = true;
};

// Delete confirmed
const deleteCrontabConfirmed = async () => {
    if (crontabToDelete.value === null) return;

    deleteLoading.value = true;

    try {
        await deleteCrontab(crontabToDelete.value);
        showDeleteConfirm.value = false;

        fetchCrontabs();
    } catch (err) {
        // Error is already handled in the composable
    } finally {
        deleteLoading.value = false;
        crontabToDelete.value = null;
    }
};


</script>

<template>
    <div class="space-y-6">
        <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold">Crontabs</h1>
            <div class="flex gap-1">
                <button @click="openAddForm" class="btn btn-primary flex items-center">
                    <PlusIcon class="h-5 w-5 mr-1" />
                    Add Crontab
                </button>
                <button class="btn btn-secondary flex items-center">
                    <ArrowUpOnSquareStackIcon class="h-5 w-5 mr-1" />
                    Apply to Crontab System
                </button>
            </div>

        </div>

        <div v-if="loading" class="text-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p class="mt-4 text-gray-600">Loading crontabs...</p>
        </div>

        <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{{ error }}</p>
            <button @click="fetchCrontabs" class="underline mt-2">Try again</button>
        </div>

        <div v-else-if="crontabs.length === 0" class="text-center py-8">
            <p class="text-gray-600">No crontabs found. Create your first one!</p>
            <button @click="openAddForm" class="btn btn-primary mt-4">
                Add Crontab
            </button>
        </div>

        <div v-else class="bg-white shadow overflow-hidden sm:rounded-md">
            <ul class="divide-y divide-gray-200">
                <CronItem v-for="crontab in crontabs" :key="crontab.id" :crontab="crontab" @edit="editCrontab"
                    @delete="confirmDelete" @toggle="toggleCrontab" />
            </ul>
        </div>
        <!-- Add/Edit Modal -->
        <CronDialogForm v-model:show="showFormDialog" :crontab="currentCrontab" @saved="handleFormSaved" />
        <!-- Delete Confirmation Modal -->
        <Transition name="modal">
            <div v-if="showDeleteConfirm" class="fixed inset-0 z-10 overflow-y-auto">
                <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                        @click="showDeleteConfirm = false"></div>

                    <div
                        class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div class="sm:flex sm:items-start">
                                <div
                                    class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                    <ExclamationCircleIcon class="h-6 w-6 text-red-600" />
                                </div>
                                <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <h3 class="text-lg leading-6 font-medium text-gray-900">
                                        Delete Crontab
                                    </h3>
                                    <div class="mt-2">
                                        <p class="text-sm text-gray-500">
                                            Are you sure you want to delete this crontab? This action cannot be undone.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button type="button" class="btn btn-danger sm:ml-3" @click="deleteCrontabConfirmed"
                                :disabled="deleteLoading">
                                <span v-if="deleteLoading">Deleting...</span>
                                <span v-else>Delete</span>
                            </button>
                            <button type="button" class="btn btn-secondary mt-3 sm:mt-0"
                                @click="showDeleteConfirm = false" :disabled="deleteLoading">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>



<style scoped>
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}
</style>