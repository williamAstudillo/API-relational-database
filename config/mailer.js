require('dotenv').config()
const nodemailer = require('nodemailer')

  // create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({

    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // generated ethereal user
      pass: process.env.EMAIL_PASSW, // generated ethereal password
    },
  });

  transporter.verify().then(() => {
      console.log("ready to send emails")
  }).catch((err) => {
    console.log("errorrrrrr")
    console.log(err)
  })

  module.exports = transporter