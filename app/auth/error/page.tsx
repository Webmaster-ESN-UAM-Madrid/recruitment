'use client'

import { useSearchParams } from 'next/navigation';
import LoginProviders from "../../components/auth/LoginProviders";
import React, { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');

  const errors: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration.',
    AccessDenied: 'You do not have permission to sign in.',
    Verification: 'The token has expired or has already been used.',
    InvalidDomain: 'You must use an @esnuam.org email to sign in.',
    Default: 'Unable to sign in.',
  };

  const errorMessage = error && (errors[error] || errors.Default);

  return (
    <div>
      <h1>Authentication Error</h1>
      <p>{errorMessage}</p>
      <LoginProviders />
    </div>
  );
}

export default function Error() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
