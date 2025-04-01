<script setup lang="ts">
import { useAuth } from '../composables/useAuth';
import router from '../router';

const { authenticated, logout, user } = useAuth();

const handleLogout = () => {
  logout();
  router.push('/login');
};
</script>

<template>
  <header class="bg-white shadow-sm">
    <div class="container mx-auto px-4 py-4 flex justify-between items-center">
      <router-link to="/" class="text-xl font-bold flex items-center">
        <h1 class="text-3xl font-bold tracking-tight text-primary-main">CronDiwa</h1>
      </router-link>

      <div v-if="authenticated">
        <div class="flex items-center space-x-4">
          <span>Welcome, {{ user }}</span>
          <button @click="handleLogout" class="btn btn-danger text-sm">
            Logout
          </button>
        </div>
      </div>
    </div>
  </header>
</template>