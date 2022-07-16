import BaseObject from "models/BaseObject";

export interface IScoreApiModel {
  project_id: number,
  judge: String,
  creativity: number,
  technical: number,
  implementation: number,
  clarity: number,
  growth: number,
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
  
}