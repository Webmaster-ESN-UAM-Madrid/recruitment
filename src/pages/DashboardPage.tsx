
import React from 'react';
import styled from 'styled-components';

const PageContainer = styled.div`
  padding: 20px;
`;

const DashboardPage: React.FC = () => {
  return (
    <PageContainer>
      <h1>Dashboard Page</h1>
      <p>Overview of candidates in different phases.</p>
      {/* TODO: Implement Candidate Phase Tables */}
    </PageContainer>
  );
};

export default DashboardPage;
