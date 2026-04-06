<script setup lang="ts">
withDefaults(defineProps<{
  visible: boolean
  title?: string
  description?: string
}>(), {
  title: 'Processando dados',
  description: 'Aguarde alguns instantes enquanto concluimos a solicitacao.',
})
</script>

<template>
  <transition name="overlay-fade">
    <div
      v-if="visible"
      class="global-loading-overlay"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div class="global-loading-card">
        <span class="global-loading-spinner" aria-hidden="true"></span>

        <div class="global-loading-copy">
          <strong>{{ title }}</strong>
          <p>{{ description }}</p>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.global-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.48);
  backdrop-filter: blur(4px);
}

.global-loading-card {
  width: min(100%, 26rem);
  display: flex;
  align-items: center;
  gap: 1rem;
  border-radius: 20px;
  border: 1px solid rgba(224, 231, 255, 0.7);
  background: linear-gradient(135deg, #ffffff, #eef2ff);
  padding: 1rem 1.1rem;
  box-shadow: 0 20px 44px rgba(15, 23, 42, 0.18);
}

.global-loading-spinner {
  width: 2.4rem;
  height: 2.4rem;
  flex-shrink: 0;
  border-radius: 999px;
  border: 3px solid #c7d2fe;
  border-top-color: #4f46e5;
  animation: overlay-spin 0.8s linear infinite;
}

.global-loading-copy {
  display: grid;
  gap: 0.2rem;
}

.global-loading-copy strong {
  color: #0f172a;
  font-size: 0.98rem;
}

.global-loading-copy p {
  margin: 0;
  color: #475569;
  font-size: 0.88rem;
  line-height: 1.45;
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.18s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

@keyframes overlay-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .global-loading-card {
    align-items: flex-start;
    padding: 0.95rem;
  }

  .global-loading-copy strong {
    font-size: 0.92rem;
  }

  .global-loading-copy p {
    font-size: 0.82rem;
  }
}
</style>
