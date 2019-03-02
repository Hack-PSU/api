export interface IPushNotifService {
  sendNotification(notificationTitle: string, notificationBody: string): Promise<any>;
}
