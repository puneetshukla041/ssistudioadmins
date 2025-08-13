// lib/auth.ts - Client-side authentication utilities
'use client';

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for auth cookie
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find(cookie => 
    cookie.trim().startsWith('admin-auth=')
  );
  
  return authCookie?.includes('admin-auth=true') || false;
}

export function redirectToLogin(): void {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export function checkAuthAndRedirect(): void {
  if (!isAuthenticated()) {
    redirectToLogin();
  }
}