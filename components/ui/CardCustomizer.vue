<template>
  <div class="cc" data-card-customizer>
    <button class="cc-btn" :class="{ active: open }" @click="open = !open" title="Personalizar card">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
      </svg>
      <span class="cc-btn-label">Card</span>
    </button>

    <Transition name="fade">
      <div v-if="open" class="cc-pop">
        <div class="cc-pop-title">Mostrar no card</div>
        <button v-for="f in CARD_FIELDS" :key="f.key" class="cc-opt" @click="toggle(f.key)">
          <span class="cc-check" :class="{ on: prefs[f.key] }">
            <svg v-if="prefs[f.key]" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          {{ f.label }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { CARD_FIELDS } from '~/composables/useCardPrefs'

const { prefs, toggle } = useCardPrefs()
const open = ref(false)

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
function onClickOutside(e: MouseEvent) {
  if (!(e.target as Element)?.closest?.('[data-card-customizer]')) open.value = false
}
</script>

<style scoped>
.cc { position: relative; }
.cc-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-2);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all .12s;
}
.cc-btn:hover, .cc-btn.active { border-color: var(--accent); color: var(--accent); }
.cc-btn-label { line-height: 1; }

.cc-pop {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 120;
  width: 220px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 8px 28px rgba(0,0,0,.16);
  padding: 6px;
}
.cc-pop-title {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--text-3);
  padding: 6px 8px 4px;
}
.cc-opt {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 7px 8px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  color: var(--text-1);
  text-align: left;
  transition: background .1s;
}
.cc-opt:hover { background: var(--bg-subtle); }
.cc-check {
  width: 17px;
  height: 17px;
  border-radius: 5px;
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all .1s;
}
.cc-check.on { background: var(--accent); border-color: var(--accent); }

.fade-enter-active, .fade-leave-active { transition: opacity .12s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
