"use client";

import { useState, useEffect } from 'react'; // 1. Add useEffect here
import { useRouter, useSearchParams } from 'next/navigation'; // 2. Add useSearchParams here
import Link from 'next/link';
import { toast } from 'sonner'; // 3. Add toast here
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';


export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('logout') === 'success') {
      // Show the notification
      toast.success("Logout berhasil! Sampai jumpa lagi.");

      const timer = setTimeout(() => {
        router.replace('/auth/login');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!username || !password) {
      setMsg("Username & password wajib diisi");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMsg(data.error || 'Login gagal');
        return;
      }

      setMsg(data.message || 'Login berhasil');

      router.push('/auth/dashboard/customers');
    } catch (err: any) {
      setMsg(err?.message ?? 'Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2d2d2d]">
      <div className="w-full max-w-sm">
        <div className="bg-[#5a9d8a] rounded-t-lg px-8 pt-8 pb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Bolivar Cafe</h1>
          <p className="text-white text-sm opacity-90">
            Enter your credentials to access the management dashboard
          </p>
        </div>

        <div className="bg-[#7db5a3] px-8 py-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="QuickDevs01"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-white border-none text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="David"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white border-none text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#2d2d2d] hover:bg-[#1d1d1d] text-white font-medium py-3 rounded"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'LOGIN'}
            </Button>

            {msg && (
              <div className={`text-center text-sm ${msg.includes('berhasil') || msg.includes('success') ? 'text-green-800' : 'text-red-600'}`}>
                {msg}
              </div>
            )}
          </form>
        </div>

        <div className="bg-[#7db5a3] px-8 py-4 rounded-b-lg">
          <div className="flex justify-center items-center gap-2 text-sm">
            <span className="text-white">
              Belum memiliki akun?
            </span>
            <Link
              href="/auth/register"
              className="text-white hover:underline font-semibold"
            >
              Registrasi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}