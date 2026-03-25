export type SectionId =
  | 'overview'
  | 'users'
  | 'customers'
  | 'services'
  | 'products'
  | 'sales'
  | 'orders'
  | 'cash'

export type NavItem = {
  id: SectionId
  label: string
  icon: any
}
