import path from 'path';

import fileExists from './utils/fileExists';
import resolveDefaultConfigPath from './utils/resolveDefaultConfigPath';
import parseConfig from './utils/parseConfig';
import selectModules from './utils/selectModules';
import selectUserModules from './utils/selectUserModules';
import getEnvProp from './utils/getEnvProp';

/* ======= Fetching config */

const DEFAULT_VERSION = 3;
const SUPPORTED_VERSIONS = [3, 4];

let rawConfig;
let defaultConfig;

function userConfigFileExists(userConfigPath) {
  return userConfigPath && fileExists(userConfigPath);
}

function setConfigVariables(configFilePath) {
  if (configFilePath) {
    rawConfig = parseConfig(configFilePath);

    if (!rawConfig) {
      throw new Error(`No config file at ${configFilePath}'`);
    }

    const { bootstrapVersion } = rawConfig;

    if (!bootstrapVersion) {
      throw new Error(`
        I can't find Bootstrap version in your '.bootstraprc'.
        Make sure it's set to 3 or 4. Like this:
          bootstrapVersion: 4
      `);
    }

    if (SUPPORTED_VERSIONS.indexOf(parseInt(bootstrapVersion, 10)) === -1) {
      throw new Error(`
        Looks like you have unsupported Bootstrap version in your '.bootstraprc'.
        Make sure it's set to 3 or 4. Like this:
          bootstrapVersion: 4
      `);
    }

    const defaultConfigPath = (
      resolveDefaultConfigPath(bootstrapVersion)
    );
    defaultConfig = parseConfig(defaultConfigPath);
  } else {
    const defaultConfigPath = (
      resolveDefaultConfigPath(DEFAULT_VERSION)
    );

    if (!fileExists(defaultConfigPath)) {
      throw new Error(`No default config file at ${defaultConfigPath}'`);
    }

    rawConfig = defaultConfig = parseConfig(defaultConfigPath);

    if (!rawConfig) {
      throw new Error(`I cannot parse the config file at ${defaultConfigPath}'`);
    }
  }
}


/* ======= Exports */
export { userConfigFileExists };

export function createConfig({
  extractStyles,
  configFilePath,
}) {
  if (!configFilePath) {
    setConfigVariables();
    return {
      bootstrapVersion: parseInt(rawConfig.bootstrapVersion, 10),
      loglevel: rawConfig.loglevel,
      useFlexbox: defaultConfig.useFlexbox,
      useCustomIconFontPath: defaultConfig.useCustomIconFontPath,
      extractStyles: extractStyles || getEnvProp('extractStyles', defaultConfig),
      styleLoaders: defaultConfig.styleLoaders,
      styles: selectModules(defaultConfig.styles),
      scripts: selectModules(defaultConfig.scripts),
    };
  }

  const configFile = path.resolve(__dirname, configFilePath);
  setConfigVariables(configFile);
  const configDir = path.dirname(configFile);
  const preBootstrapCustomizations = (
    rawConfig.preBootstrapCustomizations &&
    path.resolve(configDir, rawConfig.preBootstrapCustomizations)
  );
  const bootstrapCustomizations = (
    rawConfig.bootstrapCustomizations &&
    path.resolve(configDir, rawConfig.bootstrapCustomizations)
  );
  const appStyles = (
    rawConfig.appStyles &&
    path.resolve(configDir, rawConfig.appStyles)
  );

  return {
    bootstrapVersion: parseInt(rawConfig.bootstrapVersion, 10),
    loglevel: rawConfig.loglevel,
    preBootstrapCustomizations,
    bootstrapCustomizations,
    appStyles,
    useFlexbox: rawConfig.useFlexbox,
    useCustomIconFontPath: rawConfig.useCustomIconFontPath,
    extractStyles: extractStyles || getEnvProp('extractStyles', rawConfig),
    styleLoaders: rawConfig.styleLoaders,
    styles: selectUserModules(rawConfig.styles, defaultConfig.styles),
    scripts: selectUserModules(rawConfig.scripts, defaultConfig.scripts),
  };
}
