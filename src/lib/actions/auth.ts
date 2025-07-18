'use server'

import { z } from 'zod'
import { signIn } from '@/lib/auth'
import { hashPassword } from '@/lib/auth'
import { createUser, getUserByEmail, logUserActivity } from '@/lib/db-utils'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function registerUser(prevState: any, formData: FormData) {
  const validatedFields = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields. Please check your input.',
    }
  }

  const { name, email, password } = validatedFields.data

  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return {
        message: 'User with this email already exists',
      }
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password)
    const user = await createUser({
      name,
      email,
      passwordHash,
      role: 'CUSTOMER',
    })

    // Log the registration activity
    const headersList = headers()
    const userAgent = headersList.get('user-agent') || undefined
    const forwardedFor = headersList.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : undefined

    await logUserActivity(
      user.id,
      'USER_REGISTERED',
      { email, name },
      ipAddress,
      userAgent
    )

    // Automatically sign in the user after registration
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/dashboard',
    })
  } catch (error) {
    console.error('Registration error:', error)
    return {
      message: 'An error occurred during registration. Please try again.',
    }
  }
}

export async function loginUser(prevState: any, formData: FormData) {
  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid fields. Please check your input.',
    }
  }

  const { email, password } = validatedFields.data

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/dashboard',
    })
  } catch (error: any) {
    if (error?.type === 'CredentialsSignin') {
      return {
        message: 'Invalid credentials. Please check your email and password.',
      }
    }
    throw error
  }
}