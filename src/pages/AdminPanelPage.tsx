
import React from 'react';
import ConnectForm from '../../app/components/admin/ConnectForm';
import GlobalConfigManager from '../../app/components/admin/GlobalConfigManager';
import styled from 'styled-components';

const PageContainer = styled.div`
  padding: 20px;
`;

const AdminPanelPage: React.FC = () => {
  return (
    <PageContainer>
      <h1>Admin Panel Page</h1>
      <p>Manage recruitment settings, users, and logs.</p>
      {/* TODO: Implement Recruitment Settings, Recruiter List, Logs, and Google Forms Linker */}
      <GlobalConfigManager />
      <ConnectForm />
    </PageContainer>
  );
};

export default AdminPanelPage;
