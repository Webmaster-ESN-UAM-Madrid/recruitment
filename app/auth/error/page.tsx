'use client'

import { useSearchParams } from 'next/navigation';
import LoginProviders from "../../components/auth/LoginProviders";
import React, { Suspense } from "react";

import LoadingSpinner from "../../components/loaders/LoadingSpinner";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');

  const errors: Record<string, string> = {
    Configuration: 'Hay un problema con la configuración del servidor.',
    AccessDenied: 'No tienes permiso para iniciar sesión.',
    Verification: 'El token ha expirado o ya ha sido utilizado.',
    InvalidDomain: 'Debes usar un correo electrónico @esnuam.org para iniciar sesión.',
    Default: 'No se pudo iniciar sesión.',
  };

  const errorMessage = error && (errors[error] || errors.Default);

  return (
    <div>
      <h1>Error de Autenticación</h1>
      <p>{errorMessage}</p>
      <LoginProviders />
    </div>
  );
}

export default function Error() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ErrorContent />
    </Suspense>
  );
}
