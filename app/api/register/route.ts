import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { namaLengkap, email, noHP, username, password, role } = body;

    // 1. Basic Validation
    if (!namaLengkap || !username || !password || !role || !email) { // Added email to primary check
      return NextResponse.json(
        { error: "Nama, Email, Username, Password, dan Role wajib diisi" },
        { status: 400 }
      );
    }

    // --- PENTING (IMPORTANT) ---
    // Kode login Anda saat ini membandingkan password sebagai plain text.
    // Karena itu, kode registrasi ini JUGA menyimpan password sebagai plain text.
    // Ini sangat tidak aman.
    //
    // REKOMENDASI:
    // 1. Gunakan 'bcrypt' saat registrasi untuk HASH password.
    //    const hashedPassword = await bcrypt.hash(password, 10);
    // 2. Simpan 'hashedPassword' ke database.
    // 3. Ubah kode LOGIN Anda untuk menggunakan 'bcrypt.compare(password, user.password)'.
    // ---
    const plainTextPassword = password; // Menyimpan password apa adanya

    // 2. Convert phone number to Int (as per your schema)
    // Note: This is risky. Your schema should use 'String' for phone numbers
    // to support characters like '+' or '0' at the beginning.
    let noTeleponInt: number | null = null;
    if (noHP) {
      noTeleponInt = parseInt(noHP, 10);
      if (isNaN(noTeleponInt)) {
        return NextResponse.json(
          { error: "Nomor HP tidak valid, harus berupa angka" },
          { status: 400 }
        );
      }
    }

    // 3. Handle registration based on Role
    if (role === "Karyawan") {
      // Check for existing username or email in 'karyawan'
      const existingKaryawan = await prisma.karyawan.findFirst({
        where: {
          OR: [
            { username_karyawan: username },
            { email_karyawan: email }
          ],
        },
      });

      if (existingKaryawan) {
        if (existingKaryawan.username_karyawan === username) {
          return NextResponse.json(
            { error: "Username ini sudah terdaftar" },
            { status: 409 } // 409 Conflict
          );
        }
        if (existingKaryawan.email_karyawan === email) {
          return NextResponse.json(
            { error: "Email ini sudah terdaftar" },
            { status: 409 }
          );
        }
      }

      // Create new 'karyawan'
      const newKaryawan = await prisma.karyawan.create({
        data: {
          nama_karyawan: namaLengkap,
          email_karyawan: email,
          username_karyawan: username,
          password_karyawan: plainTextPassword, // SEHARUSNYA DI-HASH
          no_telepon_karyawan: noTeleponInt,
          tgl_bergabung: new Date(), // Set join date
        },
      });

      // Don't return the password
      const { password_karyawan, ...result } = newKaryawan;
      return NextResponse.json(
        { message: "Registrasi Karyawan berhasil!", user: result },
        { status: 201 }
      );

    } else if (role === "Owner") {
      // Check for existing username or email in 'owner'
      const existingOwner = await prisma.owner.findFirst({
        where: {
          OR: [
            { username_owner: username },
            { email_owner: email }, // <-- UPDATED: Check for existing email
          ]
        },
      });

      if (existingOwner) {
        if (existingOwner.username_owner === username) {
          return NextResponse.json(
            { error: "Username ini sudah terdaftar" },
            { status: 409 }
          );
        }
        if (existingOwner.email_owner === email) { // <-- UPDATED: Handle email conflict
          return NextResponse.json(
            { error: "Email ini sudah terdaftar" },
            { status: 409 }
          );
        }
      }

      // Create new 'owner'
      const newOwner = await prisma.owner.create({
        data: {
          nama_owner: namaLengkap,
          email_owner: email, // <-- UPDATED: Added email field
          username_owner: username,
          password_owner: plainTextPassword, // SEHARUSNYA DI-HASH
          no_telepon_owner: noTeleponInt,
        },
      });

      // Don't return the password
      const { password_owner, ...result } = newOwner;
      return NextResponse.json(
        { message: "Registrasi Owner berhasil!", user: result },
        { status: 201 }
      );

    } else {
      return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
    }
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}