import nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "ceo@glowbook.in",
    pass: "ceo@glowbook"
  }
});

export async function sendEmail(
  to: string,
  subject: string,
  html: string
) {
  await mailer.sendMail({
    from: "ceo@glowbook.in",
    to,
    subject,
    html
  });
}
