/* eslint-disable @typescript-eslint/no-explicit-any */

'use client'

import { getProviders, signIn } from "next-auth/react";
import React from "react";
import LoadingSpinner from "../loaders/LoadingSpinner";
import LoadingButton from "../loaders/LoadingButton";

export default function LoginProviders() {
  const [providers, setProviders] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchProviders = async () => {
      setIsLoading(true);
      const res = await getProviders();
      setProviders(res);
      setIsLoading(false);
    };
    fetchProviders();
  }, []);

  if (!providers) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      {Object.values(providers).map((provider: any) => (
        <div key={provider.name}>
          <LoadingButton isLoading={isLoading} onClick={() => signIn(provider.id, { callbackUrl: "/" })}>
            Iniciar sesión con {provider.name}
          </LoadingButton>
        </div>
      ))}
    </div>
  );
}
