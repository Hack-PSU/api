export interface IMailListService {
  addSubscriber(emailAddress, listId, other_fields?: any): Promise<any>;

  removeSubscriber(emaiId, listId): Promise<any>;

  getSubscriber(emailId, listId): Promise<any>;

  findList(listName): Promise<IEmailList[] | never>;

  createList(list: IEmailList, mergeFields?: string[]): Promise<IEmailList>;
}

export interface IEmailList {
  id?: string;
  name: string;
  contact: {
    company: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
  };
  permission_reminder: string;
  use_archive_bar?: boolean;
  campaign_defaults: {
    from_name: string;
    from_email: string;
    subject: string;
    language: string;
  };
  notify_on_subscribe?: string;
  notify_on_unsubscribe?: string;
  date_created?: string;
  list_rating?: number;
  email_type_option: boolean;
  subscribe_url_short?: string;
  subscribe_url_long?: string;
  beamer_address?: string;
  visibility?: string;
  modules?: any[];
  stats?: {
    member_count?: number,
    unsubscribe_count?: number,
    cleaned_count?: number,
    member_count_since_send?: number;
    unsubscribe_count_since_send?: number;
    cleaned_count_since_send?: number;
    campaign_count?: number;
    campaign_last_sent?: string;
    merge_field_count?: number;
    avg_sub_rate?: number;
    avg_unsub_rate?: number;
    target_sub_rate?: number;
    open_rate?: number;
    click_rate?: number;
    last_sub_date?: string;
    last_unsub_date?: string;
  };
  _links?: Array<{
    rel?: string;
    href?: string;
    method?: string;
    targetSchema?: string;
  }>;
  total_items?: number;
}
