import Request from "../request"

export class ClientStore extends Request {
  name: string = ""
  fio: string = ""
  phone: string = ""
  email: string = ""
  inn: string = ""
  address: string = ""
  contact: string = ""
}

export class ClientUpdate extends Request {
  name: string = ""
  fio: string = ""
  phone: string = ""
  email: string = ""
  inn: string = ""
  address: string = ""
  contact: string = ""
}
