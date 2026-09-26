const tokenKey = 'scanme.admin.accessToken'

export function getAdminToken() {
  return localStorage.getItem(tokenKey)
}

export function setAdminToken(token: string) {
  localStorage.setItem(tokenKey, token)
}

export function clearAdminToken() {
  localStorage.removeItem(tokenKey)
}

export function isAdminAuthenticated() {
  return Boolean(getAdminToken())
}
