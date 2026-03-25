<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables'
import DashboardSidebar from '@/components/dashboard/layout/DashboardSidebar.vue'
import DashboardTopbar from '@/components/dashboard/layout/DashboardTopbar.vue'
import DashboardMobileFooter from '@/components/dashboard/layout/DashboardMobileFooter.vue'
import DashboardOverviewSection from '@/components/dashboard/sections/DashboardOverviewSection.vue'
import UsersSection from '@/components/users/sections/UsersSection.vue'
import CustomersSection from '@/components/customers/sections/CustomersSection.vue'
import ProductsSection from '@/components/products/sections/ProductsSection.vue'
import ServicesSection from '@/components/services/sections/ServicesSection.vue'
import SalesSection from '@/components/sales/sections/SalesSection.vue'
import OrdersSection from '@/components/orders/sections/OrdersSection.vue'
import CashSection from '@/components/cash/sections/CashSection.vue'
import ModulePlaceholderSection from '@/components/modules/sections/ModulePlaceholderSection.vue'
import type { NavItem, SectionId } from '@/types/dashboard'
import { LucideBlocks, LucideBringToFront, LucideDollarSign, LucideLayoutDashboard, LucidePackage, LucideShoppingBag, LucideUserRound, LucideUserStar } from '@lucide/vue'

const router = useRouter()
const { user, logout } = useAuth()

const activeSection = ref<SectionId>('overview')

const navItems: NavItem[] = [
  { id: 'overview', label: 'Visão Geral', icon: LucideLayoutDashboard },
  { id: 'users', label: 'Usuários', icon: LucideUserRound },
  { id: 'customers', label: 'Clientes', icon: LucideUserStar },
  { id: 'services', label: 'Serviços', icon: LucideBlocks },
  { id: 'products', label: 'Produtos', icon: LucidePackage },
  { id: 'sales', label: 'Vendas', icon: LucideShoppingBag },
  { id: 'orders', label: 'Ordens de Serviço', icon: LucideBringToFront },
  { id: 'cash', label: 'Caixa', icon: LucideDollarSign },
]

const mobileNavItems: NavItem[] = [
  { id: 'overview', label: 'Início', icon: LucideLayoutDashboard },
  { id: 'customers', label: 'Clientes', icon: LucideUserStar },
  { id: 'sales', label: 'Vendas', icon: LucideShoppingBag },
  { id: 'services', label: 'Serviços', icon: LucideBlocks }
]

const dashboardModules = computed(() => [
  { title: 'Usuários', endpoint: '/api/v1/funcionarios', status: 'ativo' },
  { title: 'Clientes', endpoint: '/api/v1/clientes', status: 'ativo' },
  { title: 'Serviços', endpoint: '/api/v1/servicos', status: 'ativo' },
  { title: 'Produtos', endpoint: '/api/v1/produtos', status: 'ativo' },
  { title: 'Vendas', endpoint: '/api/v1/vendas', status: 'ativo' },
  { title: 'Ordens Serviço', endpoint: '/api/v1/ordens-servico', status: 'ativo' },
  { title: 'Caixa', endpoint: '/api/v1/caixas', status: 'ativo' },
])

const sectionTitle = computed(() => {
  const current = navItems.find((item) => item.id === activeSection.value)
  return current?.label ?? 'Visão Geral'
})

const sectionSubtitle = computed(() => {
  const map: Record<SectionId, string> = {
    overview: 'Resumo consolidado dos módulos da API',
    users: 'Fluxo de cadastro de usuários (funcionários)',
    customers: 'Fluxo de cadastro e consulta de clientes',
    services: 'Gerencie serviços cadastrados na API',
    products: 'Gerencie catálogo e produtos',
    sales: 'Visão de vendas e pagamentos',
    orders: 'Ordens de serviço e andamento',
    cash: 'Caixas e movimentos financeiros',
  }

  return map[activeSection.value]
})

const activeApiRoute = computed(() => {
  const map: Record<SectionId, string> = {
    overview: 'GET /api/v1/*',
    users: 'POST /api/v1/funcionarios',
    customers: 'POST /api/v1/clientes',
    services: 'GET|POST /api/v1/servicos',
    products: 'GET|POST /api/v1/produtos',
    sales: 'GET|POST /api/v1/vendas',
    orders: 'GET|POST /api/v1/ordens-servico',
    cash: 'GET|POST /api/v1/caixas',
  }

  return map[activeSection.value]
})

const changeSection = (section: SectionId): void => {
  activeSection.value = section
}

const handleLogout = async (): Promise<void> => {
  await logout()
  router.push('/login')
}
</script>

<template>
  <div class="dashboard-shell">
    <DashboardSidebar :items="navItems" :active-section="activeSection" @change-section="changeSection" @logout="handleLogout" />

    <main class="dashboard-main">
      <DashboardTopbar
        :title="sectionTitle"
        :subtitle="sectionSubtitle"
        :user-name="user?.name"
        :user-role="user?.role"
      />

      <DashboardOverviewSection v-if="activeSection === 'overview'" :modules="dashboardModules" />
      <UsersSection v-else-if="activeSection === 'users'" />
      <CustomersSection v-else-if="activeSection === 'customers'" />
      <ServicesSection v-else-if="activeSection === 'services'" />
      <ProductsSection v-else-if="activeSection === 'products'" />
      <SalesSection v-else-if="activeSection === 'sales'" />
      <OrdersSection v-else-if="activeSection === 'orders'" />
      <CashSection v-else-if="activeSection === 'cash'" />
      <ModulePlaceholderSection v-else :title="sectionTitle" />
    </main>

    <DashboardMobileFooter :items="mobileNavItems" :active-section="activeSection" @change-section="changeSection" />
  </div>
</template>

<style scoped>
.dashboard-shell {
  display: flex;
  min-height: 100dvh;
  background: #f3f5fb;
  color: #111827;
}

.dashboard-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
