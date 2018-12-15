export interface IMailListService {
  addSubscriber(emailAddress, listId): Promise<any>;

  removeSubscriber(emaiId, listId): Promise<any>;

  getSubscriber(emailId, listId): Promise<any>;

  findList(listName): Promise<any | never>;
}
