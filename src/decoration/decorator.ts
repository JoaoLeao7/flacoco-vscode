import * as vscode from 'vscode';
import { join, sep, posix } from 'path';
import { Ranking, RankingLine, RankingGroup } from './ranker';
import { Command } from '../cli/command';
import { Folder } from '../workspace/folder';
import { TreeFolder } from '../workspace/treeFolder';
import * as fse from 'fs-extra';
import path = require('path');

export class Decorator {
  public static readonly faultyClasses: TreeFolder[] = [];
  private decorators: Map<String, vscode.TextEditorDecorationType> = new Map<
    String,
    vscode.TextEditorDecorationType
  >();
  private savedDocs: String[] = [];

  private readonly rankings: Ranking;
  private readonly extensionPath: string;
  private readonly listener: vscode.Disposable;
  private readonly listener1: vscode.Disposable;
  private readonly sep: string = '.';

  private readonly range: vscode.Range = new vscode.Range(
    new vscode.Position(0, 0),
    new vscode.Position(0, 0),
  );

  private constructor(rankings: Ranking, extensionPath: string) {
    this.rankings = rankings;
    this.extensionPath = extensionPath;

    this.listener = vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        this.setDecorations(editor);
      }
    });

    this.listener1 = vscode.workspace.onWillSaveTextDocument((document) => {
      if (document) {
        this.deleteDecorations(document.document);
      }
    });
  }

  private createDecoration(
    path: string,
    sus: string,
  ): vscode.TextEditorDecorationType {
    return vscode.window.createTextEditorDecorationType({
      gutterIconPath: path,
      gutterIconSize: '100%',
      textDecoration: `underline dotted ${sus}`,
      //outline: '1 px dotted',
      //outlineColor: { id: `flacoco.${sus}`}
    });
  }

  private setDecorations(editor: vscode.TextEditor): void {
    const document = editor.document;

    if (this.savedDocs.includes(document.fileName)) {
      return;
    }

    const keys = Object.keys(this.rankings).filter((key) => {
      const splitKey = key.split(this.sep);

      const posixPath = document.fileName.split(sep).join(posix.sep);

      const keyToPath = key.replace(/\./g, '/') + '.java';

      return posixPath.includes(keyToPath);
      // document.getText().includes(`class ${splitKey[splitKey.length - 1]}`);
    });

    let lowDecor = this.createDecoration(
      join(this.extensionPath, 'media', 'icons', 'green-alert.svg'),
      'green',
    );
    let mediumDecor = this.createDecoration(
      join(this.extensionPath, 'media', 'icons', 'yellow-alert.svg'),
      'yellow',
    );
    let highDecor = this.createDecoration(
      join(this.extensionPath, 'media', 'icons', 'orange-alert.svg'),
      'orange',
    );
    let veryHighDecor = this.createDecoration(
      join(this.extensionPath, 'media', 'icons', 'red-alert.svg'),
      'red',
    );

    this.decorators.set(document.fileName + 'low', lowDecor);
    this.decorators.set(document.fileName + 'medium', mediumDecor);
    this.decorators.set(document.fileName + 'high', highDecor);
    this.decorators.set(document.fileName + 'veryHigh', veryHighDecor);

    const low = [],
      medium = [],
      high = [],
      veryHigh = [];
    for (let idx = 0; idx < keys.length; idx++) {
      const group = this.rankings[keys[idx]];
      low.push(...group.low);
      medium.push(...group.medium);
      high.push(...group.high);
      veryHigh.push(...group.veryHigh);
    }

    const decoratorCallback = (l: RankingLine) => ({
      hoverMessage: `${l.getSusText()}`,
      range: document.lineAt(l.getLine() - 1).range,
    });

    editor.setDecorations(lowDecor, low.map(decoratorCallback));
    editor.setDecorations(mediumDecor, medium.map(decoratorCallback));
    editor.setDecorations(highDecor, high.map(decoratorCallback));
    editor.setDecorations(veryHighDecor, veryHigh.map(decoratorCallback));
  }

  private deleteDecorations(document: vscode.TextDocument): void {
    this.savedDocs.push(document.fileName);
    for (let [key, value] of this.decorators) {
      if (
        key === `${document.fileName}low` ||
        key === `${document.fileName}medium` ||
        key === `${document.fileName}high` ||
        key === `${document.fileName}veryHigh`
      ) {
        value.dispose();
      }
    }
  }

  public dispose(): void {
    this.listener.dispose();
  }

  public static async createDecorator(
    rankingFile: string,
    extensionPath: string,
    projectPath: string,
  ): Promise<Decorator> {
    let maxProbability = 0.0;

    const ranking = rankingFile
      .split('\n')
      .slice(0, -1)
      .map((rankingLine) => new RankingLine(rankingLine))
      .reduce(
        (
          prev: Ranking,
          curr: RankingLine,
          _currIdx: number,
          _arr: RankingLine[],
        ) => {
          
          const key = curr.getName().includes('$') ? curr.getName().split('$')[0] : curr.getName();
          const susp = curr.getSus();
          (prev[key] = prev[key] || new RankingGroup()).lines.push(curr);
          maxProbability = susp > maxProbability ? susp : maxProbability;
          return prev;
        },
        {},
      );

    for (const key in ranking) {
      await Decorator.addToFaulty(key, projectPath);
      Decorator.splitProbability(ranking[key], maxProbability);
    }
    return new Decorator(ranking, extensionPath);
  }

  private static splitProbability(
    group: RankingGroup,
    maxProbability: number,
  ): void {
    if (maxProbability === 0) {
      group.low.push(...group.lines);
      return;
    }

    group.lines.forEach((line) => {
      const div = line.getSus() / maxProbability;
      if (div < 0.4) {
        group.low.push(line);
      } else if (div < 0.6) {
        group.medium.push(line);
      } else if (div < 0.85) {
        group.high.push(line);
      } else {
        group.veryHigh.push(line);
      }
    });
  }
  private static async addToFaulty(folder: string, projectPath: string) {
    let faultyClass: TreeFolder;
    let label: string;
    let glob: string;

    let folderToFind = folder.replace(/\./g, '/') + '.java';
    label = folder.split('.').pop()!;

    glob = `**/*${folderToFind}`;

    await vscode.workspace
      .findFiles(glob, '/node_modules/', 1)
      .then((uris: vscode.Uri[]) => {
        uris.forEach((uri: vscode.Uri) => {
          faultyClass = new TreeFolder(label, uri.fsPath);
          if (
            !Decorator.faultyClasses.some((f) => f.path === faultyClass.path)
          ) {
            Decorator.faultyClasses.push(faultyClass);
          }
        });
      });
  }
}
