<script setup lang="ts">
import type { SectionId } from '@/types/dashboard'

defineProps<{
  modules: Array<{ id: SectionId; title: string; status: string }>
}>()

const emit = defineEmits<{
  (event: 'open-section', section: SectionId): void
}>()
</script>

<template>
  <section class="content-section">
    <div class="stats-grid">
      <article
        v-for="module in modules"
        :key="module.title"
        class="stat-card"
        role="button"
        tabindex="0"
        @click="emit('open-section', module.id)"
        @keydown.enter="emit('open-section', module.id)"
        @keydown.space.prevent="emit('open-section', module.id)"
      >
        <p class="stat-title">{{ module.title }}</p>
        <span class="tag">{{ module.status }}</span>
      </article>
    </div>
  </section>
</template>

<style scoped>
.content-section {
  padding: 1rem;
  padding-bottom: 6rem;
  display: grid;
  gap: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 0.85rem;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
  display: grid;
  gap: 0.25rem;
  cursor: pointer;
  transition: transform 0.14s ease, box-shadow 0.14s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.1);
}

.stat-card:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.stat-title {
  margin: 0;
  color: #6b7280;
  font-size: 0.85rem;
}

.tag {
  width: fit-content;
  padding: 0.18rem 0.45rem;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 700;
  color: #166534;
  background: #dcfce7;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .content-section {
    padding-bottom: 5.8rem;
  }
}
</style>
