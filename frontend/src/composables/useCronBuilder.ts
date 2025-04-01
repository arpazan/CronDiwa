import { ref, reactive, watch } from 'vue';
import { 
  validateCronExpression, 
  buildCronExpression, 
  parseCronExpression,
  getDefaultCronParts,
  cronTemplates,
  type CronParts
} from '../utils/cron';

export function useCronBuilder(initialExpression: string = '') {
  // Cron expression
  const cronExpression = ref(initialExpression);
  
  // Validation state
  const isValid = ref(true);
  const errorMessage = ref('');
  const description = ref('');
  
  // Cron builder parts
  const cronParts = reactive<CronParts>(getDefaultCronParts());
  
  // Initialize with the initial expression if provided
  if (initialExpression) {
    const parts = parseCronExpression(initialExpression);
    if (parts) {
      Object.assign(cronParts, parts);
      validate();
    }
  }
  
  // Validate the current expression
  function validate() {
    const result = validateCronExpression(cronExpression.value);
    isValid.value = result.isValid;
    errorMessage.value = result.errorMessage;
    description.value = result.description;
    return result.isValid;
  }
  
  // Update the expression from the builder parts
  function updateFromParts() {
    cronExpression.value = buildCronExpression(cronParts);
    validate();
  }
  
  // Apply a template
  function applyTemplate(template: string) {
    cronExpression.value = template;
    const parts = parseCronExpression(template);
    if (parts) {
      Object.assign(cronParts, parts);
    }
    validate();
  }
  
  // Reset the builder to default values
  function reset(defaultExpression: string = '') {
    Object.assign(cronParts, getDefaultCronParts());
    cronExpression.value = defaultExpression;
    if (defaultExpression) {
      validate();
    } else {
      isValid.value = true;
      errorMessage.value = '';
      description.value = '';
    }
  }
  
  // Watch for changes in the expression to update the parts
  watch(cronExpression, (newValue) => {
    if (newValue) {
      const parts = parseCronExpression(newValue);
      if (parts) {
        // Use Object.assign to avoid losing reactivity
        Object.assign(cronParts, parts);
      }
      validate();
    }
  });
  
  return {
    cronExpression,
    cronParts,
    isValid,
    errorMessage,
    description,
    validate,
    updateFromParts,
    applyTemplate,
    reset,
    cronTemplates
  };
}