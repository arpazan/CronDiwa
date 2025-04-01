<script setup lang="ts">
import Header from './components/Header.vue';

</script>

<template>
   <div class="min-h-screen flex flex-col">
    <Header />
    <main class="flex-1 container mx-auto px-4 py-6">
      <router-view />
    </main>
    <footer class="bg-white text-primary-main py-4">
      <div class="container mx-auto px-4 text-center">
        <p>CronDiwa &copy; {{ new Date().getFullYear() }}</p>
      </div>
    </footer>
  </div>
</template>
