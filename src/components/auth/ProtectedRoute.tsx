'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletAuth } from '@/hooks/useWalletAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { walletAddress, isUnlocked, loading } = useWalletAuth();

  useEffect(() => {
    if (!loading) {
      if (!walletAddress) {
        router.push('/');
      } else if (!isUnlocked) {
        router.push('/wallet/unlock');
      }
    }
  }, [walletAddress, isUnlocked, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  if (!walletAddress || !isUnlocked) {
    return null;
  }

  return <>{children}</>;
}

