import Request from "../request"

export class UserStore extends Request {
  name: string = ""
  email: string = ""
  client_id: number | null = null
  role: string = ""
  phone: string = ""
  preferred_lang: string = ""
}

export class UserUpdate extends Request {
  name: string = ""
  email: string = ""
  client_id: number | null = null
  role: string = ""
  phone: string = ""
  preferred_lang: string = ""
}
