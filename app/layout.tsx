"use client";

import "../src/styles/globals.css"; // Import global styles
import { SessionProvider } from "next-auth/react";
import Navbar from "./components/Navbar";
import { ButtonProvider } from "./components/buttons/IconButton";
import { ToastProvider } from "./components/toasts/ToastProvider";
import StyledComponentsRegistry from "../lib/registry";
import { Lato } from "next/font/google";
import localFont from "next/font/local";

const kelsonSans = localFont({
    src: [
        {
            path: "../public/fonts/Kelson Sans Bold.otf",
            weight: "700",
            style: "normal"
        }
    ],
    display: "swap"
});

const lato = Lato({
    subsets: ["latin"],
    display: "swap",
    weight: ["400", "700"]
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" className={`${lato.className} ${kelsonSans.className}`}>
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
