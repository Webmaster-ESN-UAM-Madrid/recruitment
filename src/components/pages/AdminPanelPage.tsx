import React, { useEffect, useState } from 'react';
import GlobalConfigManager from '@/app/components/admin/GlobalConfigManager';
import styled from 'styled-components';
import Tooltip from '@mui/material/Tooltip';
import { DeleteButton as IconDeleteButton } from '@/app/components/buttons/DeleteButton';
import Image from 'next/image';

const PageContainer = styled.div`
  padding: 20px;
`;

const Subtitle = styled.h3`
  color: #333;
  margin-top: 50px;
  margin-bottom: 15px;
  font-family: 'Montserrat', sans-serif;
`;

const Card = styled.div`
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  margin: 0 auto;
  max-width: 1000px;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  width: 100%;
`;

const UsersHeader = styled.div`
  display: grid;
  grid-template-columns: 50px 1fr 1.5fr 80px;
  gap: 10px;
  align-items: center;
  padding: 10px 0;
  font-weight: bold;
  border-bottom: 2px solid #ccc;
`;

const UsersRow = styled.div`
  display: grid;
  grid-template-columns: 50px 1fr 1.5fr 80px;
  gap: 10px;
  align-items: center;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
`;

const AvatarCell = styled.div`
  width: 50px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;

const NameCell = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Montserrat', sans-serif;
  font-size: 14px;
  line-height: 1.2;
  min-width: 0; /* allow children to shrink for ellipsis */
  flex: 1;
`;

const AvatarPlaceholder = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 100%;
  background: #e5e7eb;
  color: #374151;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 14px;
`;

const InnerContent = styled.div`
  padding: 0 32px;
  font-family: 'Montserrat', sans-serif;
  @media (max-width: 768px) {
    padding: 0 15px;
  }
`;

const DataCell = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #333;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.2;
  min-width: 0;
  flex: 1;
`;

const HeaderCell = styled.div`
  color: #333;
  font-weight: 700;
  font-size: 14px;
`;


interface AdminUser {
  _id: string;
  name: string;
  email: string;
  image?: string;
}

const AdminPanelPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error('Failed to fetch users', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.');
    if (!confirm) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u._id !== id));
      } else {
        const { message } = await res.json().catch(() => ({ message: 'Error' }));
        alert(message || 'No se pudo eliminar el usuario');
      }
    } catch (e) {
      console.error('Failed to delete user', e);
      alert('Error eliminando el usuario');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <PageContainer>
      <h1>Panel de Administración</h1>
      <GlobalConfigManager />
      <Card>
        <TableWrapper>
          <InnerContent>
            <Subtitle>Usuarios registrados</Subtitle>
            {loading ? (
              <p>Cargando...</p>
            ) : users.length === 0 ? (
              <p>No hay usuarios registrados.</p>
            ) : (
              <>
                <UsersHeader>
                  <div />
                  <HeaderCell>Nombre</HeaderCell>
                  <HeaderCell>Correo</HeaderCell>
                  <HeaderCell>Acciones</HeaderCell>
                </UsersHeader>
                {users.map((u) => (
                  <UsersRow key={u._id}>
                    <AvatarCell>
                      {u.image ? (
                        <Image src={u.image} alt="Profile" width={40} height={40} style={{ borderRadius: '100%' }} />
                      ) : (
                        <AvatarPlaceholder>{(u.name || u.email || '?').slice(0,2)}</AvatarPlaceholder>
                      )}
                    </AvatarCell>
                    <NameCell>
                      <DataCell>{u.name}</DataCell>
                    </NameCell>
                    <DataCell>{u.email}</DataCell>
                    <div>
                      <IconDeleteButton
                        onClick={() => handleDelete(u._id)}
                        disabled={deletingId === u._id}
                        iconSize={20}
                      />
                    </div>
                
  </UsersRow>
                ))}
              </>
            )}
          </InnerContent>
        </TableWrapper>
      </Card>
    </PageContainer>
  );
};

export default AdminPanelPage;