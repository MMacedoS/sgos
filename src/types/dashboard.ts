export type SectionId =
  | 'overview'
  | 'users'
  | 'customers'
  | 'services'
  | 'products'
  | 'sales'
  | 'orders'
  | 'cash'
  | 'settings'
  | 'profile'
  | 'billing'
  | 'reports'
  | 'analytics'



export type NavItem = {
  id?: SectionId
  label: string
  icon: any
  children?: NavItem[]
}
