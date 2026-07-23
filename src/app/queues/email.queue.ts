import { Queue, Worker } from "bullmq";
import { RedisKeys } from "../interface/common";
import { sendEmail } from "../utils/sendEmail";
import { generateOrderEmailHTML } from "../templates/generateOrderEmailHTML";
import { generateVerifyEmailHtml } from "../templates/generateVerifyEmailHtml";
import { generateResetPassHtml } from "../templates/generateResetPassHtml";

export enum EmailJobName {
  sendVerificationEmail = "sendVerificationEmail",
  sendResetPasswordEmail = "sendResetPasswordEmail",
  sendOrderConfirmationEmail = "sendOrderConfirmationEmail",
  sendPaymentConfirmationEmail = "sendPaymentConfirmationEmail",
}

const redisConnection = {
  connection: {
    url: process.env.REDIS_URL,
  },
};

export const emailQueue = new Queue(RedisKeys.email, redisConnection);

const emailWorker = new Worker(
  RedisKeys.email,
  async (job) => {
    if (job.name === EmailJobName.sendVerificationEmail) {
      try {
        const { opt, user } = job.data;
        const mailBody = generateVerifyEmailHtml(opt, user?.name);

        await sendEmail(user.email, mailBody, "Verify your email");
      } catch (err) {
        console.log(err);
      }
    }
    if (job.name === EmailJobName.sendResetPasswordEmail) {
      const { opt, user } = job.data;
      try {
        const mailBody = generateResetPassHtml(opt, user?.name);

        await sendEmail(user.email, mailBody, "Reset your password");
      } catch (err) {
        console.log(err);
      }
    }
    if (job.name === EmailJobName.sendOrderConfirmationEmail) {
      const { order, user } = job.data;
      try {
        const subject = `Order Confirmation #${order.orderNumber}`;
        const html = generateOrderEmailHTML(order);

        return sendEmail(user.email, html, subject);
      } catch (err) {
        console.log(err);
      }
    }
    if (job.name === EmailJobName.sendOrderConfirmationEmail) {
      const { order, user } = job.data;
      try {
        const subject = `Order Confirmation #${order.orderNumber}`;
        const html = generateOrderEmailHTML(order);

        return sendEmail(user.email, html, subject);
      } catch (err) {
        console.log(err);
      }
    }
    if (job.name === EmailJobName.sendPaymentConfirmationEmail) {
      const { order, user } = job.data;
      try {
        const subject = `Order Confirmation #${order.orderNumber}`;
        const html = generateOrderEmailHTML(order);

        return sendEmail(user.email, html, subject);
      } catch (err) {
        console.log(err);
      }
    }
  },
  redisConnection
);

emailWorker.on("completed", (job) => {
  console.log(`Deal Job ${job.id} completed!`);
});

emailWorker.on("failed", (job, err) => {
  console.log(`Deal Job ${job?.id} failed: ${err.message}`);
});
