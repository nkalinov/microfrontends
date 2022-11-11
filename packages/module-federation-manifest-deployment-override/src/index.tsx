import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App, { AppProps } from './App';
import { IMFEAppConfig } from './types';

export * from './types';

const containerId = 'mf-deployment-manifest-override';

export default (
  appsConfig: IMFEAppConfig[],
  config: Omit<AppProps, 'appsConfig'> = {}
) => {
  // Don't override previous instances.
  // Assuming they will be higher level ones with more knowledge about the ecosystem and thus richer appsConfig.
  if (document.querySelector(`#${containerId}`)) {
    return;
  }

  const containerEl = document.createElement('div');
  containerEl.id = containerId;
  document.body.appendChild(containerEl);

  const root = createRoot(containerEl);
  root.render(<App appsConfig={appsConfig} {...config} />);
};
