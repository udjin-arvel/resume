import Request from "../request"

export class ProfileUpdate extends Request {
  name: string = ""
  email: string = ""
  phone: string = ""
  preferred_lang: string = ""
}
