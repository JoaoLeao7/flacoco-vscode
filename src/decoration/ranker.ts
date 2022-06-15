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

  public static lowProb = 0.2;
  public static mediumProb = 0.5;
  public static highProb = 0.75;

  private readonly name: string;
  private readonly line: number;
  private readonly sus: number;
  private susText: string;

  constructor(ranking: string) {
    const split = ranking.split(',');

    if (split === null) {
      throw new Error('Inaccessible point.');
    }

    const [name, line, sus] = split;

    this.name = name;
    this.line = Number(line);
    this.sus = Number(sus);
    this.susText = "";
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

  public convertSus(sus: number) {
    if (sus < RankingLine.lowProb) {
      this.susText = 'This line has a low suspicion level';
    } else if (sus < RankingLine.mediumProb) {
      this.susText =  'This line has a medium suspicion level';
    } else if (sus < RankingLine.highProb) {
      this.susText =  'This line has a high suspicion level';
    } else {
      this.susText ='This line has a very high suspicion level';
    }

  }
}
