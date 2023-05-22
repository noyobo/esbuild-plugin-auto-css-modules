import * as esbuild from 'esbuild';
import { autoCssModules } from '../src';
import { BuildOptions } from 'esbuild';
import * as fse from 'fs-extra';

const OUTPUT_HTML = !!process.env.OUTPUT_HTML;

export const runTest = async (files: string[], outdir: string, options?: BuildOptions) => {
  const result = await esbuild.build(
    Object.assign(
      {
        entryPoints: files,
        outdir: outdir,
        bundle: true,
        write: false,
        sourcemap: true,
        external: ['react', 'react-dom'],
        target: ['es2020'],
        plugins: [
          autoCssModules(),
          {
            name: 'test',
            setup(build) {
              build.onResolve({ filter: /\.(css|less|scss|sass)(\?.*)?$/ }, (args) => {
                return { external: true };
              });
            },
          },
        ],
      },
      options,
    ),
  );

  return result;
};
