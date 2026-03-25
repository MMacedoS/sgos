export type SectionId =
  | 'overview'
  | 'users'
  | 'customers'
  | 'services'
  | 'products'
  | 'stocks'
  | 'sales'
  | 'orders'
  | 'cash'

export type NavItem = {
  id: SectionId
  label: string
  icon: string
}
