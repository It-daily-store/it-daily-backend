import nodemailer from "nodemailer";
import config from "../config";

export const sendEmail = async (to: string, html: string, subject: string) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: config.node_environment === "production", // true for port 465, false for other ports
    auth: {
      user: config.smtp_user,
      pass: config.smtp_app_password,
    },
  });

  await transporter.sendMail({
    from: "khanmahmud994@gmail.com", // sender address
    to: to, // list of receivers
    subject: subject, // Subject line
    html: html,
  });
};
