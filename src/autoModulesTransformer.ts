import * as parser from '@babel/parser';
import { ParserPlugin } from '@babel/parser';
import traverse from '@babel/traverse';
import { extname } from 'node:path';
import * as t from '@babel/types';
import generate from '@babel/generator';
import { readFile } from 'fs/promises';

const CSS_EXT_NAMES = ['.css', '.less', '.sass', '.scss', '.stylus', '.styl'];
const stylesRegexp = new RegExp(`['"](\.+)\\.(${CSS_EXT_NAMES.map((s) => s.substring(1)).join('|')})(\\?[^'"]*)?['"]`);

function judgeTypeScript(path: string) {
  return path.endsWith('.ts') || path.endsWith('.tsx');
}

function parseValue(value: string) {
  const [name, query] = value.split('?');
  return { name, query };
}

export const autoModulesTransformer = async (
  filePath: string,
  options: { flag?: string; sourcemap: boolean; sourceRoot: string },
) => {
  function getValue(name: string, query: string) {
    return `${name}?${options.flag || 'modules'}${query ? `&${query}` : ''}`;
  }

  const isTs = judgeTypeScript(filePath);
  const fileContent = await readFile(filePath, 'utf-8');

  if (!stylesRegexp.test(fileContent)) {
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
      sourceMaps: !!options.sourcemap,
      sourceRoot: options.sourceRoot,
      sourceFileName: filePath,
    },
    fileContent,
  );

  if (options.sourcemap && map) {
    code += `\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,${Buffer.from(
      JSON.stringify(map),
    ).toString('base64')}`;
  }

  return code;
};
