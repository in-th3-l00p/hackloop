export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-12">
      {children}
    </div>
  )
}
