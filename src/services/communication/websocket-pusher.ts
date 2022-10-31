import axios from "axios";
import { Injectable } from "injection-js";

/* Handles pushing updates to mobile and admin applications by making a request to the websocket to ping
   the mobile and admin applications to re-request the relevant information 
*/
@Injectable()
export class WebsocketPusher {

  // route constants
  static SPONSORSHIP = 'sponsorship';
  static EVENTS = 'event';
  static HACKATHONS = 'hackathon';
  static EXTRA_CREDIT = 'extra-credit'
  static UPDATE_ROUTE_URL = 'https://ws.hackpsu.org/update/';

  // ping constants
  static MOBILE = 'MOBILE';
  static ADMIN = 'ADMIN';
  
  constructor() {

  }

  public async sendUpdateRequest(endpoint: string, pingTargets: string | string[], idtoken: string) {
    const route = WebsocketPusher.UPDATE_ROUTE_URL.concat(endpoint);
    const headers = { headers: { idtoken: idtoken }};
    if (Array.isArray(pingTargets)) {
      pingTargets.forEach(async element => {
        this.doRequestIgnoringError(route, { to: element }, headers);
      });
    } else {
      this.doRequestIgnoringError(route, { to: pingTargets }, headers);
    }
  }

  public async doRequestIgnoringError(route: string, body: { to: string }, headers: { headers: { idtoken: string }}) {
    try {
      axios.post(route, body, headers);
    } catch (error) {
      // do nothing, since it's not entirely critical if the post doesn't go through
    }
  }
}