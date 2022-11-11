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
  manifestPath = '/manifest.json',
  fallbackOrigin = '', // will inherit the public path origin
}
```

- `key` - The window key that will be used to store the manifest.
- `manifestPath` - Relative path (with leading slash) from the current origin to the manifest.json file.
- `fallbackOrigin` - Origin that will be used for the fallback requests (defaults to public path origin). Could be
  absolute or relative path prefixed with / (in which case public path origin will be used).
- `fallbackEntryName` - Remote entry filename that will be used for the fallback requests.

# How does it work

1. Get the manifest from window[key].
2. If it doesn't exist then fetch from `new URL(__webpack_public_path__).origin + manifestPath`
3. Get app url from manifest - window[key][appkey]
   1. If app key doesn't exist, fallback to `${fallbackOrigin}/${name}/latest/${fallbackEntryName}`
4. Load remote container
   1. If loading failed, fallback to `'${fallbackOrigin}/${name}/latest/' + fileName`

# Updating the manifest file

todo
