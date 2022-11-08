# Module Federation Manifest Deployment Override Widget

Inspired by [import-map-overrides](https://github.com/single-spa/import-map-overrides),
this browser widget will allow you to override `remotes` URLs dynamically during runtime.

This should be viewed as a developer experience enhancement and dev tool -- developers can develop and debug on deployed
environments instead of having to boot up a local environment.

Overrides are stored in local storage.

# Install

`yarn add @nkalinov/mf-manifest-deployment-override`

# Usage

```
import setup from '@nkalinov/mf-manifest-deployment-override';

setup([
    {
        name: 'app1',
        fileName: 'remoteEntry.js',
        port: 3001
    },
    {
        name: 'lib',
        fileName: 'remoteEntry.js',
        port: 3002
    },
]);
```

# API

The default export is a function which takes 2 args:

```
export default (appsConfig: IMFEAppConfig[], config: {
    windowKey?: string;
} = {}) => void
```

### `appsConfig` arg is an Array of `IMFEAppConfig`

```
type IMFEAppConfig = {
    name: string; // the key in the manifest file
    fileName: string; // filename of the remoteEntry file
    port: number; // localhost port (will be tried when running in development mode)
};
```

### `config` arg options:

- `windowKey` - (optional) window (and localStorage) key that will be used to store the overrides. Default value
  is `__webpack_mf_deployment_manifest__`. If you're changing this make sure to match it with the plugin config.
