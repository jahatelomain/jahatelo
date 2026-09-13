import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

// Execute actual client modules. Only native/UI/SDK/storage boundaries are substituted.
export function clientHarness(response: object) {
  const effects: Array<() => unknown> = [];
  const stored = new Map<string, string>();
  let context: unknown;
  let googleConfig: Record<string, unknown> = {};
  const react = {
    useState: (value: unknown) => [value, () => {}],
    useEffect: (fn: () => unknown) => effects.push(fn),
    createContext: () => ({ Provider: 'Provider' }),
    useContext: () => context,
  };
  const native = {
    Platform: { OS: 'ios' },
    StyleSheet: { create: (x: unknown) => x },
    Alert: { alert: jest.fn() },
    InteractionManager: { runAfterInteractions: (callback: () => void) => callback() },
  };
  const stubs: Record<string, unknown> = {
    react: react,
    'react/jsx-runtime': { jsx: (type: unknown, props: unknown) => ({ type, props }), jsxs: (type: unknown, props: unknown) => ({ type, props }) },
    'react-native': native,
    'react-native-safe-area-context': {}, '@expo/vector-icons': {},
    '@react-native-async-storage/async-storage': { setItem: async (key: string, value: string) => stored.set(key, value) },
    'expo-auth-session/providers/google': {
      useAuthRequest: (config: Record<string, unknown>) => { googleConfig = config; return [{}, response, jest.fn()]; },
      useIdTokenAuthRequest: (config: Record<string, unknown>) => { googleConfig = { ...config, idTokenHook: true }; return [{}, response, jest.fn()]; },
    },
    'expo-auth-session': { makeRedirectUri: () => 'test://oauth' },
    'expo-web-browser': { maybeCompleteAuthSession: () => {} },
    'expo-constants': { expoConfig: { extra: { googleClientIdIos: 'ios-client', googleClientIdWeb: 'web-client' } }, appOwnership: 'standalone' },
    '@react-oauth/google': { GoogleLogin: 'GoogleLogin', useGoogleLogin: (config: Record<string, unknown>) => { googleConfig = config; return () => {}; } },
  };
  const cache = new Map();
  const app = path.resolve(process.cwd(), '../../app/jahatelo-app');
  function load(filename: string): any { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (cache.has(filename)) return cache.get(filename);
    const clientModule = { exports: {} };
    const source = fs.readFileSync(filename, 'utf8');
    const code = ts.transpileModule(source, { fileName: filename.endsWith('.js') ? filename + 'x' : filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    const localRequire = (id: string): unknown => {
      if (id in stubs) return stubs[id];
      if (id.endsWith('/apiBaseUrl')) return { getApiRoot: () => 'https://local.test' };
      if (id.endsWith('/theme')) return { COLORS: {} };
      if (id.startsWith('.')) return load(path.resolve(path.dirname(filename), id + '.js'));
      throw new Error('Unexpected client import: ' + id);
    };
    vm.runInNewContext(`(function(require,module,exports){${code}\n})`, { fetch: (...args: Parameters<typeof fetch>) => global.fetch(...args), console, __DEV__: false, setTimeout, clearTimeout, AbortController })(localRequire, clientModule, clientModule.exports);
    cache.set(filename, clientModule.exports);
    return clientModule.exports;
  }
  return {
    effects, stored, native, config: () => googleConfig,
    web: () => load(path.resolve(process.cwd(), 'components/GoogleLoginButton.tsx')),
    mobile: () => {
      const provider = load(app + '/contexts/AuthContext.js').AuthProvider({ children: null });
      context = provider.props.value;
      effects.length = 0; // Do not run unrelated bootstrap/profile refresh.
      return load(app + '/screens/LoginScreen.js').default({
        navigation: { isFocused: () => true, goBack: () => {} },
      });
    },
  };
}
