import { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from './db'
import { verifyPassword } from './auth'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(db),
  trustHost: true,
  debug: true, // Enable debug mode to see more logs
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('🔍 NextAuth authorize called with:', { 
          email: credentials?.email, 
          hasPassword: !!credentials?.password 
        })
        
        try {
          const { email, password } = loginSchema.parse(credentials)
          console.log('✅ Zod validation passed for:', email)

          const user = await db.user.findUnique({
            where: { email },
          })

          if (!user) {
            console.log('❌ User not found:', email)
            return null
          }

          if (user.status === 'DISABLED') {
            console.log('❌ User disabled:', email)
            return null
          }

          console.log('✅ User found:', { id: user.id, email: user.email, role: user.role, status: user.status })

          const isValidPassword = await verifyPassword(password, user.passwordHash)
          console.log('🔐 Password verification result:', isValidPassword)
          
          if (!isValidPassword) {
            console.log('❌ Password verification failed for:', email)
            return null
          }

          // Log user activity
          await db.userActivityLog.create({
            data: {
              userId: user.id,
              action: 'LOGIN',
              details: { method: 'credentials' },
            },
          })

          const authResult = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }

          console.log('✅ NextAuth returning user:', authResult)
          return authResult
        } catch (error) {
          console.error('❌ Authentication error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/register',
  },
  session: {
    strategy: 'jwt',
  },
}