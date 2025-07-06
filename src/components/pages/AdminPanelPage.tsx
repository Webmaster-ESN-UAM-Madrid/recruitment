import React from 'react';
import GlobalConfigManager from '@/app/components/admin/GlobalConfigManager';
import styled from 'styled-components';

const PageContainer = styled.div`
  padding: 20px;
`;

const AdminPanelPage: React.FC = () => {
  return (
    <PageContainer>
      <h1>Panel de Administración</h1>
      <GlobalConfigManager />
    </PageContainer>
  );
};

export default AdminPanelPage;