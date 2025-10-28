import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import connectDB from './mongodb'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        try {
          console.log('🔄 Connecting to database...')
          await connectDB()
          console.log('✅ Database connected')
          
          console.log('🔍 Looking for user:', credentials.email)
          // Try to find user by email OR phone
          const user = await User.findOne({
            $or: [
              { email: credentials.email },
              { phone: credentials.email } // "email" field can contain phone number
            ]
          })
          
          if (!user) {
            console.log('❌ User not found:', credentials.email)
            return null
          }
          
          console.log('✅ User found:', user.email, 'Role:', user.role, 'Type:', user.customerType)
          
          // Check if user can login
          if (!user.canLogin) {
            console.log('❌ User cannot login (phone/walkin customer without login access)')
            return null
          }
          
          // Check if password exists
          if (!user.password) {
            console.log('❌ User has no password (phone/walkin customer)')
            return null
          }
          
          console.log('🔐 Comparing password...')
          const isPasswordValid = await user.comparePassword(credentials.password)
          console.log('🔐 Password valid:', isPasswordValid)
          
          if (!isPasswordValid) {
            console.log('❌ Invalid password')
            return null
          }

          console.log('✅ Authentication successful!')
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar
          }
        } catch (error) {
          console.error('❌ Auth error:', error)
          return null
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role
        token.avatar = user.avatar
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.avatar = token.avatar as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          await connectDB()
          
          const existingUser = await User.findOne({ email: user.email })
          if (!existingUser) {
            await User.create({
              name: user.name,
              email: user.email,
              password: '', // Google users don't need password
              role: 'user',
              avatar: user.image,
              emailVerified: true
            })
          }
        } catch (error) {
          console.error('Google sign in error:', error)
          return false
        }
      }
      return true
    }
  },
  pages: {
    signIn: '/auth/signin',
    // signUp: '/auth/signup', // Not supported in NextAuth v4
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
