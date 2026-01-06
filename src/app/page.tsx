'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);
  const [isExtension, setIsExtension] = useState(false);

  useEffect(() => {
    // Check if running in extension context
    if (typeof window !== 'undefined') {
      const isExt = window.location.protocol === 'chrome-extension:' || 
                    window.location.protocol === 'moz-extension:' ||
                    (typeof chrome !== 'undefined' && (chrome as any).runtime?.id) ||
                    (typeof browser !== 'undefined' && (browser as any).runtime?.id);
      setIsExtension(isExt);
      
      // If in extension and on root, redirect to popup
      if (isExt && pathname === '/') {
        router.push('/popup');
        return;
      }
      
      // Check if user has a wallet
      const address = localStorage.getItem('veilwallet_address');
      setHasWallet(!!address);
    }
  }, [pathname, router]);

  if (hasWallet === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  if (hasWallet && !isExtension) {
    router.push('/wallet/unlock');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
      <Card className="max-w-md w-full">
        <div className="text-center space-y-6 py-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              VeilWallet
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Self-custodial smart contract wallet with privacy features
            </p>
          </div>

          <div className="space-y-4">
            <Link href="/wallet/create" className="block">
              <Button className="w-full" size="lg">
                Create New Wallet
              </Button>
            </Link>
            <Link href="/wallet/unlock" className="block">
              <Button variant="outline" className="w-full" size="lg">
                Unlock Wallet
              </Button>
            </Link>
            <Link href="/wallet/restore" className="block">
              <Button variant="outline" className="w-full" size="lg">
                Restore from Seed Phrase
              </Button>
            </Link>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your keys, your crypto. Fully self-custodial.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
