
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import IncidentsPage from '../../src/components/pages/IncidentsPage';
import LoadingSpinner from '../components/loaders/LoadingSpinner';

export default function Incidents() {
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

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('updateIncidentsDot'));
  }, []);

  if (status === 'loading' || !hasAccess) {
    return <LoadingSpinner />;
  }

  return <IncidentsPage />;
}
