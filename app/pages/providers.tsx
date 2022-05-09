import React, { FC, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";

const WalletConnectionProvider: FC = ({ children }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const endpoint = process.env.NEXT_PUBLIC_RPC as string;

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded.
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SlopeWalletAdapter(),
      new SolflareWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

const queryClient = new QueryClient();

const Providers: FC = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <ReactQueryDevtools />
    <WalletConnectionProvider>{children}</WalletConnectionProvider>
  </QueryClientProvider>
);
export default Providers;
