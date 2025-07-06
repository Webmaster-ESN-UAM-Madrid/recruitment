'use client';

import "../src/styles/globals.css"; // Import global styles
import { SessionProvider } from "next-auth/react";
import Navbar from "./components/Navbar";
import { ButtonProvider } from "./components/buttons/IconButton";
import { ToastProvider } from "./components/toasts/ToastProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Recruitment ESN UAM</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Recruitment App for ESN UAM" />
        <link rel="icon" href="/favicon.ico" />
      </head>
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