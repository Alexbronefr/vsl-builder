export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-4 text-xl">Лендинг не найден</p>
        <p className="mt-2 text-gray-400">
          Возможно, он был удалён или ещё не опубликован
        </p>
      </div>
    </div>
  )
}
