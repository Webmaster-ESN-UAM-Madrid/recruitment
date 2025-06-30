
'use client'

import { signOut } from "next-auth/react";

export default function SignOut() {
  return (
    <div>
      <h1>Sign Out</h1>
      <p>Are you sure you want to sign out?</p>
      <button onClick={() => signOut({ callbackUrl: "/" })}>Sign out</button>
    </div>
  );
}
