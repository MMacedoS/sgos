<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
  userName?: string
  userRole?: string
}>()
</script>

<template>
  <header class="topbar">
    <div>
      <h2>{{ title }}</h2>
      <p>{{ subtitle }}</p>
    </div>

    <div class="topbar-user">
      <div class="avatar">{{ userName?.charAt(0) || 'U' }}</div>
      <div class="user-meta">
        <strong>{{ userName }}</strong>
        <small>{{ userRole }}</small>
      </div>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 1.3rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.topbar h2 {
  margin: 0;
}

.topbar p {
  margin: 0.2rem 0;
  color: #6b7280;
}

.endpoint {
  color: #4f46e5;
  font-weight: 700;
}

.topbar-user {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #4f46e5;
  color: #fff;
  font-weight: 700;
}

.user-meta {
  display: grid;
  line-height: 1.1;
}

.user-meta small {
  color: #6b7280;
}

@media (max-width: 768px) {
  .topbar-user {
    display: none;
  }
}
</style>
