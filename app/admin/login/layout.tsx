export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Отдельный layout для страницы login без AdminLayout
  return <>{children}</>
}
