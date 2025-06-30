import { useState } from 'react';
import GoogleFormsConnect from './GoogleFormsConnect';

const ConnectForm = () => {
  const [provider, setProvider] = useState<string | null>(null);

  return (
    <div>
      {!provider ? (
        <div>
          <h2>Select a form provider</h2>
          <button onClick={() => setProvider('GOOGLE_FORMS')}>Google Forms</button>
        </div>
      ) : (
        <GoogleFormsConnect />
      )}
    </div>
  );
};

export default ConnectForm;
