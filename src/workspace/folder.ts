import * as fse from 'fs-extra';
import { join } from 'path';
import { Decorator } from '../decoration/decorator';


export class Folder {

  private readonly path: string;
  private readonly configFolder: string;

  private decorator?: Decorator;


  public constructor(path: string,  configFolder: string) {
    this.path = path;
    this.configFolder = configFolder;
  }

  get folderPath(): string {
    return this.path;
  }

  get configPath(): string {
    return this.configFolder;
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
    await fse.emptyDir(this.configFolder);
    await fse.copy(toolsPath, this.configFolder, { overwrite: false });
  }

  public async cleanup(): Promise<void> {
    await Promise.all([
      fse.emptyDir(join(this.configFolder, 'sfl')),
    ]);
  }
}
