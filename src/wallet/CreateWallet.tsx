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

      const { address: eoaAddress, mnemonic: mnemonicPhrase } = keyResult.data;
      console.log('✅ [CreateWallet] Key generated. EOA:', eoaAddress);
      
      // Step 2: Create wallet account (EOA only, no deployment)
      console.log('📝 [CreateWallet] Creating wallet account...');
      const { walletAccountService } = await import('@/services/walletAccount.service');
      const accountResult = await walletAccountService.createAccount(password);
      
      if (!accountResult.success || !accountResult.account) {
        console.error('❌ [CreateWallet] Account creation failed:', accountResult.error);
        setError(accountResult.error || 'Failed to create account');
        setStep('password');
        return;
      }

      const account = accountResult.account;
      console.log('✅ [CreateWallet] Account created:', account);
      console.log('✅ [CreateWallet] Smart account address (predicted):', account.smartAccountAddress);
      console.log('✅ [CreateWallet] Smart account deployed:', account.isSmartAccountDeployed);
      
      // Set as active account
      await walletAccountService.setActiveAccount(account.id);
      
      // Store for display
      setWalletAddress(account.smartAccountAddress || eoaAddress);
      setMnemonic(mnemonicPhrase);
      
      console.log('✅ [CreateWallet] Wallet creation complete!');
      console.log('ℹ️ [CreateWallet] Smart account will be deployed when you have gas (MNT)');
      setStep('mnemonic');
    } catch (err) {
      console.error('❌ [CreateWallet] Wallet creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
      setStep('password');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    // Set as unlocked (using same password for all accounts)
    sessionStorage.setItem('veilwallet_unlocked', 'true');
    
    // Set the newly created account as active
    const { walletAccountService } = await import('@/services/walletAccount.service');
    const accounts = await walletAccountService.getAllAccounts();
    const newAccount = accounts[accounts.length - 1]; // Last created account
    if (newAccount) {
      await walletAccountService.setActiveAccount(newAccount.id);
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
            <div className="space-y-2">
              <p className="text-xs text-gray-600 dark:text-gray-400">Smart Account Address (predicted):</p>
              <p className="text-sm break-all font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                {walletAddress}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                ⚠️ Smart account not deployed yet. Deploy it when you have MNT for gas.
              </p>
            </div>
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

