import * as React from 'react';
import { IMFEAppConfig, IMFEAppsOverrideConfig } from './types';
import { useEffect, useState } from 'react';

export type AppProps = {
  initialOverrideConfig: IMFEAppsOverrideConfig;
  appsConfig: IMFEAppConfig[];
  windowKey: string;
};

const createAppLocalhostConfig = (module: IMFEAppConfig) =>
  `http://localhost:${module.port}/${module.fileName}`;

export default function App({
  appsConfig,
  initialOverrideConfig,
  windowKey,
}: AppProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [overrideConfig, setOverrideConfig] = useState<IMFEAppsOverrideConfig>(
    initialOverrideConfig
  );
  const windowConfig = window[windowKey as keyof typeof window];

  const onItemChange = (app: IMFEAppConfig, value: string) => {
    setOverrideConfig(overrideConfig => ({
      ...overrideConfig,
      [app.name]: value,
    }));
  };

  useEffect(() => {
    localStorage.setItem(windowKey, JSON.stringify(overrideConfig));
  }, [overrideConfig]);

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 9999,
        left: 5,
        bottom: 5,
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      <button
        style={{
          borderColor: '#fff',
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
            borderRadius: 5,
            width: 450,
            position: 'relative',
            boxShadow: '0 -5px 15px #ccc',
          }}
        >
          {appsConfig.map(app => (
            <div key={app.name} style={{ marginBottom: 6 }}>
              <label style={{ display: 'block', position: 'relative' }}>
                <span style={{ fontSize: 12 }}>{app.name}</span>
                <input
                  style={{ display: 'block', width: '100%' }}
                  value={overrideConfig[app.name]}
                  onChange={e => onItemChange(app, e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      window.location.reload();
                    }
                  }}
                  placeholder={windowConfig[app.name]}
                />
                <span
                  style={{ position: 'absolute', right: 6, bottom: 2 }}
                  onClick={() => {
                    onItemChange(app, createAppLocalhostConfig(app));
                  }}
                >
                  ⛏
                </span>
              </label>
            </div>
          ))}
          <a
            href=""
            style={{
              position: 'absolute',
              top: 6,
              right: 8,
              fontSize: 10,
            }}
            onClick={() => {
              localStorage.removeItem(windowKey);
            }}
          >
            Reset
          </a>
        </div>
      )}
    </div>
  );
}
