<template>
  <Teleport to="body">
    <Transition name="tour-overlay">
      <div v-if="visible" class="tour-backdrop" @click.self="skip">
        <div class="tour-card">
          <!-- Step dots -->
          <div class="tour-dots">
            <span
              v-for="i in STEPS.length" :key="i"
              class="tour-dot"
              :class="{ active: i - 1 === step }"
            />
          </div>

          <!-- Content -->
          <div class="tour-title">{{ STEPS[step].title }}</div>
          <div class="tour-body" v-html="STEPS[step].body" />

          <!-- Actions -->
          <div class="tour-actions">
            <button class="tour-skip" @click="skip">Pular tour</button>
            <button class="tour-next" @click="next">
              {{ step === STEPS.length - 1 ? 'Começar agora' : 'Avançar →' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const TOUR_KEY = 'prospecta_tour_done'

const STEPS = [
  {
    title: 'Bem-vindo ao Prospecta!',
    body: `O Prospecta organiza toda a sua prospecção B2B em um so lugar.<br><br>
      Voce gerencia seu <strong>pipeline de leads</strong>, registra seus
      <strong>contatos diários</strong> e acompanha se está no ritmo certo para bater a meta.`,
  },
  {
    title: 'Seu pipeline de leads',
    body: `Em <strong>Pipeline</strong> você vê todos os seus leads e avança cada um pelo funil:<br><br>
      <span style="color:#193497">Contato</span> &gt;
      <span style="color:#7c3aed">Reunião</span> &gt;
      <span style="color:#d97706">Proposta</span> &gt;
      <span style="color:#16a34a">Fechamento</span><br><br>
      Arraste para mudar de status ou abra o lead para ver o histórico completo.`,
  },
  {
    title: 'Os 4 números que importam',
    body: `Todo dia você registra 4 métricas em <strong>Meu Dia</strong>:<br><br>
      <strong style="color:#193497">CE</strong>: Contato Efetivo, o decisor atendeu e conversou.<br>
      <strong style="color:#7c3aed">RM</strong>: Reunião Marcada, lead aceitou agendar.<br>
      <strong style="color:#0d9488">RR</strong>: Reunião Realizada, a reunião aconteceu de fato.<br>
      <strong style="color:#d97706">FR</strong>: Fechamento, contrato assinado.<br><br>
      Esses 4 números mostram exatamente onde está o seu gargalo.`,
  },
  {
    title: 'Suas metas em números',
    body: `Em <strong>Metas e Ritmo</strong> você configura sua meta de faturamento e ticket médio.<br><br>
      O sistema calcula automaticamente <em>quantos contatos diários você precisa fazer</em>
      para chegar lá. É a matemática reversa do funil.<br><br>
      Configure agora para ver seus números personalizados.`,
  },
]

const visible = ref(false)
const step = ref(0)

onMounted(() => {
  if (!localStorage.getItem(TOUR_KEY)) {
    visible.value = true
  }
})

function next() {
  if (step.value < STEPS.length - 1) {
    step.value++
  } else {
    finish()
  }
}

function skip() {
  finish()
}

function finish() {
  localStorage.setItem(TOUR_KEY, '1')
  visible.value = false
}
</script>

<style scoped>
.tour-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.tour-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px 28px 24px;
  max-width: 440px;
  width: 100%;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.tour-dots {
  display: flex;
  gap: 6px;
  margin-bottom: 24px;
}

.tour-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #e2e8f0;
  transition: background 0.2s, transform 0.2s;
}

.tour-dot.active {
  background: #193497;
  transform: scale(1.25);
}

.tour-title {
  font-size: 20px;
  font-weight: 600;
  color: #282828;
  margin-bottom: 14px;
  line-height: 1.3;
}

.tour-body {
  font-size: 14px;
  color: #475569;
  line-height: 1.7;
  margin-bottom: 28px;
}

.tour-actions {
  display: flex;
  gap: 10px;
  width: 100%;
}

.tour-skip {
  flex: 1;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.1s;
}

.tour-skip:hover {
  background: #f9f6ef;
}

.tour-next {
  flex: 2;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background: #193497;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.1s;
}

.tour-next:hover {
  background: #0f2480;
}

.tour-overlay-enter-active,
.tour-overlay-leave-active {
  transition: opacity 0.2s ease;
}

.tour-overlay-enter-from,
.tour-overlay-leave-to {
  opacity: 0;
}
</style>
