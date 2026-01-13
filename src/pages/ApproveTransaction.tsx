import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { PasswordModal } from '@/components/ui/PasswordModal';
import { Toast } from '@/components/ui/Toast';
import { ethers } from 'ethers';
import { keyService } from '@/services/key.service';
import { smartAccountService } from '@/services/smartAccount.service';
import { tokenService } from '@/services/token.service';
import { NETWORK_CONFIG } from '@/config/constants';

export default function ApproveTransaction() {
  const [loading, setLoading] = useState(false);
  const [request, setRequest] = useState<any>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    // Get pending transaction from URL or storage
    const urlParams = new URLSearchParams(window.location.search);
    const requestId = urlParams.get('requestId') || urlParams.get('txId') || urlParams.get('signId');
    
    if (requestId) {
      loadRequest(requestId);
    } else {
      // Try to get from storage via message to background
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({ action: 'getStorage' }, (response) => {
          if (response && response.success) {
            const items = response.data || {};
            for (const key in items) {
              if (key.startsWith('pending_request_') || key.startsWith('pending_tx_') || key.startsWith('pending_sign_')) {
                setRequest({ ...items[key], requestId: key });
                break;
              }
            }
          }
        });
      }
    }
  }, []);

  const loadRequest = async (requestId: string) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ 
        action: 'getStorage', 
        keys: [`pending_request_${requestId}`, `pending_tx_${requestId}`, `pending_sign_${requestId}`]
      }, (response) => {
        if (response && response.success) {
          const result = response.data || {};
          const requestData = result[`pending_request_${requestId}`] || result[`pending_tx_${requestId}`] || result[`pending_sign_${requestId}`];
          if (requestData) {
            setRequest({ ...requestData, requestId });
          }
        }
      });
    }
  };

  const handleApprove = () => {
    setShowPasswordModal(true);
  };

  const handleReject = async () => {
    if (request?.requestId && typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ 
        action: 'removeStorage', 
        key: request.requestId 
      });
    }
    window.close();
  };

  const handlePasswordConfirm = async (password: string) => {
    setLoading(true);
    try {
      const eoaAddress = localStorage.getItem('veilwallet_eoa');
      if (!eoaAddress) {
        throw new Error('EOA address not found');
      }

      const keyResult = await keyService.getEthereumKeyByAccount(eoaAddress, password);
      if (!keyResult.success || !keyResult.data) {
        setToast({ message: 'Invalid password', type: 'error' });
        setLoading(false);
        setShowPasswordModal(false);
        return;
      }

      const { privateKey } = keyResult.data;
      const accountAddress = request.accountAddress || localStorage.getItem('veilwallet_address');

      // Handle different request types
      if (request.method === 'eth_sendTransaction') {
        const tx = request.params?.[0] || request;
        
        // Determine if this should go through smart account or EOA
        const selectedAccount = localStorage.getItem('veilwallet_selected_account') || 'smart';
        const smartAccount = localStorage.getItem('veilwallet_address');
        const isSmartAccount = selectedAccount === 'smart' && smartAccount && accountAddress?.toLowerCase() === smartAccount.toLowerCase();

        if (isSmartAccount && smartAccount) {
          // Execute through smart account
          const result = await smartAccountService.executeTransaction(
            smartAccount,
            privateKey,
            tx.to || accountAddress,
            tx.value ? BigInt(tx.value) : BigInt(0),
            tx.data || '0x'
          );

          if (!result.success) {
            throw new Error(result.error || 'Transaction failed');
          }

          // Send response back
          if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({
              type: 'VEILWALLET_RPC_RESPONSE',
              requestId: request.requestId,
              result: result.txHash,
            });
          }

          setToast({ message: 'Transaction approved!', type: 'success' });
          setTimeout(() => {
            if (request.requestId && typeof chrome !== 'undefined' && chrome.runtime) {
              chrome.runtime.sendMessage({ 
                action: 'removeStorage', 
                key: request.requestId 
              });
            }
            window.close();
          }, 1500);
        } else {
          // Direct EOA transaction
          const wallet = new ethers.Wallet(privateKey);
          const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.RPC_URL);
          const connectedWallet = wallet.connect(provider);

          const txResponse = await connectedWallet.sendTransaction({
            to: tx.to,
            value: tx.value || 0,
            data: tx.data || '0x',
            gasLimit: tx.gas,
            gasPrice: tx.gasPrice,
          });

          const receipt = await txResponse.wait();

          if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({
              type: 'VEILWALLET_RPC_RESPONSE',
              requestId: request.requestId,
              result: receipt.hash,
            });
          }

          setToast({ message: 'Transaction approved!', type: 'success' });
          setTimeout(() => {
            if (request.requestId && typeof chrome !== 'undefined' && chrome.runtime) {
              chrome.runtime.sendMessage({ 
                action: 'removeStorage', 
                key: request.requestId 
              });
            }
            window.close();
          }, 1500);
        }
      } else if (['eth_sign', 'personal_sign', 'eth_signTypedData', 'eth_signTypedData_v3', 'eth_signTypedData_v4'].includes(request.method)) {
        // Handle signing
        const wallet = new ethers.Wallet(privateKey);
        
        let signature: string;
        if (request.method === 'personal_sign') {
          const message = request.params?.[0] || request.message;
          signature = await wallet.signMessage(ethers.getBytes(message));
        } else if (request.method.startsWith('eth_signTypedData')) {
          const typedData = request.params?.[1] || request.typedData;
          signature = await wallet.signTypedData(
            typedData.domain,
            typedData.types,
            typedData.message
          );
        } else {
          const message = request.params?.[1] || request.message;
          signature = await wallet.signMessage(ethers.getBytes(message));
        }

        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.sendMessage({
            type: 'VEILWALLET_RPC_RESPONSE',
            requestId: request.requestId,
            result: signature,
          });
        }

        setToast({ message: 'Signature approved!', type: 'success' });
        setTimeout(() => {
          if (request.requestId && typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({ 
              action: 'removeStorage', 
              key: request.requestId 
            });
          }
          window.close();
        }, 1500);
      }
    } catch (error: any) {
      setToast({ message: error.message || 'Approval failed', type: 'error' });
    } finally {
      setLoading(false);
      setShowPasswordModal(false);
    }
  };

  if (!request) {
    return (
      <div style={{ width: '400px', height: '600px' }} className="flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-white mx-auto mb-4"></div>
          <p>Loading request...</p>
        </div>
      </div>
    );
  }

  const isTransaction = request.method === 'eth_sendTransaction' || request.to;
  const isSigning = ['eth_sign', 'personal_sign', 'eth_signTypedData', 'eth_signTypedData_v3', 'eth_signTypedData_v4'].includes(request.method);

  return (
    <div style={{ width: '400px', height: '600px' }} className="flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="p-4 border-b border-white/10">
        <h1 className="text-lg font-bold">
          {isTransaction ? 'Approve Transaction' : isSigning ? 'Approve Signature' : 'Approve Request'}
        </h1>
        {request.origin && (
          <p className="text-xs text-white/60 mt-1 truncate">{request.origin}</p>
        )}
      </div>

      <div className="p-6 flex-1 overflow-auto space-y-4">
        {isTransaction && (
          <>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">To:</span>
                  <span className="font-mono text-xs break-all">{request.to || request.params?.[0]?.to}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Value:</span>
                  <span>{request.value || request.params?.[0]?.value ? ethers.formatEther(request.value || request.params?.[0]?.value) : '0'} ETH</span>
                </div>
                {request.data && request.data !== '0x' && (
                  <div>
                    <span className="text-white/60">Data:</span>
                    <p className="font-mono text-xs break-all mt-1">{request.data || request.params?.[0]?.data}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {isSigning && (
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-white/60">Message:</span>
                <p className="font-mono text-xs break-all mt-1 bg-white/5 p-2 rounded">
                  {request.message || request.params?.[0] || 'Typed Data'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <Button
            onClick={handleReject}
            variant="outline"
            className="flex-1"
            disabled={loading}
          >
            Reject
          </Button>
          <Button
            onClick={handleApprove}
            className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500"
            disabled={loading}
          >
            Approve
          </Button>
        </div>
      </div>

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onConfirm={handlePasswordConfirm}
        title="Confirm Request"
        description="Enter your password to approve"
        loading={loading}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={!!toast}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

