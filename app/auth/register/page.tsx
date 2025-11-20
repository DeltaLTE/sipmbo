"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Define a type for the error state
type FormErrors = {
  namaLengkap?: string;
  email?: string;
  noHP?: string;
  username?: string;
  password?: string;
  role?: string;
};

// Helper component for error messages (moved outside main component)
const ErrorMessage = ({ message }: { message?: string }) => {
  return message ? (
    <p className="text-red-900 text-sm mt-1">{message}</p>
  ) : null;
};

export default function RegisterPage() {
  const router = useRouter();
  // 1. States for form fields
  const [namaLengkap, setNamaLengkap] = useState("");
  const [email, setEmail] = useState("");
  const [noHP, setNoHP] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Karyawan"); // Default to 'Karyawan'
  
  // 2. States for UI feedback
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // --- FIX: Add state to track success/failure ---
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

  // 3. Validation function
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!namaLengkap) {
      newErrors.namaLengkap = "Nama Lengkap wajib diisi";
    }
    if (!username) {
      newErrors.username = "Username wajib diisi";
    }
    if (!password) {
      newErrors.password = "Password wajib diisi";
    }
    if (!email) {
      newErrors.email = "Email wajib diisi";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      // Simple email format check
      newErrors.email = "Format email tidak valid";
    }
    if (noHP && !/^\+?[0-9]+$/.test(noHP)) {
      // Check if noHP contains only numbers (and optional +)
      newErrors.noHP = "Nomor HP harus berupa angka";
    }

    setErrors(newErrors);
    // Returns true if there are no errors (object is empty)
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(""); // Clear previous server messages
    setErrors({}); // Clear previous validation errors
    setIsSuccess(null); // Reset success state

    // 4. Run validation before submitting
    if (!validateForm()) {
      return; // Stop submission if validation fails
    }

    setIsLoading(true);

    // 5. Send all required data in the request body
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        namaLengkap,
        email,
        noHP,
        username,
        password,
        role,
      }),
    });

    const data = await res.json();
    setIsLoading(false);
    
    // --- FIX: Set the success state based on res.ok ---
    setIsSuccess(res.ok);

    if (res.ok) {
      // Registration successful
      setMsg("Registrasi berhasil! Mengarahkan ke login...");
      setTimeout(() => router.push("/auth/login"), 1500); // Give time to read message
    } else {
      // Registration failed, set error message from server
      setMsg(data.message || data.error);
      console.error("Registration failed:", data.error);
    }
  };


  return (
    // Main container with green background
    <div className="flex justify-center items-center min-h-screen bg-[#78A890] p-4">
      
      <div className="w-full max-w-md">
        {/* Header Section */}
        {/* ... existing code ... */}
        <div className="flex justify-between items-center mb-6 px-2">
          <h1 className="text-4xl font-serif text-white">Bolivar Cafe</h1>
          <h2 className="text-xl font-sans font-semibold text-gray-800">REGISTRASI</h2>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Nama Lengkap */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Nama Lengkap
            </label>
            <input
              className="w-full p-3 rounded bg-[#D9D9D9] text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              value={namaLengkap}
              onChange={(e) => setNamaLengkap(e.target.value)}
            />
            <ErrorMessage message={errors.namaLengkap} />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Email
            </label>
            <input
              className="w-full p-3 rounded bg-[#D9D9D9] text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <ErrorMessage message={errors.email} />
          </div>

          {/* No. HP */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              No. HP
            </label>
            <input
              className="w-full p-3 rounded bg-[#D9D9D9] text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="tel"
              value={noHP}
              onChange={(e) => setNoHP(e.target.value)}
            />
            <ErrorMessage message={errors.noHP} />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Username
            </label>
            <input
              className="w-full p-3 rounded bg-[#D9D9D9] text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <ErrorMessage message={errors.username} />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Password
            </label>
            <input
              className="w-full p-3 rounded bg-[#D9D9D9] text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <ErrorMessage message={errors.password} />
          </div>

          {/* Role */}
          {/* --- FIX: Added 'relative' class for dropdown arrow positioning --- */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-800 mb-1">
              Role
            </label>
            <select
              className="w-full p-3 rounded bg-[#D9D9D9] text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="Karyawan">Karyawan</option>
              <option value="Owner">Owner</option>
            </select>
            {/* Custom dropdown arrow to match image */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700" style={{ top: '28px' }}> {/* Adjusted top for label */}
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
            </div>
          </div>

          {/* Message Area for Server Feedback */}
          {msg && (
            // --- FIX: Use 'isSuccess' state instead of 'res.ok' ---
            <p className={`text-center text-sm p-2 rounded ${
              isSuccess === true ? 'bg-green-200 text-green-900' : 
              isSuccess === false ? 'bg-red-200 text-red-900' : ''
            }`}>
              {msg}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#7A8DBA] hover:bg-opacity-90 text-white py-3 rounded font-semibold disabled:bg-gray-400"
            disabled={isLoading}
          >
            {isLoading ? "Mendaftarkan..." : "DAFTAR"}
          </button>

          {/* Back to Login Link */}
          <button
            type="button"
            onClick={() => router.push("/auth/login")}
            className="w-full bg-[#D9D9D9] hover:bg-opacity-90 text-gray-800 py-3 rounded font-semibold mt-2"
          >
            Kembali ke halaman Login
          </button>
        </form>
      </div>
    </div>
  );
}