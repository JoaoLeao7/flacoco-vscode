import * as fse from 'fs-extra';
import { join } from 'path';
import { Decorator } from '../decoration/decorator';


export class File {

  private readonly path: string;
  private readonly configFile: string;

  private decorator?: Decorator;


  public constructor(path: string,  configFile: string) {
    this.path = path;
    this.configFile = configFile;
  }

  get filePath(): string {
    return this.path;
  }

  get configPath(): string {
    return this.configFile;
  }

  public setDecorator(newDecorator: Decorator): void {
    this.decorator?.dispose();
    this.decorator = newDecorator;
  }

  public dispose(): void {
    this.decorator?.dispose();
    this.decorator = undefined;
  }

  public async resetConfig(toolsPath: string): Promise<void> {
    await fse.emptyDir(this.configFile);
    await fse.copy(toolsPath, this.configFile, { overwrite: false });
  }

  public async cleanup(): Promise<void> {
    await Promise.all([
      fse.emptyDir(join(this.configFile, 'sfl')),
    ]);
  }
}
