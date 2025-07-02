'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminPanelPage from '../../src/components/pages/AdminPanelPage';

export default function Admin() {
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
      const response = await fetch('/api/access/admin');
      const data = await response.json();
      if (!data.isAdmin) {
        router.push('/auth/signin'); // Redirect to signin if not authorized
      } else {
        setHasAccess(true);
      }
    };

    checkAccess();
  }, [session, status, router]);

  if (status === 'loading' || !hasAccess) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return <AdminPanelPage />;
}