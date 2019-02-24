import { Inject, Injectable } from 'injection-js';
import moment from 'moment';
import { HttpError } from '../JSCommon/errors';
import { Event } from '../models/event/event';
import { IScannerDataMapper } from '../models/scanner';
import { RfidAssignment } from '../models/scanner/rfid-assignment';
import { ResponseBody } from '../router/router-types';
import { IApikeyAuthService } from '../services/auth/auth-types';
import { IDataMapperHackathonSpecific, IDbResult } from '../services/database';

export interface IScannerProcessor {
  processRfidAssignments(inputAssignments: any | any[]): Promise<ResponseBody>;

  processorScannerConfirmation(pin: number, macAddress: string): Promise<ResponseBody>;

  getRelevantEvents(): Promise<ResponseBody>;
}

@Injectable()
export class ScannerProcessor implements IScannerProcessor {

  private readonly timePad: Array<number | string>;
  constructor(
    @Inject('IScannerDataMapper') protected readonly scannerDataMapper: IScannerDataMapper,
    @Inject('IScannerAuthService') protected readonly scannerAuthService: IApikeyAuthService,
    @Inject('IEventDataMapper') private readonly eventDataMapper: IDataMapperHackathonSpecific<Event>,
  ) {
    this.timePad = [15, 'minutes'];
  }

  public async processRfidAssignments(inputAssignments: any | any[]) {
    let response: ResponseBody;
    if (Array.isArray(inputAssignments)) {
      const assignments: RfidAssignment[] = inputAssignments.map(
        assignment => new RfidAssignment(assignment));
      const result = await this.scannerDataMapper
        .addRfidAssignments(assignments);

      // Find response status to send
      const status = Math.max(
        ...result.data.map(
          (individualResult) => {
            switch (individualResult.result) {
              case 'Error':
                return 500;
              case 'Duplicate detected':
                return 409;
              case 'Bad input':
                return 400;
              default:
                return 200;
            }
          },
        ),
      );

      response = new ResponseBody(
        'Success',
        status,
        result,
      );
    } else {
      const assignment = new RfidAssignment(inputAssignments);
      const result = await this.scannerDataMapper.insert(assignment);
      response = new ResponseBody(
        'Success',
        200,
        result as IDbResult<RfidAssignment>,
      );
    }
    return response;
  }

  public async processorScannerConfirmation(pin: number, macAddress: string) {
    const result = await this.scannerAuthService.checkPinAuthentication(pin);
    if (!result) {
      throw new HttpError('invalid authentication pin provided', 401);
    }
    const apiToken = await this.scannerAuthService.generateApiKey(macAddress);
    return new ResponseBody('Success', 200, { result: 'Success', data: apiToken });
  }

  public async getRelevantEvents(): Promise<ResponseBody> {
    const { data } = await this.eventDataMapper.getAll({ byHackathon: true });
    const relevantEvents = data.filter(value => this.relevantEventsFilter(value))
      .sort((a, b) =>
        a.event_start_time < b.event_start_time ? -1 :
          a.event_start_time === b.event_start_time ? 0 : -1);
    return new ResponseBody(
      'Success',
      200,
      { data: relevantEvents, result: 'Success' },
    );
  }

  private relevantEventsFilter(value: Event): boolean {
    const result = moment()
      .isBetween(
        moment.unix(value.event_start_time / 1000).subtract(...this.timePad),
        moment.unix(value.event_end_time / 1000).add(...this.timePad),
      );
    return result;
  }
}
