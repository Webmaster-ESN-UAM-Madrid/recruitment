'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProfilePage from '../../src/components/pages/ProfilePage';
import LoadingSpinner from '../components/loaders/LoadingSpinner';

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    const checkAccess = async () => {
      const response = await fetch('/api/access/recruiter');
      const data = await response.json();
      if (!data.hasAccess) {
        router.push('/auth/signin');
      } else {
        setHasAccess(true);
      }
    };

    checkAccess();
  }, [session, status, router]);

  if (status === 'loading' || !hasAccess) {
    return <LoadingSpinner />;
  }

  return <ProfilePage />;
}