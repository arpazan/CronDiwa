<template>
    <div class="min-h-[calc(100vh-180px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full text-center">
        <div class="text-9xl font-extrabold text-primary-main">404</div>
        
        <h1 class="mt-4 text-3xl font-bold text-gray-900 tracking-tight">
          Page not found
        </h1>
        
        <p class="mt-6 text-base text-gray-500">
          Sorry, we couldn't find the page you're looking for.
        </p>
        
        <div class="mt-10">
          <router-link 
            to="/" 
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-main hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-main"
          >
            <HomeIcon class="h-5 w-5 mr-2" />
            Go back home
          </router-link>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { HomeIcon } from '@heroicons/vue/24/outline';
  </script>