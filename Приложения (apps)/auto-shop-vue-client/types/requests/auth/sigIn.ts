import Request from "../request"

export interface EmailPhonePayload {
  email_phone: string
  h_captcha_response?: string
}

export class SigIn extends Request implements EmailPhonePayload {
  email_phone: string = ""
  password: string = ""
}

export class CodeRequest extends Request implements EmailPhonePayload {
  email_phone: string = ""
}
