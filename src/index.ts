import { Loader, Plugin } from 'esbuild';
import { readFile } from 'node:fs/promises';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import generate from '@babel/generator';
import { extname } from 'node:path';
import { ParserPlugin } from '@babel/parser';

function judgeTypeScript(path: string) {
  return path.endsWith('.ts') || path.endsWith('.tsx');
}

const CSS_EXT_NAMES = ['.css', '.less', '.sass', '.scss', '.stylus', '.styl'];

function parseValue(value: string) {
  const [name, query] = value.split('?');
  return { name, query };
}

const stylesRegexp = new RegExp(`['"](\.+)\\.(${CSS_EXT_NAMES.map((s) => s.substring(1)).join('|')})(\\?[^'"]*)?['"]`);

export const autoCssModules = (opts: { filter?: RegExp, flag?: string, ignore?: RegExp } = {} ): Plugin => {
  function getValue(name: string, query: string) {
    return `${name}?${opts.flag || 'modules'}${query ? `&${query}` : ''}`;
  }

  return {
    name: 'auto-css-modules',
    setup(build) {

      build.onLoad({ filter: opts.filter || /\.([tj]sx?)$/ }, async (args) => {
        const isTs = judgeTypeScript(args.path);
        const fileContent = await readFile(args.path, 'utf-8');

        /**
         * check if the file contains css import
         */
        if (!stylesRegexp.test(fileContent)) {
          return null;
        }


        if (opts.ignore && opts.ignore.test(args.path)) {
          return null;
        }

        const ast = parser.parse(fileContent, {
          sourceType: 'module',
          plugins: ['jsx', 'classProperties', 'decorators-legacy', isTs ? 'typescript' : null].filter(
            Boolean,
          ) as ParserPlugin[],
        });

        traverse(ast, {
          ImportDeclaration(path) {
            const {
              specifiers,
              source,
              source: { value },
            } = path.node;
            const { name, query } = parseValue(value);
            if (specifiers.length && CSS_EXT_NAMES.includes(extname(name))) {
              source.value = getValue(name, query);
            }
          },

          VariableDeclarator(path) {
            const { node } = path;

            // const styles = await import('./index.less');
            if (
              t.isAwaitExpression(node.init) &&
              t.isCallExpression(node.init.argument) &&
              t.isImport(node.init.argument.callee) &&
              node.init.argument.arguments.length === 1 &&
              t.isStringLiteral(node.init.argument.arguments[0])
            ) {
              const { name, query } = parseValue(node.init.argument.arguments[0].value);
              if (CSS_EXT_NAMES.includes(extname(name))) {
                node.init.argument.arguments[0].value = getValue(name, query);
              }
            }

            // const styles = require('./index.less');
            else if (
              t.isCallExpression(node.init) &&
              t.isIdentifier(node.init.callee) &&
              node.init.callee.name === 'require' &&
              node.init.arguments.length === 1 &&
              t.isStringLiteral(node.init.arguments[0])
            ) {
              const { name, query } = parseValue(node.init.arguments[0].value);
              if (CSS_EXT_NAMES.includes(extname(name))) {
                node.init.arguments[0].value = getValue(name, query);
              }
            }
          },
        });

        let { code, map } = generate(
          ast,
          {
            sourceMaps: !!build.initialOptions.sourcemap,
            sourceRoot: build.initialOptions.sourceRoot,
            sourceFileName: args.path,
          },
          fileContent,
        );

        if (build.initialOptions.sourcemap && map) {
          code += `\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,${Buffer.from(
            JSON.stringify(map),
          ).toString('base64')}`;
        }

        const ext = extname(args.path);

        return { contents: code, loader: ext.substring(1) as Loader };
      });
    },
  };
};
