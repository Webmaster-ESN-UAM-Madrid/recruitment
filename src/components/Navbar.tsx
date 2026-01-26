"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";
import { useEffect, useState, useCallback } from "react";

const NavContainer = styled.nav`
  background-color: var(--navbar-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 12px 24px;
  color: var(--navbar-text);
  display: flex;
  justify-content: center; /* Center the NavLinks container */
  align-items: center;
  position: sticky; /* Sticky navbar */
  top: 0;
  z-index: 100;
  border-bottom: 1px solid var(--navbar-border);
  min-height: 64px;
  width: 100%;

  @media (max-width: 1024px) {
    flex-direction: row; /* Keep row for main container on mobile */
    justify-content: space-between; /* Space out logo/title and menu button */
    padding: 12px 16px;
  }
`;

const NavLinks = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;
  width: 100%;
  max-width: 1200px;

  @media (max-width: 1024px) {
    display: none; /* Hide on mobile in main navbar */
  }
`;

const NavLinkContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  position: relative;
`;

const NavLink = styled(Link)`
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  transition: color 0.2s ease;
  padding: 8px 12px;
  border-radius: var(--border-radius-sm);

  &:hover {
    color: var(--brand-primary);
    background-color: var(--bg-secondary);
  }
  
  display: flex;
  justify-content: center;
  align-items: center;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;

  @media (min-width: 1025px) {
    margin-left: auto; /* Push to right on desktop */
  }
`;

const ProfilePicture = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  border: 2px solid var(--border-primary);
  transition: border-color 0.2s;

  &:hover {
    border-color: var(--brand-primary);
  }
`;

const NotificationDot = styled.div`
  background-color: var(--brand-primary);
  color: white;
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  position: absolute;
  top: -5px;
  right: -10px;
  box-shadow: 0 0 0 2px var(--bg-primary);
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
  color: var(--text-primary);
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  border-radius: var(--border-radius-sm);

  &:hover {
    background-color: var(--bg-secondary);
  }

  @media (max-width: 1024px) {
    display: block; /* Show on mobile */
  }
`;

const SidePanel = styled.div<{ $isOpen: boolean }>`
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
  position: fixed;
  top: 0;
  left: ${({ $isOpen }) => ($isOpen ? "0" : "-100%")}; /* Slide in from left */
  width: 280px;
  height: 100%;
  padding: 24px;
  box-shadow: var(--shadow-lg);
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000; /* Ensure panel is above overlay */

  @media (min-width: 1025px) {
    display: none; /* Hidden on desktop */
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 24px;
  cursor: pointer;
  align-self: flex-end;
  margin-bottom: 32px;
  padding: 4px;
  
  &:hover {
    color: var(--text-primary);
  }
`;

const MobileNavLinks = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
`;

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent black */
  backdrop-filter: blur(4px);
  z-index: 999; /* Below the side panel, above other content */
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  pointer-events: ${({ $isOpen }) => ($isOpen ? "auto" : "none")};
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

  const defaultAvatar = "/default-avatar.jpg";

  const fetchTasksStatus = useCallback(async () => {
    if (isRecruiter) {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setPersonalTasks(data.personalTasks);
        setHasGlobalTasks(data.hasGlobalTasks);
      }
    }
  }, [isRecruiter]);

  const fetchIncidentsStatus = useCallback(async () => {
    if (isRecruiter) {
      const res = await fetch("/api/incidents?status=true");
      if (res.ok) {
        const data = await res.json();
        setIncidentWarnings(data.warnings);
        setIncidentErrors(data.errors);
      }
    }
  }, [isRecruiter]);

  useEffect(() => {
    const checkAccess = async () => {
      if (status === "authenticated") {
        const adminRes = await fetch("/api/access/admin");
        const adminData = await adminRes.json();
        setIsAdmin(adminData.isAdmin);

        if (!adminData.isAdmin) {
          const recruiterRes = await fetch("/api/access/recruiter");
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

    window.addEventListener("updateTasksDot", fetchTasksStatus);
    window.addEventListener("updateIncidentsDot", fetchIncidentsStatus);

    return () => {
      window.removeEventListener("updateTasksDot", fetchTasksStatus);
      window.removeEventListener("updateIncidentsDot", fetchIncidentsStatus);
    };
  }, [fetchIncidentsStatus, fetchTasksStatus, isRecruiter, session]);

  const pathname = usePathname();

  if (status === "loading") {
    return null; // Or a loading spinner for the navbar
  }

  // Hide navbar on auth pages or on landing page if not authenticated
  if (pathname?.startsWith("/auth") || (pathname === "/" && status === "unauthenticated")) {
    return null;
  }

  return (
    <>
      <NavContainer>
        {/* Mobile Menu Button (visible on mobile, hidden on desktop) */}
        <MenuButton onClick={() => setIsPanelOpen(true)}>☰</MenuButton>

        {/* Desktop NavLinks (hidden on mobile) */}
        <NavLinks className="desktop-nav-links">
          {session && <NavLink href="/feedback">Feedback</NavLink>}
          {isRecruiter && <NavLink href="/dashboard">Dashboard</NavLink>}
          {isRecruiter && <NavLink href="/interviews">Entrevistas</NavLink>}
          {isRecruiter && <NavLink href="/activities">Actividades</NavLink>}
          {isRecruiter && <NavLink href="/stats">Estadísticas</NavLink>}
          {isRecruiter && (
            <NavLinkContainer>
              <NavLink href="/tasks">Tareas</NavLink>
              {(personalTasks > 0 || hasGlobalTasks) && (
                <NotificationDot>{personalTasks > 0 ? personalTasks : "·"}</NotificationDot>
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
            <ProfilePicture
              src={session.user.image}
              onError={(e) => (e.currentTarget.src = defaultAvatar)}
              alt="Perfil"
            />
          ) : session?.user?.name ? (
            <span>{session.user.name}</span>
          ) : (
            <NavLink href="/auth/signin">Iniciar Sesión</NavLink>
          )}
          {session && (
            <NavLink
              href="/auth/signout"
              style={{ display: "none" }} // Default hidden, shown via media query if needed, but here we want to hide on mobile
              className="desktop-logout"
            >
              Cerrar Sesión
            </NavLink>
          )}
          <style jsx global>{`
            @media (max-width: 1024px) {
              .desktop-logout {
                display: none !important;
              }
            }
            @media (min-width: 1025px) {
              .desktop-logout {
                display: flex !important;
              }
            }
          `}</style>
        </UserInfo>
      </NavContainer>

      {/* Side Panel for Mobile */}
      <SidePanel $isOpen={isPanelOpen}>
        <CloseButton onClick={() => setIsPanelOpen(false)}>&times;</CloseButton>
        <MobileNavLinks>
          {session && (
            <NavLink href="/feedback" onClick={() => setIsPanelOpen(false)}>
              Feedback
            </NavLink>
          )}
          {isRecruiter && (
            <NavLink href="/dashboard" onClick={() => setIsPanelOpen(false)}>
              Dashboard
            </NavLink>
          )}
          {isRecruiter && (
            <NavLink href="/interviews" onClick={() => setIsPanelOpen(false)}>
              Entrevistas
            </NavLink>
          )}
          {isRecruiter && (
            <NavLink href="/activities" onClick={() => setIsPanelOpen(false)}>
              Actividades
            </NavLink>
          )}
          {isRecruiter && (
            <NavLink href="/stats" onClick={() => setIsPanelOpen(false)}>
              Estadísticas
            </NavLink>
          )}
          {isRecruiter && (
            <NavLinkContainer>
              <NavLink href="/tasks" onClick={() => setIsPanelOpen(false)}>
                Tareas
              </NavLink>
              {(personalTasks > 0 || hasGlobalTasks) && (
                <NotificationDot>{personalTasks > 0 ? personalTasks : "·"}</NotificationDot>
              )}
            </NavLinkContainer>
          )}
          {isRecruiter && (
            <NavLinkContainer>
              <NavLink href="/incidents" onClick={() => setIsPanelOpen(false)}>
                Incidencias
              </NavLink>
              {incidentWarnings > 0 && <WarningDot>{incidentWarnings}</WarningDot>}
              {incidentErrors > 0 && <ErrorDot>{incidentErrors}</ErrorDot>}
            </NavLinkContainer>
          )}
          {isAdmin && (
            <NavLink href="/admin" onClick={() => setIsPanelOpen(false)}>
              Administración
            </NavLink>
          )}
          {session && (
            <NavLink href="/auth/signout" onClick={() => setIsPanelOpen(false)}>
              Cerrar Sesión
            </NavLink>
          )}
        </MobileNavLinks>
      </SidePanel>

      {/* Overlay for Side Panel */}
      <Overlay $isOpen={isPanelOpen} onClick={() => setIsPanelOpen(false)} />
    </>
  );
};

export default Navbar;
