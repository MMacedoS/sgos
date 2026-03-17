<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables'

const router = useRouter()
const { user, logout } = useAuth()
const activeSection = ref<'overview' | 'orders' | 'products' | 'profile'>('overview')

type NavItem = {
  id: 'overview' | 'orders' | 'products' | 'profile'
  label: string
  icon: string
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Visão Geral', icon: '◉' },
  { id: 'orders', label: 'Pedidos', icon: '◎' },
  { id: 'products', label: 'Produtos', icon: '◌' },
  { id: 'profile', label: 'Perfil', icon: '◍' },
]

const stats = computed(() => [
  { title: 'Faturamento do Dia', value: 'R$ 8.420,00', trend: '+12,4%', positive: true },
  { title: 'Ordens em Aberto', value: '18', trend: '+4', positive: true },
  { title: 'Clientes Ativos', value: '124', trend: '+7,8%', positive: true },
  { title: 'Ticket Médio', value: 'R$ 186,30', trend: '-2,1%', positive: false },
])

const barData = [48, 64, 51, 73, 66, 82, 74]
const maxBar = Math.max(...barData)
const barHeights = computed(() => barData.map((item) => Math.round((item / maxBar) * 100)))

const ringProgress = computed(() => {
  const done = 74
  const total = 100
  const circumference = 2 * Math.PI * 52
  const filled = (done / total) * circumference

  return {
    done,
    total,
    circumference,
    offset: circumference - filled,
  }
})

const sectionTitle = computed(() => {
  const current = navItems.find((item) => item.id === activeSection.value)

  return current?.label ?? 'Visão Geral'
})

const sectionSubtitle = computed(() => {
  const map = {
    overview: 'Resumo em tempo real das operações',
    orders: 'Acompanhe ordens e status de atendimento',
    products: 'Visão dos itens com maior movimentação',
    profile: 'Dados da sua conta e permissões',
  }

  return map[activeSection.value]
})

const changeSection = (section: NavItem['id']): void => {
  activeSection.value = section
}

const handleLogout = async (): Promise<void> => {
  await logout()
  router.push('/login')
}
</script>

<template>
  <div class="dashboard-shell">
    <aside class="sidebar desktop-only">
      <div class="brand">
        <h1>SGOS</h1>
        <p>Painel Operacional</p>
      </div>

      <nav class="side-nav">
        <button
          v-for="item in navItems"
          :key="item.id"
          type="button"
          class="nav-item"
          :class="{ active: activeSection === item.id }"
          @click="changeSection(item.id)"
        >
          <span class="icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <button type="button" class="btn-logout side-logout" @click="handleLogout">Sair</button>
    </aside>

    <main class="dashboard-main">
      <header class="topbar">
        <div>
          <h2>{{ sectionTitle }}</h2>
          <p>{{ sectionSubtitle }}</p>
        </div>

        <div class="topbar-user">
          <div class="avatar">{{ user?.name?.charAt(0) || 'U' }}</div>
          <div class="user-meta">
            <strong>{{ user?.name }}</strong>
            <small>{{ user?.role }}</small>
          </div>
        </div>
      </header>

      <section v-show="activeSection === 'overview'" class="content-section">
        <div class="stats-grid">
          <article v-for="item in stats" :key="item.title" class="stat-card">
            <p class="stat-title">{{ item.title }}</p>
            <h3>{{ item.value }}</h3>
            <span class="trend" :class="item.positive ? 'up' : 'down'">{{ item.trend }}</span>
          </article>
        </div>

        <div class="charts-grid">
          <article class="panel">
            <header>
              <h3>Vendas da Semana</h3>
              <span>Últimos 7 dias</span>
            </header>
            <div class="bars">
              <div v-for="(height, index) in barHeights" :key="index" class="bar-col">
                <div class="bar" :style="{ height: `${height}%` }" />
              </div>
            </div>
            <div class="bar-labels">
              <span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span>
            </div>
          </article>

          <article class="panel ring-panel">
            <header>
              <h3>Meta Mensal</h3>
              <span>{{ ringProgress.done }}%</span>
            </header>
            <div class="ring-wrap">
              <svg viewBox="0 0 140 140" class="ring-chart">
                <circle cx="70" cy="70" r="52" class="ring-bg" />
                <circle
                  cx="70"
                  cy="70"
                  r="52"
                  class="ring-value"
                  :stroke-dasharray="ringProgress.circumference"
                  :stroke-dashoffset="ringProgress.offset"
                />
              </svg>
              <strong>{{ ringProgress.done }}%</strong>
            </div>
            <p class="muted">Ritmo acima do esperado para o período atual.</p>
          </article>
        </div>

        <article class="panel">
          <header>
            <h3>Atividades Recentes</h3>
            <span>Tempo real</span>
          </header>
          <ul class="activity-list">
            <li>
              <strong>OS #5482 finalizada</strong>
              <span>Cliente Mariana Costa • há 5 min</span>
            </li>
            <li>
              <strong>Pagamento confirmado</strong>
              <span>Venda #8831 • há 12 min</span>
            </li>
            <li>
              <strong>Produto com baixo estoque</strong>
              <span>Shampoo Pro 300ml • há 18 min</span>
            </li>
          </ul>
        </article>
      </section>

      <section v-show="activeSection === 'orders'" class="content-section">
        <article class="panel">
          <header>
            <h3>Pedidos em Destaque</h3>
            <span>Atualizado agora</span>
          </header>
          <div class="table-like">
            <div class="row head"><span>ID</span><span>Cliente</span><span>Status</span><span>Valor</span></div>
            <div class="row"><span>#5482</span><span>Mariana Costa</span><span class="chip open">Em andamento</span><span>R$ 220,00</span></div>
            <div class="row"><span>#5481</span><span>Lucas Silva</span><span class="chip done">Concluído</span><span>R$ 180,00</span></div>
            <div class="row"><span>#5479</span><span>Ana Prado</span><span class="chip wait">Aguardando</span><span>R$ 95,00</span></div>
          </div>
        </article>
      </section>

      <section v-show="activeSection === 'products'" class="content-section">
        <article class="panel">
          <header>
            <h3>Top Produtos</h3>
            <span>Últimos 30 dias</span>
          </header>
          <div class="product-list">
            <div class="product-row"><span>Escova Premium</span><strong>312 vendas</strong></div>
            <div class="product-row"><span>Kit Hidratação</span><strong>271 vendas</strong></div>
            <div class="product-row"><span>Shampoo Pro 300ml</span><strong>198 vendas</strong></div>
            <div class="product-row"><span>Máscara Reparadora</span><strong>153 vendas</strong></div>
          </div>
        </article>
      </section>

      <section v-show="activeSection === 'profile'" class="content-section">
        <article class="panel">
          <header>
            <h3>Perfil do Usuário</h3>
            <span>Conta autenticada</span>
          </header>
          <div class="profile-grid">
            <div><label>Nome</label><strong>{{ user?.name }}</strong></div>
            <div><label>Email</label><strong>{{ user?.email }}</strong></div>
            <div><label>Perfil</label><strong>{{ user?.role }}</strong></div>
            <div><label>Status</label><strong>{{ user?.is_active ? 'Ativo' : 'Inativo' }}</strong></div>
          </div>
          <button type="button" class="btn-logout mobile-only" @click="handleLogout">Sair</button>
        </article>
      </section>
    </main>

    <footer class="mobile-footer mobile-only">
      <button
        v-for="item in navItems"
        :key="item.id"
        type="button"
        class="footer-item"
        :class="{ active: activeSection === item.id }"
        @click="changeSection(item.id)"
      >
        <span>{{ item.icon }}</span>
        <small>{{ item.label }}</small>
      </button>
    </footer>
  </div>
</template>

<style scoped>
.dashboard-shell {
  position: relative;
  display: flex;
  min-height: 100dvh;
  background: #f3f5fb;
  color: #111827;
}

.sidebar {
  width: 260px;
  background: linear-gradient(180deg, #4f46e5 0%, #3730a3 100%);
  color: #fff;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.brand h1 {
  margin: 0;
  font-size: 1.4rem;
}

.brand p {
  margin: 0.2rem 0 0;
  opacity: 0.8;
  font-size: 0.9rem;
}

.side-nav {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.nav-item {
  border: 0;
  background: transparent;
  color: #fff;
  text-align: left;
  border-radius: 10px;
  padding: 0.75rem 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.nav-item.active,
.nav-item:hover {
  background: rgba(255, 255, 255, 0.16);
}

.icon {
  width: 24px;
  text-align: center;
}

.dashboard-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

.topbar {
  padding: 1.2rem 1.4rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.topbar h2 {
  margin: 0;
  font-size: 1.3rem;
}

.topbar p {
  margin: 0.2rem 0 0;
  color: #6b7280;
}

.topbar-user {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  background: #4f46e5;
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 700;
}

.user-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.user-meta small {
  color: #6b7280;
}

.content-section {
  padding: 1.2rem;
  display: grid;
  gap: 1rem;
  padding-bottom: 6rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.9rem;
}

.stat-card {
  background: #fff;
  border-radius: 14px;
  padding: 1rem;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.stat-title {
  color: #6b7280;
  font-size: 0.85rem;
  margin: 0;
}

.stat-card h3 {
  margin: 0.45rem 0;
  font-size: 1.3rem;
}

.trend {
  font-size: 0.8rem;
  font-weight: 700;
}

.trend.up {
  color: #059669;
}

.trend.down {
  color: #dc2626;
}

.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
}

.panel {
  background: #fff;
  border-radius: 14px;
  padding: 1rem;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.panel header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.9rem;
}

.panel header h3 {
  margin: 0;
}

.panel header span,
.muted {
  color: #6b7280;
  font-size: 0.86rem;
}

.bars {
  height: 210px;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.55rem;
  align-items: end;
}

.bar-col {
  display: flex;
  align-items: end;
  height: 100%;
}

.bar {
  width: 100%;
  background: linear-gradient(180deg, #6366f1 0%, #4338ca 100%);
  border-radius: 10px 10px 4px 4px;
}

.bar-labels {
  margin-top: 0.6rem;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  color: #6b7280;
  font-size: 0.8rem;
}

.ring-panel {
  display: flex;
  flex-direction: column;
}

.ring-wrap {
  position: relative;
  width: 170px;
  height: 170px;
  margin: 0.4rem auto;
  display: grid;
  place-items: center;
}

.ring-wrap strong {
  position: absolute;
  font-size: 1.4rem;
}

.ring-chart {
  width: 100%;
  height: 100%;
}

.ring-bg {
  fill: none;
  stroke: #e5e7eb;
  stroke-width: 12;
}

.ring-value {
  fill: none;
  stroke: #4f46e5;
  stroke-width: 12;
  stroke-linecap: round;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
}

.activity-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.85rem;
}

.activity-list li {
  display: grid;
  gap: 0.2rem;
  padding: 0.7rem;
  border-radius: 10px;
  background: #f8fafc;
}

.activity-list span {
  color: #6b7280;
  font-size: 0.85rem;
}

.table-like {
  display: grid;
  gap: 0.55rem;
}

.row {
  display: grid;
  grid-template-columns: 80px 1fr 150px 120px;
  gap: 0.5rem;
  padding: 0.7rem;
  border-radius: 10px;
  background: #f8fafc;
  align-items: center;
}

.row.head {
  background: #eef2ff;
  font-weight: 700;
}

.chip {
  justify-self: start;
  padding: 0.24rem 0.6rem;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
}

.chip.open {
  background: #dbeafe;
  color: #1d4ed8;
}

.chip.done {
  background: #dcfce7;
  color: #166534;
}

.chip.wait {
  background: #fef3c7;
  color: #92400e;
}

.product-list {
  display: grid;
  gap: 0.6rem;
}

.product-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  padding: 0.75rem;
  border-radius: 10px;
}

.profile-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.profile-grid div {
  display: grid;
  gap: 0.2rem;
  background: #f8fafc;
  padding: 0.8rem;
  border-radius: 10px;
}

.profile-grid label {
  font-size: 0.8rem;
  color: #6b7280;
}

.btn-logout {
  border: 0;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  font-weight: 700;
  cursor: pointer;
  background: #ef4444;
  color: #fff;
}

.side-logout {
  margin-top: auto;
}

.mobile-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 72px;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  z-index: 30;
}

.footer-item {
  border: 0;
  background: transparent;
  display: grid;
  place-items: center;
  color: #6b7280;
  cursor: pointer;
  font-size: 1rem;
}

.footer-item.active {
  color: #4338ca;
}

.footer-item small {
  font-size: 0.68rem;
}

.mobile-only {
  display: none;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .row {
    grid-template-columns: 68px 1fr 120px 90px;
  }
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: inline-flex;
  }

  .dashboard-main {
    width: 100%;
    min-height: 100dvh;
  }

  .topbar {
    position: sticky;
    top: 0;
    z-index: 25;
    padding: 1rem;
  }

  .topbar-user {
    display: none;
  }

  .content-section {
    padding: 1rem;
    padding-bottom: 6.2rem;
  }

  .stats-grid,
  .profile-grid {
    grid-template-columns: 1fr;
  }

  .ring-wrap {
    width: 150px;
    height: 150px;
  }

  .row {
    grid-template-columns: 1fr;
    gap: 0.35rem;
  }

  .row.head {
    display: none;
  }
}
</style>
