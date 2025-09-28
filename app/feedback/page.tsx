"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import FeedbackPage from "../../src/components/pages/FeedbackPage";
import LoadingSpinner from "../components/loaders/LoadingSpinner";

const MAX_NEWBIE_SELECTIONS = 5;

export default function Feedback() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <LoadingSpinner />;
  }

  return <FeedbackPage maxNewbieSelections={MAX_NEWBIE_SELECTIONS} />;
}
