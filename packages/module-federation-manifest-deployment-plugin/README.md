# Module Federation Manifest Deployment Plugin

Inspired by [import-map-deployer](https://github.com/single-spa/import-map-deployer),
this Webpack plugin will allow you to dynamically load `remotes` taking their URLs from a manifest JSON file deployed
remotely.

This decoupling allows you to switch between different versions much faster as you no longer have hardcoded `remotes`
URLs and you don't need to rebuild/redeploy to ship a new version. All you have to do is update the pointer in the
manifest file.

When paired
with [module-federation-manifest-deployment-override](https://github.com/nkalinov/microfrontends/tree/main/packages/module-federation-manifest-deployment-override)
it unlocks great potential. It can improve your developer experience by allowing you to code within the production
environment
and point only specific micro-frontends to your local machine.

# Install

`yarn add @nkalinov/mf-manifest-deployment-plugin`

# Usage

Change your remotes and add to `webpack.config.js` plugins:

```
const ModuleFederationDeploymentPlugin = require('@nkalinov/mf-manifest-deployment-plugin');

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      remotes: {
        'app1': 'manifest app1',
      },
    }),
    new ModuleFederationDeploymentPlugin(options)
  ],
}
```

# Options

**Defaults:**

```
{
  defaultEntryName = 'remoteEntry.js',
  key = '__webpack_mf_deployment_manifest__',
  manifestPath = '/apps/manifest.json',
  fallbackOrigin = '',
}
```

- `key` - The window key that will be used to store the manifest.
- `manifestPath` - Relative path from the current origin to the manifest.json file.
- `fallbackOrigin` - Origin that will be used for the fallback requests (defaults to current origin).
- `fallbackEntryName` - Remote entry filename that will be used for the fallback requests.

# How does it work

1. Try to get the manifest definition from window[key].
2. If it doesn't exist then fetch from `new URL(__webpack_public_path__).origin + manifestPath`

## Fallbacks

If the manifest file fails to load for some reason or if the app key doesn't exist in the manifest the plugin will
try a few fallbacks.
