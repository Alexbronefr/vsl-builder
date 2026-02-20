import { AdminLayout as AdminLayoutComponent } from '@/components/admin/admin-layout'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Middleware уже проверяет авторизацию и редиректит на /admin/login если нужно
  // Login и register имеют свои layout'ы, которые переопределяют этот layout
  // Для остальных страниц применяем AdminLayout
  return <AdminLayoutComponent>{children}</AdminLayoutComponent>
}
