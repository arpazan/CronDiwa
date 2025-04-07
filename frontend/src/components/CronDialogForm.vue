<script setup lang="ts">
import { reactive, ref, watch, computed, onMounted } from 'vue';
import { useCrontabs, type Crontab, type CrontabInput } from '../composables/useCrontabs';
import { useCronBuilder } from '../composables/useCronBuilder';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/vue/24/solid';

const props = defineProps({
  show: Boolean,
  crontab: {
    type: Object as () => Crontab | null,
    default: null
  }
});

const emit = defineEmits(['update:show', 'saved']);
const {
  addCrontab,
  updateCrontab,
} = useCrontabs();

const formSubmitting = ref(false);

const formData = reactive<CrontabInput>({
  name: '',
  schedule: '',
  command: '',
});

// Validation state
const validationErrors = reactive({
  name: '',
  schedule: '',
  command: ''
});

// Initialize cron builder
const {
  cronExpression,
  cronParts,
  isValid: isCronValid,
  errorMessage: cronErrorMessage,
  description: cronDescription,
  updateFromParts,
  applyTemplate,
  reset: resetCronBuilder,
  cronTemplates
} = useCronBuilder();

// Connect cronExpression to formData.schedule
watch(cronExpression, (newValue) => {
  formData.schedule = newValue;
});

// Reset form data
const resetForm = () => {
  formData.name = '';
  formData.schedule = '';
  formData.command = '';

  // Reset validation
  validationErrors.name = '';
  validationErrors.schedule = '';
  validationErrors.command = '';

  // Reset cron builder
  resetCronBuilder();
};

// Close form
const closeForm = () => {
  resetForm();
  emit('update:show', false);
};

// Validate the entire form
const validateForm = () => {
  let isValid = true;

  // Validate name
  if (!formData.name.trim()) {
    validationErrors.name = 'Name is required';
    isValid = false;
  } else {
    validationErrors.name = '';
  }

  // Validate schedule
  if (!isCronValid.value) {
    validationErrors.schedule = cronErrorMessage.value;
    isValid = false;
  } else {
    validationErrors.schedule = '';
  }

  // Validate command
  if (!formData.command.trim()) {
    validationErrors.command = 'Command is required';
    isValid = false;
  } else {
    validationErrors.command = '';
  }

  return isValid;
};

// Is form valid computed property
const isFormValid = computed(() => {
  return formData.name.trim() !== '' &&
    formData.command.trim() !== '' &&
    isCronValid.value &&
    formData.schedule.trim() !== '';
});

// Save crontab (add or update)
const saveCrontab = async () => {
  if (!validateForm()) {
    return;
  }

  formSubmitting.value = true;

  try {
    if (props.crontab) {
      // Update existing crontab
      await updateCrontab(props.crontab.id, {
        name: formData.name,
        schedule: formData.schedule,
        command: formData.command,
        active: formData.active ? 1 : 0
      });
    } else {
      // Add new crontab
      await addCrontab({
        name: formData.name,
        schedule: formData.schedule,
        command: formData.command,
        active: formData.active ? 1 : 0
      });
    }
    emit('saved')
    closeForm();
  } catch (err) {
    // Error is already handled in the composable
  } finally {
    formSubmitting.value = false;
  }
};

const isEditMode = computed(() => !!props.crontab);

watch(() => props.crontab, (newValue) => {
  if (newValue) {
    // We're editing an existing crontab
    formData.name = newValue.name;
    formData.schedule = newValue.schedule;
    formData.command = newValue.command;
    formData.active = newValue.active;
    
    // Update cron builder with the schedule
    resetCronBuilder(newValue.schedule);
  } else if (props.show) {
    // We're adding a new crontab
    resetForm();
    
    // Set a default schedule
    const defaultSchedule = '0 0 * * *';
    formData.schedule = defaultSchedule;
    resetCronBuilder(defaultSchedule);
  }
}, { immediate: true });


// Watch for show prop changes
watch(() => props.show, (newValue) => {
  if (newValue && !formData.schedule) {
    // Set a default schedule when opening the form
    const defaultSchedule = '0 0 * * *';
    formData.schedule = defaultSchedule;
    resetCronBuilder(defaultSchedule);
  }
});

// Initialize when component mounts
onMounted(() => {
  // If there's an initial schedule, set it in the cron builder
  if (formData.schedule) {
    resetCronBuilder(formData.schedule);
  }
});
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 z-10 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closeForm"></div>

        <div
          class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900">
              {{ isEditMode ? '✏️ Edit Crontab' : '✨ Add New Crontab' }}
            </h3>

            <div class="mt-4 space-y-4">
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
                <input 
                  type="text" 
                  id="name" 
                  v-model="formData.name" 
                  class="input mt-1"
                  :class="{'border-red-500': validationErrors.name}"
                  placeholder="Daily Backup" 
                />
                <p v-if="validationErrors.name" class="mt-1 text-xs text-red-500">
                  {{ validationErrors.name }}
                </p>
              </div>

              <div>
                <label for="schedule" class="block text-sm font-medium text-gray-700">
                  Schedule (Cron Expression)
                </label>

                <!-- Cron Expression Input with Validation -->
                <div class="relative">
                  <input 
                    type="text" 
                    id="schedule" 
                    v-model="cronExpression"
                    class="input mt-1 pr-10" 
                    :class="{'border-red-500': validationErrors.schedule}"
                    placeholder="0 0 * * *"
                  />
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 mt-1">
                    <CheckCircleIcon v-if="isCronValid && cronExpression"
                      class="h-5 w-5 text-green-500" />
                    <ExclamationCircleIcon v-else-if="cronExpression"
                      class="h-5 w-5 text-red-500" />
                  </div>
                </div>
                <p v-if="validationErrors.schedule" class="mt-1 text-xs text-red-500">
                  {{ validationErrors.schedule }}
                </p>

                <!-- Cron Expression Builder -->
                <div class="mt-3 border border-gray-200 rounded-md p-3 bg-gray-50">
                  <div class="text-sm font-medium text-gray-700 mb-2">Cron Expression Builder
                  </div>

                  <div class="grid grid-cols-5 gap-2">
                    <!-- Minutes -->
                    <div>
                      <label class="block text-xs font-medium text-gray-500">Minutes</label>
                      <select 
                        v-model="cronParts.minute"
                        class="block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-primary-main focus:border-primary-main"
                        @change="updateFromParts"
                      >
                        <option value="*">Every minute (*)</option>
                        <option value="*/5">Every 5 minutes (*/5)</option>
                        <option value="*/15">Every 15 minutes (*/15)</option>
                        <option value="*/30">Every 30 minutes (*/30)</option>
                        <option value="0">At minute 0 (0)</option>
                        <option value="custom">Custom...</option>
                      </select>
                      <input 
                        v-if="cronParts.minute === 'custom'" 
                        v-model="cronParts.minuteCustom"
                        type="text"
                        class="mt-1 block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-primary-main focus:border-primary-main"
                        placeholder="0-59 or */n" 
                        @input="updateFromParts" 
                      />
                    </div>

                    <!-- Hours -->
                    <div>
                      <label class="block text-xs font-medium text-gray-500">Hours</label>
                      <select 
                        v-model="cronParts.hour"
                        class="block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-primary-main focus:border-primary-main"
                        @change="updateFromParts"
                      >
                        <option value="*">Every hour (*)</option>
                        <option value="*/2">Every 2 hours (*/2)</option>
                        <option value="*/6">Every 6 hours (*/6)</option>
                        <option value="0">At midnight (0)</option>
                        <option value="12">At noon (12)</option>
                        <option value="custom">Custom...</option>
                      </select>
                      <input 
                        v-if="cronParts.hour === 'custom'" 
                        v-model="cronParts.hourCustom"
                        type="text"
                        class="mt-1 block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-primary-main focus:border-primary-main"
                        placeholder="0-23 or */n" 
                        @input="updateFromParts" 
                      />
                    </div>

                    <!-- Day of Month -->
                    <div>
                      <label class="block text-xs font-medium text-gray-500">Day
                        (Month)</label>
                      <select 
                        v-model="cronParts.dayOfMonth"
                        class="block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-primary-main focus:border-primary-main"
                        @change="updateFromParts"
                      >
                        <option value="*">Every day (*)</option>
                        <option value="1">1st of month (1)</option>
                        <option value="15">15th of month (15)</option>
                        <option value="L">Last day of month (L)</option>
                        <option value="custom">Custom...</option>
                      </select>
                      <input 
                        v-if="cronParts.dayOfMonth === 'custom'"
                        v-model="cronParts.dayOfMonthCustom" 
                        type="text"
                        class="mt-1 block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-primary-main focus:border-primary-main"
                        placeholder="1-31 or */n" 
                        @input="updateFromParts" 
                      />
                    </div>

                    <!-- Month -->
                    <div>
                      <label class="block text-xs font-medium text-gray-500">Month</label>
                      <select 
                        v-model="cronParts.month"
                        class="block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-primary-main focus:border-primary-main"
                        @change="updateFromParts"
                      >
                        <option value="*">Every month (*)</option>
                        <option value="1">January (1)</option>
                        <option value="6">June (6)</option>
                        <option value="12">December (12)</option>
                        <option value="custom">Custom...</option>
                      </select>
                      <input 
                        v-if="cronParts.month === 'custom'" 
                        v-model="cronParts.monthCustom"
                        type="text"
                        class="mt-1 block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-primary-main focus:border-primary-main"
                        placeholder="1-12 or */n" 
                        @input="updateFromParts" 
                      />
                    </div>

                    <!-- Day of Week -->
                    <div>
                      <label class="block text-xs font-medium text-gray-500">Day
                        (Week)</label>
                      <select 
                        v-model="cronParts.dayOfWeek"
                        class="block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-primary-main focus:border-primary-main"
                        @change="updateFromParts"
                      >
                        <option value="*">Every day (*)</option>
                        <option value="0">Sunday (0)</option>
                        <option value="1">Monday (1)</option>
                        <option value="5">Friday (5)</option>
                        <option value="6">Saturday (6)</option>
                        <option value="1-5">Weekdays (1-5)</option>
                        <option value="0,6">Weekends (0,6)</option>
                        <option value="custom">Custom...</option>
                      </select>
                      <input 
                        v-if="cronParts.dayOfWeek === 'custom'"
                        v-model="cronParts.dayOfWeekCustom" 
                        type="text"
                        class="mt-1 block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-primary-main focus:border-primary-main"
                        placeholder="0-6 or */n" 
                        @input="updateFromParts" 
                      />
                    </div>
                  </div>

                  <!-- Human-readable description -->
                  <div class="mt-3 text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
                    <strong>Will run:</strong> {{ cronDescription || 'Invalid cron expression' }}
                  </div>

                  <!-- Preset Templates -->
                  <div class="mt-3">
                    <label class="block text-xs font-medium text-gray-700">Common
                      Templates</label>
                    <div class="grid grid-cols-2 gap-2 mt-1">
                      <button 
                        v-for="(template, index) in cronTemplates" 
                        :key="index"
                        type="button"
                        class="text-xs py-1 px-2 bg-gray-200 hover:bg-gray-300 rounded text-left"
                        @click="applyTemplate(template.value)"
                      >
                        {{ template.label }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label for="command" class="block text-sm font-medium text-gray-700">Command</label>
                <input 
                  type="text" 
                  id="command" 
                  v-model="formData.command" 
                  class="input mt-1"
                  :class="{'border-red-500': validationErrors.command}"
                  placeholder="backup.sh" 
                />
                <p v-if="validationErrors.command" class="mt-1 text-xs text-red-500">
                  {{ validationErrors.command }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button 
              type="button" 
              class="btn btn-primary sm:ml-3" 
              @click="saveCrontab"
              :disabled="formSubmitting || !isFormValid"
            >
              <span v-if="formSubmitting">Saving...</span>
              <span v-else>{{ isEditMode ? 'Update' : 'Add' }}</span>
            </button>
            <button 
              type="button" 
              class="btn btn-secondary mt-3 sm:mt-0" 
              @click="closeForm"
              :disabled="formSubmitting"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>