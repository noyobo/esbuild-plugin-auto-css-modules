# esbuild-plugin-auto-css-modules

[![npm version](https://badge.fury.io/js/esbuild-plugin-auto-css-modules.svg)](https://badge.fury.io/js/esbuild-plugin-auto-css-modules)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![issues](https://img.shields.io/github/issues/noyobo/esbuild-plugin-auto-css-modules.svg)](https://github.com/noyobo/esbuild-plugin-auto-css-modules/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)
[![downloads](https://img.shields.io/npm/dm/esbuild-plugin-auto-css-modules.svg)](https://www.npmjs.com/package/esbuild-plugin-auto-css-modules)
[![Code Coverage](https://codecov.io/gh/noyobo/esbuild-plugin-auto-css-modules/branch/main/graph/badge.svg)](https://codecov.io/gh/noyobo/esbuild-plugin-auto-css-modules)
[![Node.js CI](https://github.com/noyobo/esbuild-plugin-auto-css-modules/actions/workflows/node.js.yml/badge.svg)](https://github.com/noyobo/esbuild-plugin-auto-css-modules/actions/workflows/node.js.yml)

Automatically import styles filename mark CSS modules. After adding the flag, the build tool can distinguish whether to enable css Modules

## Install

```bash
npm i esbuild-plugin-auto-css-modules -D
```

## Usage

```js
import { build } from 'esbuild'
import { autoCssModules } from 'esbuild-plugin-auto-css-modules'

build({
  entryPoints: ['src/index.js'],
  bundle: true,
  outfile: 'dist/index.js',
  plugins: [autoCssModules()],
}).catch(() => process.exit(1))
```

```js
// before
import styles from './index.css';
```

```js
// after
import styles from './index.css?modules';
```

## Options

```ts
type Options = {
    filter?: RegExp; // default: /\.([tj]sx?)$/
    flag?: string; // default: modules
    ignore?: RegExp | ((filename: string) => boolean); // default: null
}
```


## Related

- [esbuild-style-loader](https://npmjs.com/package/esbuild-style-loader) - esbuild style loader plugin
