
import React from 'react';
import styled from 'styled-components';

const PageContainer = styled.div`
  padding: 20px;
`;

const FeedbackPage: React.FC = () => {
  return (
    <PageContainer>
      <h1>Feedback Page</h1>
      <p>This is where volunteers can give feedback on newbies.</p>
      {/* TODO: Implement Feedback Table and related components */}
    </PageContainer>
  );
};

export default FeedbackPage;
