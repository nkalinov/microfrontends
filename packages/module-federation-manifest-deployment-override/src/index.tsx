import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { IConfig, IMFEAppConfig } from './types';
import { createAppLocalhostConfig } from './utils';

export * from './types';

const containerId = 'mf-deployment-manifest-override';
const defaultKey = '__webpack_mf_deployment_manifest__';

export default (appsConfig: IMFEAppConfig[], config: IConfig = {}) => {
  // Don't override previous instances.
  // Assuming they will be higher level ones with more knowledge about the ecosystem and thus richer appsConfig.
  if (document.querySelector(`#${containerId}`)) {
    return;
  }
  const { windowKey = defaultKey } = config;

  // Get override config from localStorage
  const overrideConfig = (() => {
    try {
      return JSON.parse(localStorage.getItem(windowKey)) || {};
    } catch (e) {
      return {};
    }
  })();

  // Assign overrideConfig to window immediately so that the plugin picks it up.
  if (!window[windowKey as keyof Window]) {
    Object.defineProperty(window, windowKey, { writable: true, value: {} });
  }

  appsConfig.forEach(appConf => {
    window[windowKey as keyof Window][appConf.name] =
      // 1. Already defined value
      window[windowKey as keyof Window][appConf.name] ||
      // 2. Override value
      overrideConfig[appConf.name] ||
      config.devMode
        ? // 3. Default to localhost
          createAppLocalhostConfig(appConf)
        : undefined;
  });

  // Render
  const containerEl = document.createElement('div');
  containerEl.id = containerId;
  document.body.appendChild(containerEl);
  const root = createRoot(containerEl);
  const render = () =>
    root.render(
      <App
        appsConfig={appsConfig}
        {...config}
        windowKey={windowKey}
        initialOverrideConfig={overrideConfig}
      />
    );

  render();
};
