const { RawSource } = require('webpack-sources');

const createDynamicRemote = (
  name,
  {
    key = '__webpack_mf_deployment_manifest__',
    manifestPath = '/manifest.json',
    fallbackOrigin = '',
    fallbackEntryName = 'remoteEntry.js',
  } = {}
) =>
  `new Promise(async (resolve, reject) => {
  
  // Base API origin starts from the public path of the current chunk.
  var publicPath = __webpack_require__.p;
  var baseOrigin = new URL(publicPath).origin;
  
  // Fallback origin.
  // Can be either an absolute or relative URL. If relative, it will be based on baseOrigin.
  var fallbackIsAbsolute = '${fallbackOrigin}'.startsWith('http');
  var fallbackOrigin = fallbackIsAbsolute ? '${fallbackOrigin}' : baseOrigin + '${fallbackOrigin}';

  // Fetch manifest file from API. 
  // Cached globally as multiple MFEs might be doing it concurrently.
  var fetchManifest = () => window.fetch_manifest || (window.fetch_manifest = fetch(baseOrigin + '${manifestPath}'));
  
  // Helper to set the app path to the window var.
  var setWindowPath = value => {
    if (!window['${key}']) window['${key}'] = {};
    window['${key}']['${name}'] = value;
  };
  
  // Initial path taken from the window.
  var path = window['${key}'] && window['${key}']['${name}'];
  
  // Or get from manifest.
  if (!path) {
    try {
      var manifest = await fetchManifest().then(res => res.json());
      path = manifest['${name}'];

      if (!path) throw new Error('Manifest did not provide a version for ${name}.');
    } catch (e) {
      // Fallback to latest folder, using default entry file name.
      path = fallbackOrigin + '/${name}/latest/${fallbackEntryName}';
    } finally {
      // Emit the loaded value
      setWindowPath(path);
    }
  }

  // Can be either an absolute or relative URL
  var remoteIsAbsolute = path.startsWith('http');
  var remoteUrl = remoteIsAbsolute ? path : baseOrigin + path;
  
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

  __webpack_require__.l(
    remoteUrl,
    event => {
      if (event?.type === 'load' && window['${name}']) {
        // the injected script has loaded and is available on window
        // we can now resolve this Promise
        return resolve(proxy)
      }
      
      var rejectLoading = event => {
        var realSrc = event?.target?.src;
        var error = new Error();
        error.message = 'Loading script failed. (missing: ' + realSrc + ')';
        error.name = 'ScriptExternalLoadError';
        reject(error);
      }
      
      // Error, fallback to using fallbackOrigin as an origin and load latest
      var pathSplit = path.split('/');
      var fileName = pathSplit[pathSplit.length - 1];
      remoteUrl = fallbackOrigin + '/${name}/latest/' + fileName;
      setWindowPath(remoteUrl);
      
      __webpack_require__.l(
        remoteUrl,
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
