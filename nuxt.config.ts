export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  app: {
    head: {
      title: 'Prospecta',
      meta: [
        // viewport-fit=cover habilita as safe-area-inset (notch/home indicator)
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#0b63ff' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Prospecta' },
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'apple-touch-icon', href: '/icon.svg' },
      ],
    },
    // Transicao de pagina global (fade + rise suave), classes em main.css
    pageTransition: { name: 'page', mode: 'out-in' },
  },

  modules: [
    '@nuxtjs/supabase',
    '@nuxtjs/tailwindcss',
    '@formkit/auto-animate/nuxt',
  ],

  // Morph nativo entre rotas onde suportado (degrada pro pageTransition)
  experimental: {
    viewTransition: true,
  },

  // @nuxtjs/supabase config
  // Rotas que NÃO precisam de autenticação
  supabase: {
    types: '~/types/database.ts',
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

  // Security headers for all routes
  routeRules: {
    '/**': {
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self' data:",
          "connect-src 'self' *.supabase.co wss://*.supabase.co",
          "frame-ancestors 'none'",
        ].join('; '),
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
