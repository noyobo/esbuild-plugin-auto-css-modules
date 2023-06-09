import path from 'path';
import { runTest } from '../runTest';
import fse from 'fs-extra';

describe(path.basename(__filename), function () {
  it('style-loader', async function () {
    const output = path.resolve(__dirname, 'output');
    fse.removeSync(output);
    const result = await runTest([path.resolve(__dirname, './index.jsx')], output);
    const allFile = result.outputFiles.map((item) => item.path);
    allFile.forEach((file) => {
      fse.ensureFileSync(file);
      const content = result.outputFiles.find((item) => item.path === file)?.text;
      fse.writeFileSync(file, content);

      if (!file.endsWith('.map')) {
        expect(content).toMatchSnapshot(path.relative(process.cwd(), file));
      }
    });
  });
});
