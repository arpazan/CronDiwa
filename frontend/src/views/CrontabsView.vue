<script setup lang="ts">
import CronList from '../components/CronList.vue';
</script>

<template>
    <div>
        <div class="mb-6">
            <h1 class="text-3xl font-bold text-gray-900">Crontab Management</h1>
            <p class="mt-2 text-gray-600">
                Manage your scheduled tasks with an easy-to-use interface.
            </p>
        </div>

        <div class="bg-white shadow rounded-lg overflow-hidden">
            <div class="p-6">
                <CronList />
            </div>
        </div>

        <div class="mt-8 bg-white shadow rounded-lg overflow-hidden">
            <div class="p-6">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">Cron Expression Help</h2>

                <div class="prose max-w-none">
                    <p>
                        Cron expressions are used to configure the schedule of your tasks.
                        Each expression consists of five fields separated by spaces:
                    </p>

                    <table class="min-w-full divide-y divide-primary-main my-4">
                        <thead class="bg-secondary-main">
                            <tr>
                                <th scope="col"
                                    class="px-6 py-3 text-left text-xs font-medium text-primary-main uppercase tracking-wider">
                                    Field
                                </th>
                                <th scope="col"
                                    class="px-6 py-3 text-left text-xs font-medium text-primary-main uppercase tracking-wider">
                                    Allowed Values
                                </th>
                                <th scope="col"
                                    class="px-6 py-3 text-left text-xs font-medium text-primary-main uppercase tracking-wider">
                                    Special Characters
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    Minute
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    0-59
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    * , - /
                                </td>
                            </tr>
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    Hour
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    0-23
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    * , - /
                                </td>
                            </tr>
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    Day of Month
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    1-31
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    * , - / ?
                                </td>
                            </tr>
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    Month
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    1-12 or JAN-DEC
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    * , - /
                                </td>
                            </tr>
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    Day of Week
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    0-6 or SUN-SAT
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    * , - / ?
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <h3 class="text-lg font-medium text-gray-900 mt-6 mb-2">Common Examples</h3>

                    <ul class="space-y-2">
                        <li><code class="bg-primary-main text-secondary-main px-2 py-1 rounded">* * * * *</code> - Run every minute</li>
                        <li><code class="bg-primary-main text-secondary-main px-2 py-1 rounded">0 * * * *</code> - Run once an hour (at minute
                            0)</li>
                        <li><code class="bg-primary-main text-secondary-main px-2 py-1 rounded">0 0 * * *</code> - Run once a day at midnight
                        </li>
                        <li><code class="bg-primary-main text-secondary-main px-2 py-1 rounded">0 0 * * 0</code> - Run once a week on Sunday at
                            midnight</li>
                        <li><code class="bg-primary-main text-secondary-main px-2 py-1 rounded">0 0 1 * *</code> - Run once a month (1st day at
                            midnight)</li>
                        <li><code class="bg-primary-main text-secondary-main px-2 py-1 rounded">0 0 1 1 *</code> - Run once a year (Jan 1st at
                            midnight)</li>
                        <li><code class="bg-primary-main text-secondary-main px-2 py-1 rounded">*/15 * * * *</code> - Run every 15 minutes</li>
                        <li><code class="bg-primary-main text-secondary-main px-2 py-1 rounded">0 9-17 * * 1-5</code> - Run on the hour, 9 AM-5
                            PM, Monday-Friday</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>
