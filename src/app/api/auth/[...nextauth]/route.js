import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectMongoDB } from "../../../../../lib/mongodb";
import User from "../../../../../models/user";
import bcrypt from 'bcryptjs'

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {},
      async authorize(credentials) {
        const { email, password } = credentials;

        try {
          await connectMongoDB();
          const user = await User.findOne({ email });

          if (!user) {
            throw new Error("ไม่พบผู้ใช้งาน")
          }

          const passwordMatch = await bcrypt.compare(password, user.password);

          if (!passwordMatch) {
            throw new Error("รหัสผ่านไม่ถูกต้อง")
          }

          return user; // ✅ คืน user ทุกคนไม่ว่า user หรือ admin

        } catch (error) {
          throw new Error(error.message || "เกิดข้อผิดพลาดในระบบ")
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login" // หน้าล็อกอิน (สมาชิกทั่วไปหรือ admin ใช้ได้)
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user._id
        token.role = user.role
        token.address = user.address;
        token.phone = user.phone;
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      session.user.address = token.address
      session.user.phone = token.phone
      return session
    }
  }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }
