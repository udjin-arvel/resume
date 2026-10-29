export function useCookieConsent() {
  const cookie = useCookie<number | null>("cookie_agree", {
    default: () => 0,
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
  })
  const hasCookieConsent = useState("cookie-consent", () => cookie.value === 1)

  const acceptCookies = () => {
    cookie.value = 1
    hasCookieConsent.value = true
  }

  return { hasCookieConsent, acceptCookies }
}
