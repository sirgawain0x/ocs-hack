'use client';

import { useEffect, useState } from 'react';
import { createPublicClient, http } from 'viem';
import { normalize } from 'viem/ens';
import { base } from 'viem/chains';

const client = createPublicClient({
  chain: base,
  transport: http(),
});

interface BaseAvatarProps {
  address?: `0x${string}`;
  className?: string;
  defaultComponent?: React.ReactNode;
}

export function BaseAvatar({ address, className = '', defaultComponent }: BaseAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;

    let cancelled = false;
    (async () => {
      try {
        const name = await client.getEnsName({ address });
        if (name && !cancelled) {
          const avatar = await client.getEnsAvatar({ name: normalize(name) });
          if (!cancelled) setAvatarUrl(avatar);
        }
      } catch {
        // Basename/ENS resolution not available — fall through to default
      }
    })();
    return () => { cancelled = true; };
  }, [address]);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt="avatar"
        className={`rounded-full object-cover ${className}`}
      />
    );
  }

  return <>{defaultComponent ?? null}</>;
}
