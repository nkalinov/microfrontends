export type IMFEAppConfig = {
  name: string;
  fileName: string;
  port: number;
};

export type IMFEAppsOverrideConfig = { [key: string]: string };

export type IConfig = {
  windowKey?: string;
  devMode?: boolean;
};
