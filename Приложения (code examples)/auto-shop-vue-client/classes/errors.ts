// import { set, get, join, isArray } from "lodash"

import pkg from "lodash"

const { join, get, isArray, set } = pkg

export type ErrorsData = { [key: string]: string | string[] }

export default class Errors {
  private errors: ErrorsData

  /** Create a new Errors instance */
  constructor() {
    this.errors = {}
  }

  /** Determine if an errors exists for the given field */
  has(field: string) {
    return field in this.errors
  }

  /** Determine if we have any errors */
  any() {
    return Object.keys(this.errors).length > 0
  }

  /** Retrieve all error messages */
  all(): string {
    const error = Object.values(this.errors)
    return join(error, ", ")
  }

  /** Retrieve the error message for a field */
  get(field: string): string {
    const error = get(this.errors, field, [])
    return isArray(error) ? join(error, ", ") : error
  }

  /** Record the new error **/
  set(error: { path: string, value: string }) {
    set(this.errors, error.path, error.value)
  }

  /** Record the new errors */
  record(errors?: ErrorsData) {
    this.errors = errors || {}
  }

  /** Clear one or all error fields */
  /** @todo fix behavior that leads to ignoring first char for unput event in inputnumber */

  clear(field?: string) {
    if (field) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete this.errors[field]

      return
    }

    this.errors = {}
  }
}
