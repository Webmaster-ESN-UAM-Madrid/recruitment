'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { IInterview } from '@/lib/models/interview';
import { ICandidate } from '@/lib/models/candidate';

const NavContainer = styled.nav`
  background-color: var(--navbar-bg);
  padding: 8px 20px;
  color: var(--navbar-text);
  display: flex;
  justify-content: center; /* Center the NavLinks container */
  align-items: center;
  position: relative; /* Allow absolute positioning for UserInfo */
  border-bottom: 1px solid var(--navbar-border);
  border-radius: var(--border-radius-md);
  min-height: 50px;
`;

const NavLinks = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
`;

const NavLinkContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 5px; /* Space between link and dot */
`;

const NavLink = styled(Link)`
  color: var(--navbar-text);
  text-decoration: none;
  font-weight: 500;
  &:hover {
    color: var(--link-hover-color);
  }
  display: flex;
  justify-content: center;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  position: absolute;
  right: 20px;
`;

const ProfilePicture = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  border: 2px solid var(--border-primary);
`;

const NotificationDot = styled.div`
    background-color: var(--brand-primary);
    color: white;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 10px;
    font-weight: bold;
`;

const Navbar: React.FC = () => {
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRecruiter, setIsRecruiter] = useState(false);
  const [personalTasks, setPersonalTasks] = useState(0);
  const [hasGlobalTasks, setHasGlobalTasks] = useState(false);

  const defaultAvatar = '/default-avatar.jpg';

  useEffect(() => {
    const checkAccess = async () => {
      if (status === 'authenticated') {
        const adminRes = await fetch('/api/access/admin');
        const adminData = await adminRes.json();
        setIsAdmin(adminData.isAdmin);

        if (!adminData.isAdmin) {
          const recruiterRes = await fetch('/api/access/recruiter');
          const recruiterData = await recruiterRes.json();
          setIsRecruiter(recruiterData.hasAccess);
        } else {
          setIsRecruiter(true);
        }
      }
    };
    checkAccess();
  }, [session, status]);

  useEffect(() => {
    const fetchTasks = async () => {
        if (isRecruiter) {
            const [interviewsRes, candidatesRes] = await Promise.all([
                fetch('/api/interviews/new'),
                fetch('/api/candidates'),
            ]);

            if (interviewsRes.ok) {
                const interviews: IInterview[] = await interviewsRes.json();
                const pendingFeedback = interviews.filter(interview => {
                    if (!session?.user?.id || !interview.interviewers.includes(session.user.id)) {
                        return false;
                    }
                    for (const candidateId of interview.candidates) {
                        if (!interview.opinions[candidateId]?.interviewers[session.user.id]?.opinion) {
                            return true;
                        }
                    }
                    return false;
                });
                setPersonalTasks(pendingFeedback.length);
            }

            if (candidatesRes.ok) {
                const candidates: ICandidate[] = await candidatesRes.json();
                const pendingEmails = candidates.some(c => !c.emailSent);
                setHasGlobalTasks(pendingEmails);
            }
        }
    };
    fetchTasks();
  }, [isRecruiter, session]);

  if (status === 'loading') {
    return null; // Or a loading spinner for the navbar
  }

  return (
    <NavContainer>
      <NavLinks>
        {session && <NavLink href="/feedback">Feedback</NavLink>} {/* Do not translate this line */}
        {isRecruiter && <NavLink href="/dashboard">Dashboard</NavLink>} {/* Do not translate this line */}
        {isRecruiter && <NavLink href="/interviews">Entrevistas</NavLink>}
        {isRecruiter && (
            <NavLinkContainer>
                <NavLink href="/tasks">Tareas</NavLink>
                {(personalTasks > 0 || hasGlobalTasks) && (
                    <NotificationDot>{personalTasks > 0 ? personalTasks : '·'}</NotificationDot>
                )}
            </NavLinkContainer>
        )}
        {/* {isRecruiter && <NavLink href="/incidents">Incidencias</NavLink>} */}
        {isAdmin && <NavLink href="/admin">Administración</NavLink>}
      </NavLinks>
      <UserInfo>
        {session?.user?.image ? (
          <ProfilePicture src={session.user.image} onError={(e) => (e.currentTarget.src = defaultAvatar)} alt="Perfil" />
        ) : session?.user?.name ? (
          <span>{session.user.name}</span>
        ) : (
          <NavLink href="/auth/signin">Iniciar Sesión</NavLink>
        )}
        {session && <NavLink href="/auth/signout">Cerrar Sesión</NavLink>}
      </UserInfo>
    </NavContainer>
  );
};

export default Navbar;