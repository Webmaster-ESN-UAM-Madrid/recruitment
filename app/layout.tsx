'use client';

import "../src/styles/globals.css"; // Import global styles
import { SessionProvider } from "next-auth/react";
import Navbar from "./components/Navbar";
import { ButtonProvider } from "./components/buttons/IconButton";
import { ToastProvider } from "./components/toasts/ToastProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <ToastProvider>
            <ButtonProvider>
              <Navbar />
              {children}
            </ButtonProvider>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}