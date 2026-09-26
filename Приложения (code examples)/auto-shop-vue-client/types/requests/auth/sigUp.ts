import Request from "../request"

export class SigUp extends Request {
  name: string = ""
  fio: string = ""
  phone: string = ""
  email: string = ""
  inn: string = ""
  address: string = ""
  contact: string = ""
  password: string = ""
  password_confirmation: string = ""
}
