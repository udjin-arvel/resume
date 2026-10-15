import Request from "../request"

export class Reset extends Request {
  email: string = ""
  password: string = ""
  password_confirmation: string = ""
  token: string = ""
}
