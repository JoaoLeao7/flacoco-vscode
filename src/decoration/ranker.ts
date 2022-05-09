import { join, sep } from 'path';

export { Ranking, RankingGroup, RankingLine };

interface Ranking {
  [key: string]: RankingGroup;
}

class RankingGroup {
  public readonly low: RankingLine[] = [];
  public readonly medium: RankingLine[] = [];
  public readonly high: RankingLine[] = [];
  public readonly veryHigh: RankingLine[] = [];
  public readonly lines: RankingLine[] = [];
}

class RankingLine {
  private readonly name: string;
  private readonly line: number;
  private readonly sus: number;
  private readonly susText: string;

  constructor(ranking: string) {
    const split = ranking.split(',');

    if (split === null) {
      throw new Error('Inaccessible point.');
    }

    const [name, line, sus] = split;

    this.name = name;
    this.line = Number(line);
    this.sus = Number(sus);
    this.susText = this.convertSus(this.sus);
  }

  public getName(): string {
    return this.name;
  }

  public getLine(): number {
    return this.line;
  }

  public getSus(): number {
    return this.sus;
  }
  public getSusText(): string {
    return this.susText;
  }

  private convertSus(sus: number): string {
    if (sus < 0.4) {
     return 'This line has a low suspicion level';
    } else if (sus < 0.6) {
     return 'This line has a medium suspicion level';
    } else if (sus < 0.85) {
      return 'This line has a high suspicion level';
    } else {
      return 'This line has a very high suspicion level';
    }

  }
}
