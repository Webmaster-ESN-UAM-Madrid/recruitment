"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ActivitiesPage from "../../src/components/pages/ActivitiesPage";
import LoadingSpinner from "../../src/components/loaders/LoadingSpinner";

export default function Activities() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isRecruiter, setIsRecruiter] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    const checkAccess = async () => {
      try {
        const res = await fetch("/api/access/recruiter");
        const data = await res.json();
        setIsRecruiter(data.hasAccess);
        if (!data.hasAccess) {
          router.push("/feedback");
        }
      } catch (error) {
        console.error("Error checking recruiter access", error);
        router.push("/feedback");
      }
    };

    checkAccess();
  }, [status, router]);

  if (status === "loading" || isRecruiter === null) {
    return <LoadingSpinner />;
  }

  return <ActivitiesPage />;
}
