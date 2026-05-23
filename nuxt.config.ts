export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/supabase',
    '@nuxtjs/tailwindcss',
  ],

  // @nuxtjs/supabase config
  // Rotas que NÃO precisam de autenticação
  supabase: {
    redirect: true,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/login', '/register'],
    },
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },

  // CSS global
  css: ['~/assets/css/main.css'],

  // Auto-imports — composables, utils
  imports: {
    dirs: ['composables', 'utils'],
  },

  // Runtime config (vars públicas e privadas)
  runtimeConfig: {
    // Privadas — só no servidor
    supabase: {
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    // Públicas — expostas ao cliente
    public: {
      appDomain: process.env.NUXT_PUBLIC_APP_DOMAIN || 'crm.io',
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000',
      supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_KEY,
      },
    },
  },

  typescript: {
    strict: true,
    typeCheck: false, // rodar separado com npm run type-check
  },

  // Tailwind
  tailwindcss: {
    configPath: 'tailwind.config.ts',
  },
})
