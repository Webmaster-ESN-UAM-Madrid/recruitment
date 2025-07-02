import React from 'react';
import ConnectForm from '../../../app/components/admin/ConnectForm';
import GlobalConfigManager from '../../../app/components/admin/GlobalConfigManager';
import styled from 'styled-components';

const PageContainer = styled.div`
  padding: 20px;
`;

const AdminPanelPage: React.FC = () => {
  return (
    <PageContainer>
      <h1>Panel de Administración</h1>
      <p>Gestiona la configuración de reclutamiento, usuarios y registros.</p>
      <GlobalConfigManager />
      <ConnectForm />
    </PageContainer>
  );
};

export default AdminPanelPage;