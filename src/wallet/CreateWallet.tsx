import { useState } from 'react';
import { keyService } from '@/services/key.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function CreateWallet() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'password' | 'creating' | 'success' | 'mnemonic'>('password');
  const [walletAddress, setWalletAddress] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setStep('creating');

    try {
      console.log('🔐 [CreateWallet] Starting wallet creation...');
      
      // Step 1: Generate EOA key pair
      console.log('📝 [CreateWallet] Generating Ethereum key...');
      const keyResult = await keyService.generateEthereumKey(password);
      
      if (!keyResult.success || !keyResult.data) {
        console.error('❌ [CreateWallet] Key generation failed:', keyResult.error);
        setError(keyResult.error || 'Failed to generate wallet');
        setStep('password');
        return;
      }

      const { address: eoaAddress, mnemonic: mnemonicPhrase, keyId } = keyResult.data;
      console.log('✅ [CreateWallet] Key generated. EOA:', eoaAddress);
      
      // Step 2: Retrieve the private key to deploy smart account
      console.log('🔑 [CreateWallet] Retrieving private key for deployment...');
      const privateKeyResult = await keyService.getEthereumPrivateKey(keyId, password);
      
      if (!privateKeyResult.success || !privateKeyResult.data) {
        console.error('❌ [CreateWallet] Failed to retrieve private key:', privateKeyResult.error);
        setError('Failed to retrieve private key');
        setStep('password');
        return;
      }
      
      const privateKey = privateKeyResult.data;
      console.log('✅ [CreateWallet] Private key retrieved');
      
      // Step 3: Deploy smart account
      console.log('🚀 [CreateWallet] Deploying smart account...');
      const { smartAccountService } = await import('@/services/smartAccount.service');
      const deployResult = await smartAccountService.deployAccount(privateKey, eoaAddress);
      
      if (!deployResult.success || !deployResult.address) {
        console.error('❌ [CreateWallet] Smart account deployment failed:', deployResult.error);
        setError(deployResult.error || 'Failed to deploy smart account');
        setStep('password');
        return;
      }

      console.log('✅ [CreateWallet] Smart account deployed at:', deployResult.address);
      
      // Store both EOA and smart account addresses
      setWalletAddress(deployResult.address);
      setMnemonic(mnemonicPhrase);
      localStorage.setItem('veilwallet_address', deployResult.address);
      localStorage.setItem('veilwallet_eoa', eoaAddress);
      localStorage.setItem('veilwallet_protected', 'true'); // Mark as protected since we just deployed smart account
      
      console.log('✅ [CreateWallet] Wallet creation complete!');
      setStep('mnemonic');
    } catch (err) {
      console.error('❌ [CreateWallet] Wallet creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
      setStep('password');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    sessionStorage.setItem('veilwallet_unlocked', 'true');
    // Ensure EOA is still stored
    const eoaFromStorage = localStorage.getItem('veilwallet_eoa');
    if (!eoaFromStorage) {
      console.error('EOA not found in storage, attempting to restore');
      // This shouldn't happen, but as a safety measure
      const smartAddress = localStorage.getItem('veilwallet_address');
      if (smartAddress) {
        // We can derive EOA from the wallet creation flow
        console.log('Smart account:', smartAddress);
      }
    }
    window.location.href = 'popup.html';
  };

  if (step === 'mnemonic') {
    return (
      <div style={{ width: '400px', height: '600px', overflow: 'auto' }} className="flex items-center justify-center bg-gray-50 dark:bg-black px-4">
        <Card className="w-full max-w-sm">
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-bold">Save Your Seed Phrase</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Write these down and keep them safe!
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
              <div className="grid grid-cols-3 gap-2 text-sm font-mono">
                {mnemonic.split(' ').map((word, i) => (
                  <div key={i}><span className="text-gray-500">{i+1}.</span> {word}</div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={async () => {
                await navigator.clipboard.writeText(mnemonic);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }} variant="outline" className="flex-1">
                {copied ? '✓ Copied!' : 'Copy'}
              </Button>
              <Button onClick={() => setStep('success')} className="flex-1">
                Continue
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div style={{ width: '400px', height: '600px' }} className="flex items-center justify-center bg-gray-50 dark:bg-black px-4">
        <Card className="w-full max-w-sm">
          <div className="space-y-4 text-center">
            <h2 className="text-2xl font-bold">Wallet Created!</h2>
            <p className="text-sm break-all font-mono">{walletAddress}</p>
            <Button onClick={handleContinue} className="w-full">
              Open Wallet
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ width: '400px', height: '600px' }} className="flex items-center justify-center bg-gray-50 dark:bg-black px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Create Your Wallet</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Your keys stay on your device
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="At least 8 characters"
          />
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Re-enter password"
          />
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          <Button type="submit" className="w-full" isLoading={loading || step === 'creating'} disabled={loading || step === 'creating'}>
            {step === 'creating' ? 'Creating...' : 'Create Wallet'}
          </Button>
        </form>
      </div>
    </div>
  );
}

