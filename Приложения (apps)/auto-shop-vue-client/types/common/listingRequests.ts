import type {
  RequestTypeBooking,
  RequestTypeCompensation,
  RequestTypeDiagnostic,
  RequestTypeMessage,
  RequestTypeVideo,
} from "~/constants/listingRequests"

export type RequestType =
  | typeof RequestTypeVideo
  | typeof RequestTypeDiagnostic
  | typeof RequestTypeCompensation
  | typeof RequestTypeBooking
  | typeof RequestTypeMessage
