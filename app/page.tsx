'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Multiple redirect strategies for maximum compatibility
    const redirect = () => {
      try {
        router.push('/login');
      } catch (error) {
        // Fallback to window.location if router fails
        window.location.href = '/login';
      }
    };

    // Immediate redirect
    redirect();

    // Backup redirect after a short delay
    const timer = setTimeout(() => {
      window.location.href = '/login';
    }, 500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <>
      <meta httpEquiv="refresh" content="1; url=/login" />
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm">Redirecting to login...</p>
          <p className="text-xs text-gray-400 mt-2">
            If you are not redirected automatically, <a href="/login" className="text-blue-400 underline">click here</a>
          </p>
        </div>
      </div>
    </>
  );
}