<template>
  <div class="min-h-screen bg-surface-0 flex items-center justify-center">
    <div class="text-center">
      <div class="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p class="text-ink-subtle text-sm">Autenticando...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
// O @nuxtjs/supabase trata o callback automaticamente
// e redireciona para /dashboard
</script>
