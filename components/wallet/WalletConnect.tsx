'use client';

import { ConnectButton, useActiveAccount, useDisconnect } from 'thirdweb/react';
import { createWallet } from 'thirdweb/wallets';
import { createThirdwebClient } from 'thirdweb';
// import { sepolia, baseSepolia, ethereum, polygon } from 'thirdweb/chains';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || 'f01b356e31a306f1710853e8bd533030',
});

const wallets = [
  createWallet('io.metamask'),
  createWallet('com.coinbase.wallet'),
  createWallet('me.rainbow'),
  createWallet('io.rabby'),
  createWallet('io.zerion.wallet'),
];

interface WalletConnectProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
  showDisconnect?: boolean;
}

export default function WalletConnect({ onConnect, onDisconnect, showDisconnect = false }: WalletConnectProps) {
  const activeAccount = useActiveAccount();
  const { disconnect } = useDisconnect();

  const handleDisconnect = async () => {
    try {
      // Check if there's an active account before attempting disconnect
      if (!activeAccount) {
        console.log('No active account to disconnect');
        onDisconnect?.();
        return;
      }

      // The disconnect hook expects a wallet argument; pass the active wallet from the account
      // Some versions may ignore the argument, so we guard accordingly
      // @ts-expect-error thirdweb types vary by version
      // thirdweb types differ by version; accept either wallet object or account
      await disconnect(activeAccount as unknown as { address: string });
      console.log('✅ Wallet disconnected successfully');
      
      // Call the callback after successful disconnect
      onDisconnect?.();
    } catch (error: unknown) {
      console.error('Failed to disconnect wallet:', error);
      
      // Force disconnect by clearing local state even if ThirdWeb fails
      console.log('🔄 Forcing disconnect by clearing local state...');
      
      // Try to clear localStorage related to wallet connection
      try {
        if (typeof window !== 'undefined') {
          // Clear common wallet connection keys
          const keysToRemove = [
            'thirdweb:connected-wallet-ids',
            'thirdweb:active-wallet',
            'wagmi.wallet',
            'WALLETCONNECT_DEEPLINK_CHOICE'
          ];
          
          keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          });
          
          // Force page reload to clear all wallet state
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
      } catch (storageError) {
        console.error('Error clearing storage:', storageError);
      }
      
      // Still call the callback
      onDisconnect?.();
    }
  };

  // If connected and showDisconnect is true, show disconnect button
  if (activeAccount && showDisconnect) {
    return (
      <div className="space-y-3">
        <div className="text-center">
          <div className="text-green-300 text-sm font-medium mb-2">✅ Wallet Connected!</div>
          <div className="text-xs text-purple-200 mb-3">
            {activeAccount.address.slice(0, 6)}...{activeAccount.address.slice(-4)}
          </div>
        </div>
        <Button
          onClick={handleDisconnect}
          variant="outline"
          className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect Wallet
        </Button>
      </div>
    );
  }

  // Show connect button if not connected OR if wallet is connected but we need disconnect functionality
  return (
    <div className="space-y-3">
      <ConnectButton
        client={client}
        wallets={wallets}
        theme="dark"
        connectModal={{ size: 'compact' }}
        onConnect={onConnect}
        onDisconnect={() => {
          console.log('📱 ConnectButton disconnect triggered');
          onDisconnect?.();
        }}
        connectButton={{
          label: "Connect Wallet",
          className: "w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
        }}
        detailsButton={{
          className: "w-full bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20"
        }}
        switchButton={{
          className: "w-full bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20"
        }}
      />
    </div>
  );
}