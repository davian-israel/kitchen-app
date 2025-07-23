import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { CartProvider } from '@/contexts/CartContext'
import Cart from '@/components/cart/Cart'

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
      <div className="relative">
        {children}
        <Cart />
      </div>
    </CartProvider>
  )
}