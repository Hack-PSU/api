import { Hackathon } from '../hackathon';
import { IHackathonApiModel } from '../index';

export class ActiveHackathon extends Hackathon {
  constructor(data: IHackathonApiModel) {
    super(data);
    this.active = true;
  }
}
