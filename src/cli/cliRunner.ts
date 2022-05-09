import { Command } from './command';

export { runFunction };

const flacocoVersion = 'flacoco-1.0.3-SNAPSHOT-jar-with-dependencies.jar';
const format = 'CSV';

function runFunction(destPath: string): string {
  return new Command()
    .cd(destPath)
    .newCmd()
    .java()
    .jar(`.flacoco/${flacocoVersion}`)
    .pp(destPath)
    .main(`--format ${format} --output .flacoco/sfl/test.csv`)
    .toString();
}
