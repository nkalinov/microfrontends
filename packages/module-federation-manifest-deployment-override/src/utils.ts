import { IMFEAppConfig } from './types';

export const createAppLocalhostConfig = (module: IMFEAppConfig) =>
  `http://localhost:${module.port}/${module.fileName}`;
