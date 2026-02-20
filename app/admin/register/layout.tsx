export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Отдельный layout для страницы register без AdminLayout
  return <>{children}</>
}
