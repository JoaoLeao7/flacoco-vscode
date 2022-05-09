import * as fse from 'fs-extra';
import { join } from 'path';
import { Folder } from './folder';

export class FolderContainer {
  private static readonly CONFIG_FOLDER: string = '.flacoco/';

  private readonly toolsPath: string;
  private readonly folders: { [key: string]: Folder };

  public constructor(toolsPath: string, folders: string[]) {
    this.toolsPath = toolsPath;
    this.folders = {};
    this.addFolders(folders);
  }

  public getFolder(key: string): Folder {
    return this.folders[key];
  }

  public getFolders(): Folder[] {
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
    const configFolderPath = join(path, FolderContainer.CONFIG_FOLDER);
    //const tool = this.getBuildTool(path);

    //if (!tool) {
      //return;
    //}

    if (!(await fse.pathExists(configFolderPath))) {
      await fse.copy(this.toolsPath, configFolderPath, { overwrite: false });
    }

    this.folders[path] = new Folder(path, configFolderPath);
  }
}
