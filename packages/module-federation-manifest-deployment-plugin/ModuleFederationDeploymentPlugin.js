const { RawSource } = require('webpack-sources');

const createDynamicRemote = (
  name,
  {
    key = '__webpack_mf_deployment_manifest__',
    manifestPath = '/apps/manifest.json',
    fallbackOrigin = '',
    fallbackEntryName = 'remoteEntry.js',
  } = {}
) =>
  `new Promise(async (resolve, reject) => {
  
  // Base API origin starts from the public path of the current chunk.
  const publicPath = __webpack_require__.p;
  const baseOrigin = new URL(publicPath).origin;

  const onManifestLoaded = () => document.dispatchEvent(new CustomEvent('mf-manifest-loaded'));
  const fetchManifest = () => window.fetch_manifest || (window.fetch_manifest = fetch(baseOrigin + '${manifestPath}'));
  const getPathFromWindow = () => window['${key}'] && window['${key}']['${name}'];
  
  let path = getPathFromWindow();
  
  // Fetch from manifest if local entry doesn't exist.
  if (!path) {
    try {
      window['${key}'] = await fetchManifest().then(res => res.json());
      path = getPathFromWindow();

      if (!path) throw new Error('Manifest did not provide a version for ${name}.');
    } catch (e) {
      // Fallback to latest folder, using default entry file name.
      path = ('${fallbackOrigin}' || baseOrigin) + '/${name}/latest/${fallbackEntryName}';
      
      if (!window['${key}']) window['${key}'] = {};
      window['${key}']['${name}'] = path;
    } finally {
      onManifestLoaded();
    }
  }

  // Can be either an absolute or relative URL
  const remoteIsAbsolute = path.startsWith('http');
  const remoteUrl = remoteIsAbsolute ? path : baseOrigin + path;
  
  const proxy = {
    get: (request) => window['${name}'].get(request),
    init: (arg) => {
      if (window['${name}'].__initialized) return;
      window['${name}'].__initialized = true;
      return window['${name}'].init(arg)
    }
  }
 
  if (window['${name}']) {
    console.log('Remote "${name}" already loaded.');
    return resolve(proxy);
  }

  __webpack_require__.l(
    remoteUrl,
    event => {
      if (event?.type === 'load' && window['${name}']) {
        // the injected script has loaded and is available on window
        // we can now resolve this Promise
        return resolve(proxy)
      }
      
      const rejectLoading = event => {
        const realSrc = event?.target?.src;
        const error = new Error();
        error.message = 'Loading script failed. (missing: ' + realSrc + ')';
        error.name = 'ScriptExternalLoadError';
        reject(error);
      }
      
      // Error, fallback to using fallbackOrigin as an origin and load latest
      const pathSplit = path.split('/');
      const fileName = pathSplit[pathSplit.length - 1];
      
      __webpack_require__.l(
        ('${fallbackOrigin}' || baseOrigin) + '/${name}/latest/' + fileName,
        event => {
          if (event?.type === 'load' && window['${name}']) {
            // the injected script has loaded and is available on window
            // we can now resolve this Promise
            return resolve(proxy)
          }
          rejectLoading(event);
        },
        '${name}'
      );
    },
    '${name}'
  );
})
`;

class ModuleFederationDeploymentPlugin {
  constructor(options = {}) {
    this._options = options;
  }

  apply(compiler) {
    const { _options: options } = this;

    compiler.hooks.make.tap(
      ModuleFederationDeploymentPlugin.name,
      compilation => {
        const scriptExternalModules = [];

        compilation.hooks.buildModule.tap(
          ModuleFederationDeploymentPlugin.name,
          module => {
            if (
              module.constructor.name === 'ExternalModule' &&
              module.externalType === 'manifest'
            ) {
              scriptExternalModules.push(module);
            }
          }
        );

        compilation.hooks.afterCodeGeneration.tap(
          ModuleFederationDeploymentPlugin.name,
          function () {
            // console.log('compilation.hooks.afterCodeGeneration');
            scriptExternalModules.map(module => {
              const appName = module.request;
              const sourceMap =
                compilation.codeGenerationResults.get(module).sources;
              const rawSource = sourceMap.get('javascript');
              sourceMap.set(
                'javascript',
                new RawSource(
                  rawSource
                    .source()
                    .replace(appName, createDynamicRemote(appName, options))
                )
              );
            });
          }
        );
      }
    );
  }
}

module.exports = ModuleFederationDeploymentPlugin;
