import './globals.css';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'SIPMBO',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 min-h-screen">
        <Toaster position="top-center" richColors />
        {children}
        
      </body>
    </html>
  );
}
