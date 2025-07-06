
'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import LoginProviders from "./components/auth/LoginProviders";

export default function Home() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1>Bienvenido, {session.user?.name}</h1>
        <Link href="/api/auth/signout">Cerrar sesión</Link>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Recruitment ESN UAM</h1>
      <LoginProviders />
    </div>
  );
  }
