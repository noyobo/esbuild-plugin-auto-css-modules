import { Loader, Plugin } from 'esbuild';
import { extname } from 'path';
import { autoModulesTransformer } from './autoModulesTransformer';

export { autoModulesTransformer };

export const autoCssModules = (
  opts: {
    filter?: RegExp;
    flag?: string;
    ignore?: RegExp | ((filePath: string) => Boolean);
  } = {},
): Plugin => {
  return {
    name: 'auto-css-modules',
    setup(build) {
      build.onLoad({ filter: opts.filter || /\.([tj]sx?)$/ }, async (args) => {
        let filePath = args.path;

        if (opts.ignore) {
          if ('function' === typeof opts.ignore && opts.ignore(filePath)) {
            return null;
          }
          if (opts.ignore instanceof RegExp && opts.ignore.test(filePath)) {
            return null;
          }
          throw new Error('ignore option must be a function or a regexp');
        }

        const code = await autoModulesTransformer(filePath, {
          flag: opts.flag,
          sourcemap: !!build.initialOptions.sourcemap,
          sourceRoot: build.initialOptions.sourceRoot,
        });

        if (typeof code === 'string') {
          const ext = extname(filePath);
          return { contents: code, loader: ext.substring(1) as Loader };
        }
        return null;
      });
    },
  };
};
