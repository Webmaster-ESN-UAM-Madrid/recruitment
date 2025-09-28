"use client";

import { useSearchParams } from "next/navigation";
import LoginProviders from "../../components/auth/LoginProviders";
import React, { Suspense } from "react";

import LoadingSpinner from "../../components/loaders/LoadingSpinner";

function SignInContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");

  const errors: Record<string, string> = {
    Configuration: "Hay un problema con la configuración del servidor.",
    AccessDenied: "No tienes permiso para iniciar sesión.",
    Verification: "El token ha expirado o ya ha sido utilizado.",
    Default: "No se pudo iniciar sesión."
  };

  const errorMessage = error && (errors[error] || errors.Default);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Iniciar Sesión</h1>
      {errorMessage && <p>{errorMessage}</p>}
      <LoginProviders />
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SignInContent />
    </Suspense>
  );
}
