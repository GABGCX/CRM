const isDark = ref(false)

export const useDarkMode = () => {
  function init() {
    if (!import.meta.client) return
    const stored = localStorage.getItem('color-scheme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    isDark.value = stored ? stored === 'dark' : prefersDark
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
