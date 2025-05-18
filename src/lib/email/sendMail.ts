import { Resend } from "resend";
import { appConfig } from "../config";
 
const sendMail = async (to: string, subject: string, html: string) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(
      "Sending email to",
      to,
      "with subject",
      subject,
      "and html",
      html
    );
    return;
  }
 
  const resend = new Resend(process.env.RESEND_API_KEY);
 
  const response = await resend.emails.send({
    from: `${appConfig.email.senderName} <${appConfig.email.senderEmail}>`,
    to: [to],
    subject: subject,
    html: html,
    reply_to: appConfig.email.senderEmail,
  });
 
  console.log("Email sent successfully", response);
};
 
export default sendMail;