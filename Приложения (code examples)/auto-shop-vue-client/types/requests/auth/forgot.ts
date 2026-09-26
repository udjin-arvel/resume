import Request from "../request"

export class ForgotSendCode extends Request {
  email_phone = ""
}

export class ForgotResetWithCode extends Request {
  email_phone = ""
  code = ""
}
