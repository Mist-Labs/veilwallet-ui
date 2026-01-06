import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function ReceivePage() {
  const [address, setAddress] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrCode, setQrCode] = useState('');

  useEffect(() => {
    const addr = localStorage.getItem('veilwallet_address');
    if (addr) {
      setAddress(addr);
      // Generate QR code (simple data URL for demo)
      generateQR(addr);
    }
  }, []);

  const generateQR = (text: string) => {
    // For production, use qrcode library
    // For now, placeholder
    setQrCode('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="white" width="100" height="100"/></svg>');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ width: '400px', height: '600px' }} className="flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center">
        <button 
          onClick={() => window.location.href = 'popup.html'} 
          className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold ml-2">Receive Tokens</h1>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          {/* QR Code */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            <div className="bg-white rounded-2xl p-6 aspect-square flex items-center justify-center">
              <div className="text-center">
                <div className="w-48 h-48 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-32 h-32 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <p className="text-xs text-gray-600">Scan to send tokens</p>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-3">
            <label className="text-sm text-white/60 uppercase tracking-wider">Your Wallet Address</label>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-sm font-mono break-all text-white/90 mb-3">{address}</p>
              <Button
                onClick={handleCopy}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                {copied ? (
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Copied!</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy Address</span>
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-400/20 rounded-2xl p-4">
            <p className="text-xs text-blue-300">
              <strong>💡 Tip:</strong> Only send MNT or VEIL tokens to this address. Sending other tokens may result in permanent loss.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

