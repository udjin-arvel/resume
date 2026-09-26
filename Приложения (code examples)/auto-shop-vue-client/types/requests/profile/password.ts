import Request from "../request"

export class PasswordUpdate extends Request {
  current_password: string = ""
  password: string = ""
  password_confirmation: string = ""
}
