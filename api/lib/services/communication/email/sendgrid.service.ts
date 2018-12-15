import * as sendgrid from '@sendgrid/mail';
import * as validator from 'email-validator';
import { EmailReplacementError } from '../../../JSCommon/errors';
import { IEmailData } from './email-types';
import { IEmailService } from './email.service';

export class SendgridService implements IEmailService {

  public static createEmailRequest(
    email: string,
    htmlContent: string,
    subject: string,
    fromEmail: string,
  ) {
    if (!validator.validate(email)) {
      throw new Error('Invalid email');
    }
    const emailAddress = validator.validate(fromEmail) ? fromEmail : 'team@hackpsu.org';
    return {
      from: emailAddress,
      html: htmlContent,
      replyTo: emailAddress,
      subject,
      to: email,
    };
  }

  /**
   * This function substitutes the provided
   * @param {String} html A string of HTML text that forms the body of the email.
   *        All substitutables must be formatted as $substitutable$.
   *        The HTML MUST contain the $NAME$ substitutable.
   * @param {String} name The name of the recipient
   * @param {Map<string, string>>} [substitutions] A map of strings with the following format
   *        { keyword-to-substitute: string-to-substitute-with, ... };
   *        Example: { date: "09-23-2000" }
   * @return {string} return substituted version of the html
   * @throws EmailReplacementError
   */
  public static emailSubstitute(html: string, name: string, substitutions: Map<string, string>) {
    let subbedHTML = name ? html.replace(/\$name\$/g, name) : html;
    for (const key in substitutions) {
      if (substitutions[key] && substitutions[key].length > 0 && key.length > 0) {
        subbedHTML = subbedHTML.replace(new RegExp(`\\$${key}\\$`, 'g'), substitutions[key]);
      } else {
        const error = new EmailReplacementError(
          'One or more substitution keyword or substitution-text is empty',
          key,
          substitutions[key],
        );
        throw error;
      }
    }
    return subbedHTML;
  }

  public sendEmail(data: IEmailData) {
    return sendgrid.send(data);
  }
}
