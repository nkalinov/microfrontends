import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { IMFEAppConfig } from './types';

export * from './types';

const defaultKey = '__webpack_mf_deployment_manifest__';
const containerId = 'mf-deployment-manifest-override';

const createDefaultConfig = (appsConfig: IMFEAppConfig[]) =>
  appsConfig.reduce((acc: { [key: string]: string }, module) => {
    acc[module.name] = `http://localhost:${module.port}/${module.fileName}`;
    return acc;
  }, {});

export default (
  appsConfig: IMFEAppConfig[],
  config: {
    windowKey?: string;
  } = {}
) => {
  const { windowKey = defaultKey } = config;

  // Start with assigning the default config for apps (localhost)
  let overrideConfig: { [key: string]: string } =
    createDefaultConfig(appsConfig);

  // Get override config from localStorage and extend the default config
  try {
    Object.assign(overrideConfig, JSON.parse(localStorage.getItem(windowKey)));
  } catch (e) {}
  if (!overrideConfig) {
    overrideConfig = createDefaultConfig(appsConfig);
  }

  // Assign config values to window
  if (!window[windowKey as keyof typeof window]) {
    // @ts-ignore
    window[windowKey] = {};
  }
  Object.assign(window[windowKey as keyof typeof window], overrideConfig);

  // Don't override previous instances.
  // Assuming they will be higher level ones with more knowledge about the ecosystem and thus richer appsConfig.
  if (document.querySelector(`#${containerId}`)) {
    return;
  }

  const containerEl = document.createElement('div');
  containerEl.id = containerId;
  document.body.appendChild(containerEl);

  const root = createRoot(containerEl);
  root.render(
    <App
      appsConfig={appsConfig}
      overrideConfig={overrideConfig}
      onItemChange={(app, e) => {
        localStorage.setItem(
          windowKey,
          JSON.stringify({
            ...overrideConfig,
            [app.name]: e.currentTarget.value,
          })
        );
      }}
    />
  );
};
