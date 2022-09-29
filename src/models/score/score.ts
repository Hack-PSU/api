import BaseObject from "../BaseObject";

export interface IScoreApiModel {
  project_id: number,
  judge: String,
  creativity: number,
  technical: number,
  implementation: number,
  clarity: number,
  growth: number,
  submitted?: boolean,
  humanitarian?: number,
  supply_chain?: number,
  environmental?: number
}

export class Score extends BaseObject {
  
  public project_id: number;
  public judge: String;
  public creativity: number;
  public technical: number;
  public implementation: number;
  public clarity: number;
  public growth: number;
  public submitted?: boolean;
  public humanitarian?: number;
  public supply_chain?: number;
  public environmental?: number;

  constructor(data: IScoreApiModel) {
    super();
    this.project_id = data.project_id;
    this.judge = data.judge;
    this.creativity = data.creativity;
    this.technical = data.technical;
    this.implementation = data.implementation;
    this.clarity = data.clarity;
    this.growth = data.growth;
    this.submitted = data.submitted;
    this.humanitarian = data.humanitarian;
    this.supply_chain = data.supply_chain;
    this.environmental = data.environmental;
  }

  public get id() {
    return this.project_id;
  }

  public get schema() {
    return null;
  }

  public static blankScore(project_id: number, judge: string): Score {
    return new Score({
      judge: judge,
      project_id: project_id,
      creativity: 1,
      technical: 1,
      implementation: 1,
      clarity: 1,
      growth: 1,
      submitted: false,
    })
  }
  
}