import { Inject, Injectable } from 'injection-js';
import moment, { unitOfTime } from 'moment';
import { HttpError } from '../JSCommon/errors';
import { Event } from '../models/event/event';
import { IActiveHackathonDataMapper } from '../models/hackathon/active-hackathon';
import { IRegisterDataMapper } from '../models/register';
import { IScannerDataMapper } from '../models/scanner';
import { RfidAssignment } from '../models/scanner/rfid-assignment';
import { Scan } from '../models/scanner/scan';
import { ResponseBody } from '../router/router-types';
import { IApikeyAuthService } from '../services/auth/auth-types';
import { IDataMapperHackathonSpecific, IDbResult } from '../services/database';

export interface IScannerProcessor {
  processRfidAssignments(inputAssignments: any | any[]): Promise<ResponseBody>;

  processorScannerConfirmation(pin: number, macAddress: string): Promise<ResponseBody>;

  getRelevantEvents(): Promise<ResponseBody>;

  processScans(scans: any | any[]): Promise<ResponseBody>;

  getUserByCurrentPin(pin: number): Promise<ResponseBody>;
}

@Injectable()
export class ScannerProcessor implements IScannerProcessor {

  private static relevantEventsFilter(
    value: Event,
    amount: number,
    unit: unitOfTime.Base,
  ): boolean {
    return moment()
      .isBetween(
        moment.unix(value.event_start_time / 1000).subtract(amount, unit),
        moment.unix(value.event_end_time / 1000).add(amount, unit),
      );
  }

  private static unitsStepFunction(int: number) {
    if (int < 0) {
      throw new Error('Illegal value');
    }
    if (int < 5) {
      return 0;
    }
    if (int < 10) {
      return 1;
    }
    if (int < 15) {
      return 2;
    }
    if (int < 20) {
      return 3;
    }
    if (int < 25) {
      return 4;
    }
    return 5;
  }

  private searchAmount: number;
  private readonly searchUnits: unitOfTime.Base[];
  constructor(
    @Inject('IScannerDataMapper') protected readonly scannerDataMapper: IScannerDataMapper,
    @Inject('IRegisterDataMapper') private readonly registerDataMapper: IRegisterDataMapper,
    @Inject('IActiveHackathonDataMapper') private readonly activeHackathonDataMapper: IActiveHackathonDataMapper,
    @Inject('IScannerAuthService') protected readonly scannerAuthService: IApikeyAuthService,
    @Inject('IEventDataMapper') private readonly eventDataMapper: IDataMapperHackathonSpecific<Event>,
  ) {
    this.searchAmount = 15;
    this.searchUnits = ['minutes', 'hours', 'days', 'weeks', 'months', 'years'];
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
    const relevantEvents = this.searchForRelevantEvents(data)
      .sort((a, b) =>
        a.event_start_time < b.event_start_time ? -1 :
          a.event_start_time === b.event_start_time ? 0 : -1);
    return new ResponseBody(
      'Success',
      200,
      { data: relevantEvents, result: 'Success' },
    );
  }

  public async processScans(inputScans: any | any[]): Promise<ResponseBody> {
    let response: ResponseBody;
    if (Array.isArray(inputScans)) {
      const scans: Scan[] = inputScans.map(
        scan => new Scan(scan));
      const result = await this.scannerDataMapper.addScans(scans);

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
      const scan = new Scan(inputScans);
      const result = await this.scannerDataMapper.addSingleScan(scan);
      response = new ResponseBody(
        'Success',
        200,
        result as IDbResult<Scan>,
      );
    }
    return response;
  }

  public searchForRelevantEvents(data: Event[]): Event[] {
    let result: Event[];
    let lastUnit = this.searchUnits[0];
    for (let i = 0; true; i += 1) {
      if (lastUnit !== this.searchUnits[ScannerProcessor.unitsStepFunction(i)]) {
        this.searchAmount = 1;
      }
      lastUnit = this.searchUnits[ScannerProcessor.unitsStepFunction(i)];
      result = data.filter(
        value => ScannerProcessor.relevantEventsFilter(
          value,
          this.searchAmount,
          this.searchUnits[ScannerProcessor.unitsStepFunction(i)],
        ));
      this.searchAmount += 2 + i;
      if (result.length > 0) {
        this.searchAmount = 15;
        return result;
      }
    }
  }

  public async getUserByCurrentPin(pin: number): Promise<ResponseBody> {
    const hackathon = await this.activeHackathonDataMapper.activeHackathon.toPromise();
    const registration = await this.registerDataMapper.getByPin(pin, hackathon);
    return new ResponseBody(
      'Success',
      200,
      registration,
    );
  }
}
