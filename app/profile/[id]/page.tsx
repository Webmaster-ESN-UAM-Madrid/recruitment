"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ProfilePage from "../../../src/components/pages/ProfilePage";
import LoadingSpinner from "../../../src/components/loaders/LoadingSpinner";

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [hasAccess, setHasAccess] = useState(false);
  const [isTutor, setIsTutor] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    const checkAccess = async () => {
      const candidateId = (params as { id?: string })?.id;
      if (!candidateId) {
        router.push("/auth/signin");
        return;
      }

      try {
        // Check recruiter first
        const recruiterRes = await fetch("/api/access/recruiter");
        const recruiterData = recruiterRes.ok ? await recruiterRes.json() : { hasAccess: false };
        if (recruiterData.hasAccess) {
          setHasAccess(true);
          setIsTutor(false);
          return;
        }

        // Not a recruiter: check tutor access
        const tutorRes = await fetch(`/api/access/tutor/${candidateId}`);
        const tutorData = tutorRes.ok ? await tutorRes.json() : { hasAccess: false };
        if (!tutorData.hasAccess) {
          router.push("/auth/signin");
          return;
        }

        setHasAccess(true);
        setIsTutor(true);
      } catch (err) {
        console.error("Access check failed", err);
        router.push("/auth/signin");
      }
    };

    checkAccess();
  }, [session, status, router]);

  if (status === "loading" || !hasAccess) {
    return <LoadingSpinner />;
  }

  return <ProfilePage isTutor={isTutor} />;
}
