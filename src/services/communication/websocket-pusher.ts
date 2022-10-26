import axios from "axios";
import { Injectable } from "injection-js";

@Injectable()
export class WebsocketPusher {

  // route constants
  static SPONSORSHIP = 'sponsorship';
  static EVENTS = 'event';
  static HACKATHONS = 'hackathon';
  static EXTRA_CREDIT = 'extra-credit'
  static UPDATE_ROUTE_URL = 'https://ws.hackpsu.org/update/';
  
  constructor() {

  }

  public async sendUpdateRequest(endpoint: string, idtoken: string) {
    const route = WebsocketPusher.UPDATE_ROUTE_URL.concat(endpoint);
    const body = { to: 'MOBILE' };
    const headers = { headers: { idtoken: idtoken }};
    try {
      axios.post(route, body, headers);
    } catch (error) {
      // do nothing, since it's not entirely critical if the post doesn't go through
    }
  }
}