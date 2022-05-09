import * as vscode from 'vscode';
import * as os from 'os';
import * as fse from 'fs-extra';
import { join, basename } from 'path';
import { runFunction } from './cli/cliRunner';
import { Command, CommandRet } from './cli/command';
import { Decorator } from './decoration/decorator';
import { FileStorage } from './workspace/fileStorage';
import assert = require('assert');
import { File } from './workspace/file';

export class FlacocoCommander
  implements vscode.TreeDataProvider<FlacocoCommand>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    FlacocoCommand | undefined
  > = new vscode.EventEmitter<FlacocoCommand | undefined>();
  readonly onDidChangeTreeData: vscode.Event<FlacocoCommand | undefined> =
    this._onDidChangeTreeData.event;

  private readonly extensionPath: string;
  private readonly container: FileStorage;
  private readonly statusBar: vscode.StatusBarItem =
    vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

  constructor(extensionPath: string, container: FileStorage) {
    this.extensionPath = extensionPath;
    this.container = container;
  }

  getTreeItem(
    element: FlacocoCommand,
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(
    element?: FlacocoCommand | undefined,
  ): vscode.ProviderResult<FlacocoCommand[]> {
    let folderName = this.container.getFolders().pop();
    if (!element) {
      return [
        new FlacocoCommand(
          typeof folderName !== 'undefined'
            ? basename(folderName.filePath)
            : 'Unsupported Folder',
          vscode.TreeItemCollapsibleState.None,
          folderName?.filePath,
          false,
        ),
        new FlacocoCommand(
          'FAULTY CLASSES',
          vscode.TreeItemCollapsibleState.Expanded,
        ),
      ];
    }

    if (element.label === 'FAULTY CLASSES') {
      return Decorator.faultyClasses.map((f) => {
        const state = vscode.TreeItemCollapsibleState.None;
        return new FlacocoCommand(f.label, state, f.path, true);
      });
    }
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  async run(key: string) {
    let ret = await this.execCmd(
      'java -version',
      'Checking Java version',
      'Checking whether Java is available on the command line.',
    );
    if (ret) {
      console.log('...');
      return;
    }
    console.log('Currently running on: ' + os.platform());

    vscode.window.showInformationMessage("Setting up.");
    this.statusBar.text = 'Flacoco: Setting up';
    this.statusBar.show();

    const folder = this.container.getFolder(key);

    await folder.cleanup();
    
    const configPath = folder.configPath;
    const rankingPath = join(configPath, 'sfl', 'test.csv');
    await fse.writeFileSync(rankingPath,'w');

    let wf;
    if (vscode.workspace.workspaceFolders !== undefined) {
      wf = vscode.workspace.workspaceFolders[0].uri.path;
      let f = vscode.workspace.workspaceFolders[0].uri.fsPath;

      vscode.window.showInformationMessage('Files set up.');
    } else {
      vscode.window.showErrorMessage('Workspace not found.');
    }

    await this.runTestCases(wf, ret);
    if (typeof wf !== 'undefined') {
      vscode.window.showInformationMessage('Flacoco is highlighting the suspicious lines of code ... ');
      await this.decorateFiles(rankingPath, folder, wf);
    }
    this.refresh();

    vscode.window.showInformationMessage('Flacoco has finished');
    vscode.window.showInformationMessage(
      'Check the lines highlighted in your project with the according suspiciousness',
    );
  }


  private async runTestCases(wf: string | undefined, ret: boolean) {
    if (wf !== undefined) {
      ret = await this.execCmd(
        runFunction(wf.substring(1)),
        'Flacoco: Running test cases',
        "Running project's test cases.",
      );
      if (ret) {
        console.log('bye');
        return;
      }
    } else {
      vscode.window.showErrorMessage('Workspace not found.');
    }
  }

  private async decorateFiles(rankingPath: string, folder: File, wf: string) {
    if (!fse.existsSync(rankingPath)) {
      vscode.window.showErrorMessage(rankingPath + ' not found!');
      return;
    }

    const ranking = (await fse.readFile(rankingPath)).toString();
    folder.setDecorator(
       await Decorator.createDecorator(ranking, this.extensionPath, wf.substring(1)),
    );
  }

  private async execCmd(
    cmd: string,
    statusBarText: string,
    windowText: string,
  ): Promise<boolean> {
    this.statusBar.text = statusBarText;
    this.statusBar.show();

    vscode.window.showInformationMessage(windowText);
    const ret = await Command.exec(cmd);
    console.log(ret.stdout);
    console.error(ret.stderr);
    if (ret.failed) {
      vscode.window.showErrorMessage(ret.stderr);
      return true;
    }
    vscode.window.showInformationMessage(windowText + ' - Success!');

    this.statusBar.hide();
    return false;
  }
}

export class FlacocoCommand extends vscode.TreeItem {
  public children: FlacocoCommand[] = [];

  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly path?: string,
    public readonly faulty?: boolean,
    public command?: vscode.Command,
  ) {
    super(label, collapsibleState);
    if (typeof path !== 'undefined' && faulty) {
      this.command = {
        command: 'vscode.open',
        title: 'Open',
        arguments: [vscode.Uri.file(path)],
      };
      this.tooltip = `Go to ${label}`;
    }
  }
  jsonDef = !this.faulty ? 'folderView' : '';
  contextValue = this.path ? this.jsonDef : '';
}
