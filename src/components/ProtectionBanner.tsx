import { useState } from 'react';
import { Button } from './ui/Button';

interface ProtectionBannerProps {
  onProtect: () => void;
  onDismiss: () => void;
}

export function ProtectionBanner({ onProtect, onDismiss }: ProtectionBannerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleProtect = async () => {
    setIsLoading(true);
    await onProtect();
    setIsLoading(false);
  };

  return (
    <div className="mx-4 mb-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 rounded-2xl p-4 backdrop-blur-sm">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          <div className="w-10 h-10 bg-purple-500/30 rounded-full flex items-center justify-center">
            <span className="text-2xl">🛡️</span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white mb-1">Enable Privacy Protection</h3>
          <p className="text-xs text-white/70 mb-3">
            Deploy a smart account to enable private transactions and advanced security features. All your transactions will be privacy-protected.
          </p>
          <div className="flex space-x-2">
            <Button
              onClick={handleProtect}
              isLoading={isLoading}
              disabled={isLoading}
              className="text-xs py-2 px-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {isLoading ? 'Enabling...' : 'Enable Protection'}
            </Button>
            <button
              onClick={onDismiss}
              className="text-xs text-white/60 hover:text-white/80 px-3"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

