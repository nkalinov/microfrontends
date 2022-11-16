# Module Federation Manifest Deployment Override Widget

Inspired by [import-map-overrides](https://github.com/single-spa/import-map-overrides),
this browser widget will allow you to override `remotes` URLs dynamically during runtime.

This should be viewed as a developer experience enhancement and dev tool -- developers can develop and debug on deployed
environments instead of having to boot up a local environment.

Overrides are stored in local storage.

![alt text](./examples/screenshot.png 'Screenshot')

# Install

`yarn add @nkalinov/mf-manifest-deployment-override`

# Usage

Call the override function **before** importing any of the MFEs with an array of your apps config.

```
// index.js
import setup from '@nkalinov/mf-manifest-deployment-override';

import('@nkalinov/mf-manifest-deployment-override')
  .then(module =>
    module.default([
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
    ])
  )
  .then(() => import('./bootstrap.js'));
```

This will append a `div#mf-deployment-manifest-override` element with the MFE button + the popup.

## UI

- Input placeholders hold the actual URL of the container. It could be different from your override value as the plugin
  might use a fallback URL.
- After you modify a container URL hit `Enter` to refresh the page and see your changes applied.
- ⛏ button is a shortcut to prefill the URL with `//localhost:$port/$fileName`
- `Reset` will erase all override info from localStorage.

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
    name: string; // MFE key from the manifest file
    fileName: string; // Fallback remote entry filename (also used to construct localhost)
    port: number; // localhost port
};
```

### `config` arg options:

- `windowKey` - (optional) window (and localStorage) key that will be used to store the overrides. Default value
  is `__webpack_mf_deployment_manifest__`. If you're changing this make sure to match it with the plugin config.
