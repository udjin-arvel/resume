import Request from "../request"

export class PasswordUpdate extends Request {
  password: string = ""
  password_confirmation: string = ""
}
