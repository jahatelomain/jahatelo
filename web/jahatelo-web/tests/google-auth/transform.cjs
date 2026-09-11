// eslint-disable-next-line @typescript-eslint/no-require-imports -- Jest transformer is CommonJS.
const ts = require('typescript');
module.exports = { process(sourceText, sourcePath) { return { code: ts.transpileModule(sourceText, { fileName: sourcePath, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText }; } };
