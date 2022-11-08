import * as React from 'react';
import { IMFEAppConfig } from './types';
import { useState } from 'react';

export type AppProps = {
  appsConfig: IMFEAppConfig[];
  overrideConfig: { [key: string]: string };
  onItemChange: (
    app: IMFEAppConfig,
    e: React.FormEvent<HTMLInputElement>
  ) => void;
};

export default function App({
  appsConfig,
  overrideConfig,
  onItemChange,
}: AppProps) {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div style={{ position: 'fixed', zIndex: 9999, left: 5, bottom: 5 }}>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <button
          style={{
            background: 'none',
            borderRadius: '50px',
            width: 50,
            height: 50,
          }}
          onClick={() => {
            setShowPopup(!showPopup);
          }}
        >
          MFE
        </button>
        {showPopup && (
          <div
            style={{
              background: '#fff',
              padding: 8,
              marginLeft: 5,
              border: '1px solid #999',
              borderRadius: 5,
              width: 400,
            }}
          >
            {appsConfig.map(app => (
              <div key={app.name} style={{ marginBottom: 6 }}>
                <label style={{ display: 'block' }}>
                  <span style={{ fontSize: 12 }}>{app.name}</span>
                  <input
                    style={{ display: 'block', width: '100%' }}
                    defaultValue={overrideConfig[app.name]}
                    onChange={e => onItemChange(app, e)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        window.location.reload();
                      }
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
