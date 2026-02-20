export default function LanderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Лендинг рендерится полностью на сервере, layout не нужен
  return <>{children}</>
}
