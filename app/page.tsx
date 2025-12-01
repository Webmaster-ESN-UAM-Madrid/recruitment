"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoginProviders from "../src/components/auth/LoginProviders";
import styled from "styled-components";
import LoadingSpinner from "../src/components/loaders/LoadingSpinner";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 0 20px;
  text-align: center;
`;

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: 800;
  background: linear-gradient(to right, var(--brand-primary), var(--brand-primary-dark));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1.5rem;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.25rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin-bottom: 3rem;
  line-height: 1.6;
`;

const Card = styled.div`
  background: var(--bg-primary);
  padding: 40px;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 450px;
  border: 1px solid var(--border-primary);
`;

const WelcomeMessage = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-primary);
`;

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const checkAccessAndRedirect = async () => {
      if (status === "authenticated") {
        try {
          // Check for admin access first
          const adminRes = await fetch("/api/access/admin");
          const adminData = await adminRes.json();

          if (adminData.isAdmin) {
            router.push("/dashboard");
            return;
          }

          // Check for recruiter access
          const recruiterRes = await fetch("/api/access/recruiter");
          const recruiterData = await recruiterRes.json();

          if (recruiterData.hasAccess) {
            router.push("/dashboard");
            return;
          }

          // Default to feedback for other authenticated users
          router.push("/feedback");
        } catch (error) {
          console.error("Error checking access:", error);
          // Fallback to feedback on error
          router.push("/feedback");
        }
      }
    };

    checkAccessAndRedirect();
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <Container>
        <LoadingSpinner />
      </Container>
    );
  }

  return (
    <Container>
      <HeroTitle>Recruitment ESN UAM</HeroTitle>
      <HeroSubtitle>
        Plataforma de gestión de procesos de selección y entrevistas.
        Accede para gestionar candidatos o consultar el estado.
      </HeroSubtitle>
      <Card>
        <WelcomeMessage>Iniciar Sesión</WelcomeMessage>
        <LoginProviders />
      </Card>
    </Container>
  );
}
