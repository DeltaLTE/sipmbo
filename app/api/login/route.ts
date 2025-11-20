import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";

// Helper function to create the JWT
async function createToken(payload: { userId: number, role: string }) {
  const secretKey = process.env.JWT_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing JWT_SECRET_KEY in .env file");
  }

  const secret = new TextEncoder().encode(secretKey);
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // Token lasts for 1 day
    .sign(secret);
  
  return token;
}

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Username & password wajib diisi" }, { status: 400 });
    }

    // --- Check Owner ---
    const owner = await prisma.owner.findFirst({ where: { username_owner: username } });
    if (owner) {
      const dbPassword = owner.password_owner ?? "";
      if (password !== dbPassword) {
        return NextResponse.json({ error: "Password salah" }, { status: 401 });
      }

      // 1. Create Token
      const token = await createToken({ userId: owner.id_owner, role: "owner" });

      // 2. Create Response and Set Cookie
      const response = NextResponse.json({ 
        message: "Login berhasil", 
        role: "owner", 
        userId: owner.id_owner 
      });

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 1 day in seconds
        path: '/',
      });

      return response;
    }

    // --- Check Karyawan ---
    const karyawan = await prisma.karyawan.findFirst({ where: { username_karyawan: username } });
    if (karyawan) {
      const dbPassword = karyawan.password_karyawan ?? "";
      if (password !== dbPassword) {
        return NextResponse.json({ error: "Password salah" }, { status: 401 });
      }

      // 1. Create Token
      const token = await createToken({ userId: karyawan.id_karyawan, role: "karyawan" });
      
      // 2. Create Response and Set Cookie
      const response = NextResponse.json({ 
        message: "Login berhasil", 
        role: "karyawan", 
        userId: karyawan.id_karyawan 
      });

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
      });

      return response;
    }

    return NextResponse.json({ error: "Username tidak ditemukan" }, { status: 404 });
  } catch (e: any) {
    console.error("Login Error:", e.message);
    // Send a more generic error message to the client
    if (e.message.includes("JWT_SECRET_KEY")) {
      return NextResponse.json({ error: "Konfigurasi server tidak lengkap" }, { status: 500 });
    }
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}