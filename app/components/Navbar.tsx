'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import styled from 'styled-components';
import { useEffect, useState, useCallback } from 'react';

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

  @media (max-width: 768px) {
    flex-direction: row; /* Keep row for main container on mobile */
    justify-content: space-between; /* Space out logo/title and menu button */
    padding: 10px;
    min-height: auto;
  }
`;

const NavLinks = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  width: 100%;

  @media (max-width: 768px) {
    display: none; /* Hide on mobile in main navbar */
  }
`;

const NavLinkContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
    justify-content: center;
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
  flex-shrink: 0;

  @media (min-width: 769px) {
    margin-left: auto; /* Push to right on desktop */
  }
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

const WarningDot = styled(NotificationDot)`
    background-color: var(--warning-color);
`;

const ErrorDot = styled(NotificationDot)`
    background-color: var(--error-color);
`;

const MenuButton = styled.button`
  display: none; /* Hidden on desktop */
  background: none;
  border: none;
  color: var(--navbar-text);
  font-size: 24px;
  cursor: pointer;

  @media (max-width: 768px) {
    display: block; /* Show on mobile */
  }
`;

const SidePanel = styled.div<{ $isOpen: boolean }>`
  display: flex;
  flex-direction: column;
  background-color: var(--navbar-bg);
  position: fixed;
  top: 0;
  left: ${({ $isOpen }) => ($isOpen ? '0' : '-100%')}; /* Slide in from left */
  width: 250px;
  height: 100%;
  padding: 20px;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2); /* Adjust shadow for left slide */
  transition: left 0.3s ease-in-out;
  z-index: 1000; /* Ensure panel is above overlay */

  @media (min-width: 769px) {
    display: none; /* Hidden on desktop */
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--navbar-text);
  font-size: 24px;
  cursor: pointer;
  align-self: flex-end;
  margin-bottom: 20px;
`;

const MobileNavLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
`;

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent black */
  z-index: 999; /* Below the side panel, above other content */
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  pointer-events: ${({ $isOpen }) => ($isOpen ? 'auto' : 'none')};
  transition: opacity 0.3s ease-in-out;

  @media (min-width: 769px) {
    display: none; /* Hidden on desktop */
  }
`;

const Navbar: React.FC = () => {
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRecruiter, setIsRecruiter] = useState(false);
  const [personalTasks, setPersonalTasks] = useState(0);
  const [hasGlobalTasks, setHasGlobalTasks] = useState(false);
  const [incidentWarnings, setIncidentWarnings] = useState(0);
  const [incidentErrors, setIncidentErrors] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const defaultAvatar = '/default-avatar.jpg';

  const fetchTasksStatus = useCallback(async () => {
    if (isRecruiter) {
        const res = await fetch('/api/tasks');
        if (res.ok) {
            const data = await res.json();
            setPersonalTasks(data.personalTasks);
            setHasGlobalTasks(data.hasGlobalTasks);
        }
    }
  }, [isRecruiter]);

  const fetchIncidentsStatus = useCallback(async () => {
      if (isRecruiter) {
          const res = await fetch('/api/incidents?status=true');
          if (res.ok) {
              const data = await res.json();
              setIncidentWarnings(data.warnings);
              setIncidentErrors(data.errors);
          }
      }
  }, [isRecruiter]);

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
    fetchTasksStatus();
    fetchIncidentsStatus();

    window.addEventListener('updateTasksDot', fetchTasksStatus);
    window.addEventListener('updateIncidentsDot', fetchIncidentsStatus);

    return () => {
        window.removeEventListener('updateTasksDot', fetchTasksStatus);
        window.removeEventListener('updateIncidentsDot', fetchIncidentsStatus);
    };
  }, [fetchIncidentsStatus, fetchTasksStatus, isRecruiter, session]);

  if (status === 'loading') {
    return null; // Or a loading spinner for the navbar
  }

  return (
    <>
      <NavContainer>
        {/* Mobile Menu Button (visible on mobile, hidden on desktop) */}
        <MenuButton onClick={() => setIsPanelOpen(true)}>
          ☰
        </MenuButton>

        {/* Desktop NavLinks (hidden on mobile) */}
        <NavLinks className="desktop-nav-links">
          {session && <NavLink href="/feedback">Feedback</NavLink>}
          {isRecruiter && <NavLink href="/dashboard">Dashboard</NavLink>}
          {isRecruiter && <NavLink href="/interviews">Entrevistas</NavLink>}
          {isRecruiter && <NavLink href="/stats">Estadísticas</NavLink>}
          {isRecruiter && (
              <NavLinkContainer>
                  <NavLink href="/tasks">Tareas</NavLink>
                  {(personalTasks > 0 || hasGlobalTasks) && (
                      <NotificationDot>{personalTasks > 0 ? personalTasks : '·'}</NotificationDot>
                  )}
              </NavLinkContainer>
          )}
          {isRecruiter && (
            <NavLinkContainer>
                <NavLink href="/incidents">Incidencias</NavLink>
                {incidentWarnings > 0 && <WarningDot>{incidentWarnings}</WarningDot>}
                {incidentErrors > 0 && <ErrorDot>{incidentErrors}</ErrorDot>}
            </NavLinkContainer>
          )}
          {isAdmin && <NavLink href="/admin">Administración</NavLink>}
        </NavLinks>

        {/* UserInfo (visible on both desktop and mobile, styled via media queries) */}
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

      {/* Side Panel for Mobile */}
      <SidePanel $isOpen={isPanelOpen}>
        <CloseButton onClick={() => setIsPanelOpen(false)}>
          &times;
        </CloseButton>
        <MobileNavLinks>
          {session && <NavLink href="/feedback" onClick={() => setIsPanelOpen(false)}>Feedback</NavLink>}
          {isRecruiter && <NavLink href="/dashboard" onClick={() => setIsPanelOpen(false)}>Dashboard</NavLink>}
          {isRecruiter && <NavLink href="/interviews" onClick={() => setIsPanelOpen(false)}>Entrevistas</NavLink>}
          {isRecruiter && <NavLink href="/stats" onClick={() => setIsPanelOpen(false)}>Estadísticas</NavLink>}
          {isRecruiter && (
              <NavLinkContainer>
                  <NavLink href="/tasks" onClick={() => setIsPanelOpen(false)}>Tareas</NavLink>
                  {(personalTasks > 0 || hasGlobalTasks) && (
                      <NotificationDot>{personalTasks > 0 ? personalTasks : '·'}</NotificationDot>
                  )}
              </NavLinkContainer>
          )}
          {isRecruiter && (
            <NavLinkContainer>
                <NavLink href="/incidents" onClick={() => setIsPanelOpen(false)}>Incidencias</NavLink>
                {incidentWarnings > 0 && <WarningDot>{incidentWarnings}</WarningDot>}
                {incidentErrors > 0 && <ErrorDot>{incidentErrors}</ErrorDot>}
            </NavLinkContainer>
          )}
          {isAdmin && <NavLink href="/admin" onClick={() => setIsPanelOpen(false)}>Administración</NavLink>}
        </MobileNavLinks>
      </SidePanel>

      {/* Overlay for Side Panel */}
      <Overlay $isOpen={isPanelOpen} onClick={() => setIsPanelOpen(false)} />
    </>
  );
};

export default Navbar;