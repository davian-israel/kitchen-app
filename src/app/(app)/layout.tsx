import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { CartProvider } from '@/contexts/CartContext'
import Cart from '@/components/cart/Cart'
import ResponsiveHeader from '@/components/navigation/ResponsiveHeader'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <ResponsiveHeader />
        <main className="flex-1">
          {children}
        </main>
        <Cart />
      </div>
    </CartProvider>
  )
}