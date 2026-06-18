const isDark = ref(false)

export const useDarkMode = () => {
  function init() {
    if (!import.meta.client) return
    // Tema claro e o padrao; so vai pro escuro se o usuario escolheu explicitamente.
    const stored = localStorage.getItem('color-scheme')
    isDark.value = stored === 'dark'
    apply(isDark.value)
  }

  function apply(dark: boolean) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }

  function toggle() {
    isDark.value = !isDark.value
    localStorage.setItem('color-scheme', isDark.value ? 'dark' : 'light')
    apply(isDark.value)
  }

  return { isDark, init, toggle }
}
