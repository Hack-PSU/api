import { Injectable } from 'injection-js';
import 'reflect-metadata';
import { GcsMapper } from '../mapper/gcs-mapper';
import { IStorageMapperParams } from '../storage-types';
import { IStorageService } from './storage.service';

@Injectable()
export class GoogleStorageService implements IStorageService {

  public mapper(storageParams: IStorageMapperParams): GcsMapper {
    return new GcsMapper(storageParams);
  }
}
