'use client';

import { useEffect, useState } from 'react';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const client = createPublicClient({
  chain: base,
  transport: http(),
});

interface BaseNameProps {
  address: `0x${string}`;
  className?: string;
}

export function BaseName({ address, className = '' }: BaseNameProps) {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ensName = await client.getEnsName({ address });
        if (!cancelled && ensName) setName(ensName);
      } catch {
        // Basename/ENS resolution not available
      }
    })();
    return () => { cancelled = true; };
  }, [address]);

  return (
    <span className={className}>
      {name ?? `${address.slice(0, 6)}...${address.slice(-4)}`}
    </span>
  );
}
