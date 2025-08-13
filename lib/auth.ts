'use client';

// This function now correctly checks for the 'token' cookie.
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for the 'token' cookie set by your JWT login process
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => 
    cookie.trim().startsWith('token=')
  );
  
  // Return true if the token cookie exists and is not empty
  return !!tokenCookie;
}

// No other changes needed here.

// The rest of the file can remain the same
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