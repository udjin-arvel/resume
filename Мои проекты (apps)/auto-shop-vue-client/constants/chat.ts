import {
  RoleAdmin,
  RoleCompany,
  RoleDirector,
  RoleEmployee,
  RoleLogistic,
  RoleSellerClient,
} from "~/constants/roles"

export const carStubImage = "/car-stub.svg"
export const userAvatar = "/chat-user-avatar.svg"
export const adminAvatar = "/chat-admin-avatar.svg"
export const systemAvatar = "/chat-service-avatar.svg"
export const logisticAvatar = "/chat-service-avatar.svg"

export const ChatRoles = {
  Self: "self",
  System: "system",
  Admin: RoleAdmin,
  Seller: RoleSellerClient,
  Buyer: "buyer",
  Logistic: RoleLogistic,
} as const

export const mentions = {
  admin: "admin",
  buyer: "buyer",
  seller: "seller",
  logistic: "logistic",
} as const

export const chatTypes = {
  buyerSeller: "buyer_seller",
  buyerAdmin: "buyer_admin",
  sellerAdmin: "seller_admin",
  searchRequest: "search_request",
} as const

export const chatSubjects = {
  listing: "listing",
  searchRequest: "search_request",
} as const

export const chatLockReasons = {
  searchRequestClosed: "search_request_closed",
  searchRequestUnassigned: "search_request_unassigned",
  listingUnavailable: "listing_unavailable",
} as const

export const mentionAdmin = mentions.admin
export const mentionBuyer = mentions.buyer
export const mentionSeller = mentions.seller
export const mentionLogistic = mentions.logistic

export const ChatRoleMap = {
  [RoleAdmin]: ChatRoles.Admin,
  [RoleSellerClient]: ChatRoles.Seller,
  [RoleCompany]: ChatRoles.Buyer,
  [RoleDirector]: ChatRoles.Buyer,
  [RoleEmployee]: ChatRoles.Buyer,
  [RoleLogistic]: ChatRoles.Logistic,
} as const

export const USER_ROLE_KEY = Symbol("userRole")
export const USER_ID_KEY = Symbol("userId")

export const ChatNoticeKeys = {
  AdminChat: "admin_chat",
  ChatClosed: "chat_closed",
  UserBlocked: "user_blocked",
  ListingDeleted: "listing_deleted",
  SearchRequestClosed: "search_request_closed",
  SearchRequestUnassigned: "search_request_unassigned",
  InvalidFile: "invalid_file",
  UploadingFile: "uploading_file",
  FileUploaded: "file_uploaded",
  UploadFailed: "upload_failed",
  AllowedFormats: "allowed_formats",
} as const

export const ParticipantStatus = {
  Open: "open",
  Closed: "closed",
} as const

export const ChatNoticeKinds = {
  Info: "info",
  Warning: "warning",
  Error: "error",
  Uploading: "uploading",
  Success: "success",
} as const
