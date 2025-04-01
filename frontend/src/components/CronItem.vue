<template>
  <li>
    <div class="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50">
      <div class="flex flex-col gap-1 min-w-0">
        <div class="flex items-center pl-1">
          <div :class="['h-3 w-3 rounded-full mr-3', crontab.active ? 'bg-green-500' : 'bg-gray-300']"></div>
          <p class="text-sm font-medium text-primary-main truncate">{{ crontab.name }}</p>
        </div>
        <div class="mt-2 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
          <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
            <ClockIcon class="flex-shrink-0 mr-1.5 h-5 w-5 text-primary-main" />
            {{ crontab.schedule }}
          </div>
          <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
            <CommandLineIcon class="flex-shrink-0 mr-1.5 h-5 w-5 text-primary-main" />
            {{ crontab.command }}
          </div>
        </div>
        <div>
          <p class="text-sm text-gray-500">Last modify : {{ dayjs(crontab.updated_at) }}</p>
        </div>
      </div>
      <div class="flex space-x-2">
        <button title="Test"
          class="p-1 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <FireIcon class="h-5 w-5 text-primary-main" />
        </button>
        <button @click="$emit('toggle', crontab.id)" :title="crontab.active ? 'Deactivate' : 'Activate'"
          class="p-1 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <template v-if="crontab.active">
            <PauseIcon class="h-5 w-5 text-yellow-500" />
          </template>
          <template v-else>
            <PlayIcon class="h-5 w-5 text-green-500" />
          </template>
        </button>

        <button @click="$emit('edit', crontab)" title="Edit"
          class="p-1 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <PencilIcon class="h-5 w-5 text-primary-main" />
        </button>

        <button @click="$emit('delete', crontab.id)" title="Delete" :disabled="crontab.active == 0"
          class="p-1 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <TrashIcon :class="[crontab.active == 0 ? 'text-gray-500' : 'text-red-500']" class="h-5 w-5 " />
        </button>
      </div>
    </div>
  </li>
</template>

<script setup lang="ts">
import { ClockIcon, PencilIcon, TrashIcon, PauseIcon, PlayIcon, CommandLineIcon, FireIcon } from '@heroicons/vue/24/outline';
import type { Crontab } from '../composables/useCrontabs';
import dayjs from 'dayjs';

defineProps<{
  crontab: Crontab
}>();

defineEmits<{
  (e: 'edit', crontab: Crontab): void
  (e: 'delete', id: number): void
  (e: 'toggle', id: number): void
}>();
</script>