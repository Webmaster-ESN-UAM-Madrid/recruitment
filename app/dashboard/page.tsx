"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardPage from "../../src/components/pages/DashboardPage";
import LoadingSpinner from "../../src/components/loaders/LoadingSpinner";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    const checkAccess = async () => {
      const response = await fetch("/api/access/recruiter");
      const data = await response.json();
      if (!data.hasAccess) {
        router.push("/auth/signin");
      } else {
        setHasAccess(true);
      }
    };

    checkAccess();
  }, [session, status, router]);

  if (status === "loading" || !hasAccess) {
    return <LoadingSpinner />;
  }

  return <DashboardPage />;
}
