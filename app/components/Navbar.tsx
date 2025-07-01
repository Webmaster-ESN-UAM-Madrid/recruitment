'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import styled from 'styled-components';
import { useEffect, useState } from 'react';

const NavContainer = styled.nav`
  background-color: #333;
  padding: 10px 20px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 20px;
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Navbar: React.FC = () => {
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (status === 'authenticated') {
        const res = await fetch('/api/access/admin');
        const data = await res.json();
        setIsAdmin(data.hasAccess);
      }
    };
    checkAdmin();
  }, [session, status]);

  if (status === 'loading') {
    return null; // Or a loading spinner for the navbar
  }

  return (
    <NavContainer>
      <NavLinks>
        <NavLink href="/dashboard">Dashboard</NavLink>
        <NavLink href="/feedback">Feedback</NavLink>
        <NavLink href="/incidents">Incidents</NavLink>
        {isAdmin && <NavLink href="/admin">Admin</NavLink>}
      </NavLinks>
      <UserInfo>
        {session?.user?.name ? (
          <span>Welcome, {session.user.name}</span>
        ) : (
          <NavLink href="/auth/signin">Sign In</NavLink>
        )}
        {session && <NavLink href="/auth/signout">Sign Out</NavLink>}
      </UserInfo>
    </NavContainer>
  );
};

export default Navbar;
