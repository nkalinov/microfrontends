const { RawSource } = require('webpack-sources');

const createDynamicRemote = (
  name,
  {
    key = '__webpack_mf_deployment_manifest__',
    manifestPath = '/manifest.json',
    manifestImportsPath,
    fallbackOrigin = '',
    fallbackEntryName = 'remoteEntry.js',
  } = {}
) => {
  const manifestPromiseKey = key + 'promise__';

  return `new Promise(async (resolve, reject) => {
  
  var _get = (obj, path, defaultValue) => path.split(".").reduce((a, c) => (a && a[c] ? a[c] : (defaultValue || null)), obj);
  
  // Base API origin starts from the public path of the current chunk (remoteEntry.js).
  var publicPath = __webpack_require__.p;
  var baseOrigin = new URL(publicPath).origin;
  
  // Fallback origin.
  // Can be either an absolute or relative URL. If relative, it will be based on baseOrigin.
  var fallbackIsAbsolute = '${fallbackOrigin}'.startsWith('http');
  var fallbackOrigin = fallbackIsAbsolute ? '${fallbackOrigin}' : baseOrigin + '${fallbackOrigin}';

  // Fetch manifest file from API. 
  // Cached globally as multiple MFEs might be doing it concurrently.
  var fetchManifest = () => window['${manifestPromiseKey}'] || 
    (window['${manifestPromiseKey}'] = fetch(baseOrigin + '${manifestPath}').then(res => res.json()));
  
  // Helper to set the app path to the window var.
  var setWindowPath = value => {
    if (!window['${key}']) window['${key}'] = {};
    window['${key}']['${name}'] = value;
  };
  
  async function getPathFromManifest(fallbackEntryName = '${fallbackEntryName}') {
    var path;

    try {
      var manifest = await fetchManifest();
      path = _get(manifest, '${[manifestImportsPath, name]
        .filter(Boolean)
        .join('.')}');

      if (!path) {
        console.warn('Manifest did not provide a version for ${name}.', manifest);
        throw new Error('Manifest did not provide a version for ${name}.');
      }
    } catch (e) {
      // Fallback to latest folder, using default entry file name.
      path = fallbackOrigin + '/${name}/latest/' + fallbackEntryName;
    } finally {
      // Emit the loaded value
      setWindowPath(path);
    }
    return path;
  }
  
  // Initial path taken from the window.
  var path = window['${key}'] && window['${key}']['${name}'];
  
  // Or get from manifest.
  if (!path) {
    path = await getPathFromManifest();
  }

  // Can be either an absolute or relative URL
  const getRemoteUrl = path => path.startsWith('http') ? path : baseOrigin + path;
  
  var proxy = {
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
      
  var rejectLoading = event => {
    var realSrc = event?.target?.src;
    var error = new Error();
    error.message = 'Loading script failed. (missing: ' + realSrc + ')';
    error.name = 'ScriptExternalLoadError';
    reject(error);
  }

  __webpack_require__.l(
    getRemoteUrl(path),
    async event => {
      if (event?.type === 'load' && window['${name}']) {
        // the injected script has loaded and is available on window
        // we can now resolve this Promise
        return resolve(proxy)
      }
      
      // Error, fallback to using fallbackOrigin as an origin and load latest
      var pathSplit = path.split('/');
      var fileName = pathSplit[pathSplit.length - 1];
      path = await getPathFromManifest(fileName);

      __webpack_require__.l(
        getRemoteUrl(path),
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
};

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
