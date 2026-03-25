<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <section class="content-section">
    <article class="panel">
      <header>
        <h3>{{ title }}</h3>
        <span>Módulo mapeado no menu</span>
      </header>
      <p class="muted">
        Estrutura pronta no menu conforme API. O próximo passo é implementar CRUD desta seção com a
        mesma arquitetura aplicada em Usuários e Clientes.
      </p>
    </article>
  </section>
</template>

<style scoped>
.content-section {
  padding: 1rem;
  padding-bottom: 6rem;
  display: grid;
  gap: 1rem;
}

.panel {
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
}

.panel header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.panel header h3 {
  margin: 0;
}

.panel header span,
.muted {
  color: #6b7280;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .content-section {
    padding-bottom: 5.8rem;
  }
}
</style>
