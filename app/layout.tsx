"use client";

import "../src/styles/globals.css"; // Import global styles
import { SessionProvider } from "next-auth/react";
import Navbar from "../src/components/Navbar";
import { ButtonProvider } from "../src/components/buttons/IconButton";
import { ToastProvider } from "../src/components/toasts/ToastProvider";
import StyledComponentsRegistry from "../lib/registry";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <title>Recruitment ESN UAM</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Recruitment App for ESN UAM" />
        <link rel="icon" href="/favicon.png" />
      </head>
      <body>
        <StyledComponentsRegistry>
          <SessionProvider>
            <ToastProvider>
              <Navbar />
              <ButtonProvider>{children}</ButtonProvider>
            </ToastProvider>
          </SessionProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
