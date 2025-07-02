'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import styled from 'styled-components';
import { useEffect, useState } from 'react';

const NavContainer = styled.nav`
  background-color: #ffffff; /* White background */
  padding: 8px 20px; /* Slimmer padding */
  color: #333; /* Darker text for light background */
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color); /* Gray separator */
  border-radius: var(--border-radius-md); /* Rounded corners */
`;

const NavLinks = styled.div`
  display: flex;
  flex-grow: 1; /* Take available space */
  justify-content: center; /* Center links horizontally */
  align-items: center; /* Center links vertically */
  gap: 20px;
`;

const NavLink = styled(Link)`
  color: #333; /* Darker text for links */
  text-decoration: none;
  font-weight: 500;
  &:hover {
    color: #007bff; /* Hover effect */
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ProfilePicture = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  border: 2px solid var(--border-color);
`;

const Navbar: React.FC = () => {
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRecruiter, setIsRecruiter] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (status === 'authenticated') {
        const adminRes = await fetch('/api/access/admin');
        const adminData = await adminRes.json();
        setIsAdmin(adminData.isAdmin);

        const recruiterRes = await fetch('/api/access/recruiter');
        const recruiterData = await recruiterRes.json();
        setIsRecruiter(recruiterData.hasAccess);
      }
    };
    checkAccess();
  }, [session, status]);

  if (status === 'loading') {
    return null; // Or a loading spinner for the navbar
  }

  return (
    <NavContainer>
      <NavLinks>
        {isRecruiter && <NavLink href="/dashboard">Dashboard</NavLink>} {/* Do not translate this line */}
        {session && <NavLink href="/feedback">Feedback</NavLink>} {/* Do not translate this line */}
        {isRecruiter && <NavLink href="/incidents">Incidencias</NavLink>}
        {isAdmin && <NavLink href="/admin">Administración</NavLink>}
      </NavLinks>
      <UserInfo>
        {session?.user?.image ? (
          <NavLink href="/profile">
            <ProfilePicture src={session.user.image} alt="Perfil" />
          </NavLink>
        ) : session?.user?.name ? (
          <NavLink href="/profile">
            <span>{session.user.name}</span>
          </NavLink>
        ) : (
          <NavLink href="/auth/signin">Iniciar Sesión</NavLink>
        )}
        {session && <NavLink href="/auth/signout">Cerrar Sesión</NavLink>}
      </UserInfo>
    </NavContainer>
  );
};

export default Navbar;