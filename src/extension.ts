import { join } from 'path';
import * as vscode from 'vscode';
import { FlacocoCommand, FlacocoCommander } from './mainCommand';
import { FileStorage } from './workspace/fileStorage';

export function activate(context: vscode.ExtensionContext) {
  if (
    !vscode.workspace.workspaceFolders ||
    vscode.workspace.workspaceFolders.length === 0
  ) {
    throw new Error(
      'Unable to locate workspace.',
    );
  }

  const toolsPath = join(context.extensionPath, 'tools');
  const folders = vscode.workspace.workspaceFolders.map((wf) => wf.uri.fsPath);
  const container = new FileStorage(toolsPath, folders);
  const commander = new FlacocoCommander(context.extensionPath, container);

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(async (ev) => {
      const addedFolders = ev.added.map((wf) => wf.uri.fsPath);
      const removedFolders = ev.removed.map((wf) => wf.uri.fsPath);
      await container.updateFolders(addedFolders, removedFolders);
      commander.refresh();
    }),
  );

  vscode.window.registerTreeDataProvider('flacoco', commander);
  vscode.commands.registerCommand('flacoco.refresh', () => commander.refresh());
  vscode.commands.registerCommand(
    'flacoco.run',
    async (cmd: FlacocoCommand) => await commander.run(folders[0]),
  );
}

export function deactivate() {}
