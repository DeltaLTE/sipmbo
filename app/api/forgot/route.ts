import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { email, newPassword } = await req.json();
    // `email` can be an email address or a username depending on your frontend.
    if (!email || !newPassword) {
      return Response.json({ error: "Email/username & password baru wajib diisi" }, { status: 400 });
    }

    const identifier: string = email.trim();

    // If identifier looks like an email, try karyawan.email_karyawan first.
    if (identifier.includes("@")) {
      const karyawan = await prisma.karyawan.findFirst({ where: { email_karyawan: identifier } });
      if (!karyawan) return Response.json({ error: "Email tidak ditemukan" }, { status: 404 });

      const hashed = await bcrypt.hash(newPassword, 10);
      await prisma.karyawan.update({
        where: { id_karyawan: karyawan.id_karyawan },
        data: { password_karyawan: hashed },
      });

      return Response.json({ message: "Password karyawan berhasil direset" });
    }

    // Otherwise treat identifier as username: check owner then karyawan (like login).
    const owner = await prisma.owner.findFirst({ where: { username_owner: identifier } });
    if (owner) {
      const hashed = await bcrypt.hash(newPassword, 10);
      await prisma.owner.update({
        where: { id_owner: owner.id_owner },
        data: { password_owner: hashed },
      });
      return Response.json({ message: "Password owner berhasil direset" });
    }

    const karyawanByUsername = await prisma.karyawan.findFirst({ where: { username_karyawan: identifier } });
    if (karyawanByUsername) {
      const hashed = await bcrypt.hash(newPassword, 10);
      await prisma.karyawan.update({
        where: { id_karyawan: karyawanByUsername.id_karyawan },
        data: { password_karyawan: hashed },
      });
      return Response.json({ message: "Password karyawan berhasil direset" });
    }

    return Response.json({ error: "User tidak ditemukan" }, { status: 404 });
  } catch (e: any) {
    return Response.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
