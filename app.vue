<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import type { OrgTheme } from '~/types'

const headers = useRequestHeaders(['x-tenant-theme', 'x-tenant-name'])
const themeRaw = headers['x-tenant-theme']
const theme: Partial<OrgTheme> = themeRaw ? JSON.parse(themeRaw) : {}
const productName = headers['x-tenant-name'] || theme.product_name || 'Outbound CRM'

useHead({
  title: productName,
  titleTemplate: t => t ? `${t} — ${productName}` : productName,
  link: [
    { rel:'preconnect', href:'https://fonts.googleapis.com' },
    {
      rel:'stylesheet',
      href:'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap',
    },
    {
      rel:'stylesheet',
      href:'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/tabler-icons.min.css',
    },
    ...(theme.favicon_url ? [{ rel:'icon', href:theme.favicon_url }] : []),
  ],
})
</script>
