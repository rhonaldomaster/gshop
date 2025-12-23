import 'next-auth'

declare module 'next-auth' {
  interface User {
    accessToken?: string
    seller?: any
  }

  interface Session {
    accessToken?: string
    seller?: any
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    seller?: any
  }
}