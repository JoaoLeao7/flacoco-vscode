import { Command } from './command';

export { runFunction };

function runFunction(destPath: string): string {
  return new Command()
    .cd(destPath)
    .newCmd()
    .java()
    .jar('.flacoco/flacoco-1.0.3-SNAPSHOT-jar-with-dependencies.jar')
    .pp(destPath)
    .main('--format CSV --output .flacoco/sfl/test.csv')
    .toString();
}
