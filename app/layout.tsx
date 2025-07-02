'use client';

import "../src/styles/globals.css"; // Import global styles
import { SessionProvider } from "next-auth/react";
import Navbar from "./components/Navbar";
import { ButtonProvider } from "./components/buttons/IconButton";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <ButtonProvider>
            <Navbar />
            {children}
          </ButtonProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
