/* eslint-disable @typescript-eslint/no-explicit-any */

'use client'

import { getProviders, signIn } from "next-auth/react";
import React from "react";

export default function LoginProviders() {
  const [providers, setProviders] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };
    fetchProviders();
  }, []);

  if (!providers) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {Object.values(providers).map((provider: any) => (
        <div key={provider.name}>
          <button onClick={() => signIn(provider.id, { callbackUrl: "/" })}>
            Sign in with {provider.name}
          </button>
        </div>
      ))}
    </div>
  );
}
