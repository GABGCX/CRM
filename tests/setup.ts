// Disponibiliza os helpers do Vue como globais nos testes,
// imitando os auto-imports do Nuxt (computed, ref, watch, unref, etc.).
import * as vue from 'vue'

const AUTO_IMPORTS = [
  'computed', 'ref', 'reactive', 'readonly', 'shallowRef', 'shallowReactive',
  'watch', 'watchEffect', 'unref', 'isRef', 'toRef', 'toRefs', 'toValue',
  'nextTick', 'onMounted', 'onUnmounted', 'provide', 'inject',
] as const

for (const key of AUTO_IMPORTS) {
  if (key in vue) (globalThis as any)[key] = (vue as any)[key]
}
