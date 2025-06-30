
'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import LoginProviders from "./components/auth/LoginProviders";

export default function Home() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div>
        <h1>Welcome, {session.user?.name}</h1>
        <Link href="/api/auth/signout">Sign out</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome to ESN Recruitment</h1>
      <p>You can now proceed to set up Google OAuth in Google Cloud Platform.</p>
      <LoginProviders />
    </div>
  );
  }
