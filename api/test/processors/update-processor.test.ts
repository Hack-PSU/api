import { expect } from 'chai';
import 'mocha';
import { instance, mock, reset, verify } from 'ts-mockito';
import { Update } from '../../src/models/update/update';
import { UpdateDataMapperImpl } from '../../src/models/update/update-data-mapper-impl';
import { UpdateProcessor } from '../../src/processors/update-processor';
import { IPushNotifService } from '../../src/services/communication/push-notification';
import { OnesignalService } from '../../src/services/communication/push-notification/onesignal.service';
import { Logger } from '../../src/services/logging/logging';

// Global mocks
const updateDMMock = mock(UpdateDataMapperImpl);
const pushServiceMock = mock(OnesignalService);
let updateDataMapper: UpdateDataMapperImpl;
let pushNotifService: IPushNotifService;
const update = new Update({
  updateTitle: 'test update',
  updateText: 'test update text',
  updateTime: Date.now(),
  pushNotification: false,
});

describe('TEST: Update Processor', () => {
  beforeEach(() => {
    updateDataMapper = instance(updateDMMock);
    pushNotifService = instance(pushServiceMock);
  });

  afterEach(() => {
    reset(updateDMMock);
    reset(pushServiceMock);
  });
  describe('TEST: Process Update', () => {
    it('it processes a valid update without push notification', async () => {
      // GIVEN: An update processor
      const updateProcessor = new UpdateProcessor(
        updateDataMapper,
        pushNotifService,
        new Logger(),
      );
      // WHEN: Processing the update
      await updateProcessor.processUpdate(update);
      // THEN: update was inserted
      verify(updateDMMock.insert(update)).once();
    });

    it('it processes a valid update with push notification', async () => {
      update.push_notification = true;
      // GIVEN: An update processor
      const updateProcessor = new UpdateProcessor(
        updateDataMapper,
        pushNotifService,
        new Logger(),
      );
      // WHEN: Processing the update
      await updateProcessor.processUpdate(update);
      // THEN: update was inserted
      verify(updateDMMock.insert(update)).once();
      // THEN: a push notification was sent
      verify(pushServiceMock.sendNotification(update.update_title, update.update_text)).once();
    });
  });
});
