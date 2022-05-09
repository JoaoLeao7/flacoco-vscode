import * as os from 'os';

const exec = require('util').promisify(require('child_process').exec);

export class Command {
  private readonly commands: string[];

  constructor() {
    this.commands = [];
  }

  public newCmd(): Command {
    this.commands.push('&&');
    return this;
  }

  public cd(absoluteProjectPath: string): Command {
    this.commands.push(`cd ${this.toPosixAbsolutePath(absoluteProjectPath)}`);
    return this;
  }

  public java(): Command {
    this.commands.push('java');
    return this;
  }
  public jar(relativeDest: string): Command {
    this.commands.push(`-jar ${relativeDest}`);
    return this;
  }
  public pp(absoluteProjectPath: string): Command {
    this.commands.push(
      `--projectpath ${this.toPosixAbsolutePath(
        absoluteProjectPath,
      )}`,
    );
    return this;
  }
  public main(mainArgs: string): Command {
    this.commands.push(mainArgs);
    return this;
  }

  public toString(): string {
    return `(${this.commands.join(' ')})`;
  }

  public static async exec(cmd: string) {
    let failed = false;
    let stdoutStr = '';
    let stderrStr = '';

    try {
      const { stdout, stderr } = await exec(cmd);
      stdoutStr = `${stdout}`;
      stderrStr = `${stderr}`;
    } catch (error) {
      failed = true;
      stderrStr = `${error}`;
    }

    return new CommandRet(failed, stdoutStr, stderrStr);
  }

  private toPosixAbsolutePath(dest: string) {
    return os.platform() !== 'win32' ? '/' + dest : dest;
  }
}

export class CommandRet {
  public readonly failed: boolean;
  public readonly stdout: string;
  public readonly stderr: string;

  constructor(failed: boolean, stdout: string, stderr: string) {
    this.failed = failed;
    this.stdout = stdout;
    this.stderr = stderr;
  }
}
