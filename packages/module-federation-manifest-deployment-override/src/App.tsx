import * as React from 'react';
import { IMFEAppConfig, IMFEAppsOverrideConfig } from './types';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type AppProps = {
  appsConfig: IMFEAppConfig[];
  windowKey?: string;
};

const defaultKey = '__webpack_mf_deployment_manifest__';

const createLocalhostConfig = (appsConfig: IMFEAppConfig[]) =>
  appsConfig.reduce((acc: IMFEAppsOverrideConfig, module) => {
    acc[module.name] = `http://localhost:${module.port}/${module.fileName}`;
    return acc;
  }, {});

export default function App({ appsConfig, windowKey = defaultKey }: AppProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [windowConfig, setWindowConfig] = useState<IMFEAppsOverrideConfig>(
    window[windowKey as keyof typeof window]
  );

  useEffect(() => {
    document.addEventListener('mf-manifest-loaded', () => {
      setWindowConfig(window[windowKey as keyof typeof window]);
    });
  }, [setWindowConfig]);

  const [overrideConfig, setOverrideConfig] = useState<IMFEAppsOverrideConfig>(
    () => {
      // Assign override config from localStorage
      try {
        return JSON.parse(localStorage.getItem(windowKey)) || {};
      } catch (e) {
        return {};
      }
    }
  );

  // Assign overrideConfig to window immediately.
  // Should not be in an effect because we need it to execute immediately.
  if (!window[windowKey as keyof typeof window]) {
    // @ts-ignore
    window[windowKey] = {};
  }
  Object.assign(window[windowKey as keyof typeof window], overrideConfig);

  // Default to localhost config + actual window values
  const mergedConfig = useMemo<IMFEAppsOverrideConfig>(
    () => ({
      ...createLocalhostConfig(appsConfig),
      ...windowConfig,
      ...overrideConfig,
    }),
    [windowConfig, overrideConfig]
  );

  const onItemChange = useCallback(
    (app: IMFEAppConfig, e: React.FormEvent<HTMLInputElement>) => {
      const nextOverrideConfig = {
        ...overrideConfig,
        [app.name]: e.currentTarget.value,
      };
      setOverrideConfig(nextOverrideConfig);
    },
    [mergedConfig]
  );

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
            width: 400,
            position: 'relative',
            boxShadow: '0 -5px 15px #ccc',
          }}
        >
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
          {appsConfig.map(app => (
            <div key={app.name} style={{ marginBottom: 6 }}>
              <label style={{ display: 'block' }}>
                <span style={{ fontSize: 12 }}>{app.name}</span>
                <input
                  style={{ display: 'block', width: '100%' }}
                  defaultValue={mergedConfig[app.name]}
                  onChange={e => onItemChange(app, e)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      onItemChange(app, e);
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
  );
}
