import React from 'react';
import { TriStripe } from '../common/TriStripe';

export const PublicFooter: React.FC = () => {
  return (
    <>
      <TriStripe />
      <footer className="foot gut">
        <div className="inner">
          <div>
            <b>Cube Tech Consults</b> · A product of Cube Tech Enterprises
            <br />
            Innovate. Automate. Elevate.
          </div>
          <div>
            hello@cubetechenterprises.com
            <br />
            www.cubetechenterprises.com
          </div>
        </div>
      </footer>
    </>
  );
};
