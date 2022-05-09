import * as fse from 'fs-extra';
import { join } from 'path';
import { File } from './file';

export class FileStorage {
  private static readonly CONFIG_FILE: string = '.flacoco/';

  private readonly toolsPath: string;
  private readonly folders: { [key: string]: File };

  public constructor(toolsPath: string, folders: string[]) {
    this.toolsPath = toolsPath;
    this.folders = {};
    this.addFolders(folders);
  }

  public getFolder(key: string): File {
    return this.folders[key];
  }

  public getFolders(): File[] {
    return Object.values(this.folders);
  }

  public async updateFolders(
    addedFolders: string[],
    removedFolders: string[],
  ): Promise<void> {
    this.removeFolders(removedFolders);
    await this.addFolders(addedFolders);
  }

  private async addFolders(addedFolders: string[]): Promise<void> {
    await Promise.all(addedFolders.map((w) => this.createFolder(w)));
  }

  private removeFolders(removedWorkspaces: string[]) {
    removedWorkspaces.forEach((w) => {
      this.folders[w].dispose();
      delete this.folders[w];
    });
  }

  private async createFolder(path: string): Promise<void> {
    const configFolderPath = join(path, FileStorage.CONFIG_FILE);

    if (!(await fse.pathExists(configFolderPath))) {
      await fse.copy(this.toolsPath, configFolderPath, { overwrite: false });
    }

    this.folders[path] = new File(path, configFolderPath);
  }
}
