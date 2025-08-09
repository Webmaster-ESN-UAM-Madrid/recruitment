'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingSpinner from '../components/loaders/LoadingSpinner';
import RecruitmentStatsPage from '../components/pages/RecruitmentStatsPage';

export default function Stats() {
  const { status } = useSession();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    const checkAccess = async () => {
      const response = await fetch('/api/access/recruitment');
      const data = await response.json();
      if (!data.hasRecruitmentAccess) {
        router.push('/auth/signin');
      } else {
        setHasAccess(true);
      }
    };

    checkAccess();
  }, [status, router]);

  if (status === 'loading' || !hasAccess) {
    return <LoadingSpinner />;
  }

  return <RecruitmentStatsPage />;
}
