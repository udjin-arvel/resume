import logging
from typing import Any

from playwright.async_api import Error as PlaywrightError
from playwright.async_api import TimeoutError as PlaywrightTimeoutError
from playwright.async_api import async_playwright
from playwright_stealth import stealth_async

from app.core.config import get_settings
from app.parsers.base import BaseParser, ParseError
from app.parsers.extractors import (
    extract_emails,
    extract_phones,
    extract_prices,
    looks_like_captcha,
    normalize_link,
)
from app.parsers.schemas import ParseResult

logger = logging.getLogger(__name__)

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)


class SiteParser(BaseParser):
    async def parse(self, url: str) -> ParseResult:
        settings = get_settings()
        timeout = settings.parser_timeout_ms
        max_chars = settings.parser_max_text_chars

        try:
            async with async_playwright() as playwright:
                browser = await playwright.chromium.launch(
                    headless=True,
                    args=["--disable-blink-features=AutomationControlled"],
                )
                try:
                    context = await browser.new_context(
                        user_agent=USER_AGENT,
                        viewport={"width": 1366, "height": 768},
                        locale="ru-RU",
                    )
                    page = await context.new_page()
                    await stealth_async(page)

                    response = await page.goto(
                        url,
                        wait_until="domcontentloaded",
                        timeout=timeout,
                    )
                    status_code = response.status if response else None
                    final_url = page.url

                    title = await page.title()
                    description = await page.evaluate(
                        """() => {
                            const og = document.querySelector('meta[property="og:description"]');
                            if (og && og.content) return og.content;
                            const meta = document.querySelector('meta[name="description"]');
                            return meta ? meta.content : null;
                        }"""
                    )

                    headings = await page.evaluate(
                        """() => Array.from(document.querySelectorAll('h1, h2, h3'))
                            .map(el => (el.innerText || '').trim())
                            .filter(Boolean)
                            .slice(0, 100)"""
                    )

                    text_content = await page.evaluate(
                        """() => {
                            const clone = document.body ? document.body.cloneNode(true) : null;
                            if (!clone) return '';
                            clone.querySelectorAll('script, style, noscript, svg').forEach(el => el.remove());
                            return (clone.innerText || '').replace(/\\s+/g, ' ').trim();
                        }"""
                    )
                    if text_content and len(text_content) > max_chars:
                        text_content = text_content[:max_chars]

                    if looks_like_captcha(title, text_content):
                        raise ParseError("Captcha or bot challenge detected")

                    raw_links = await page.evaluate(
                        """() => Array.from(document.querySelectorAll('a[href]')).map(a => ({
                            href: a.getAttribute('href'),
                            text: (a.innerText || '').trim().slice(0, 200)
                        }))"""
                    )
                    links: list[dict[str, str]] = []
                    seen_hrefs: set[str] = set()
                    for item in raw_links:
                        href = normalize_link(final_url, item.get("href"))
                        if not href or href in seen_hrefs:
                            continue
                        seen_hrefs.add(href)
                        links.append({"href": href, "text": item.get("text") or ""})
                        if len(links) >= 200:
                            break

                    mailto_emails = [
                        href.removeprefix("mailto:").split("?")[0]
                        for href in seen_hrefs
                        if href.startswith("mailto:")
                    ]
                    tel_phones = [
                        href.removeprefix("tel:")
                        for href in seen_hrefs
                        if href.startswith("tel:")
                    ]

                    emails = sorted(set(extract_emails(text_content or "") + mailto_emails))
                    phones = sorted(set(extract_phones(text_content or "") + tel_phones))
                    prices = extract_prices(text_content or "")

                    meta_tags = await page.evaluate(
                        """() => {
                            const result = {};
                            document.querySelectorAll('meta[name], meta[property]').forEach(el => {
                                const key = el.getAttribute('property') || el.getAttribute('name');
                                const content = el.getAttribute('content');
                                if (key && content && (
                                    key.startsWith('og:') || key === 'description' || key === 'keywords'
                                )) {
                                    result[key] = content;
                                }
                            });
                            return result;
                        }"""
                    )

                    meta: dict[str, Any] = {
                        "status": status_code,
                        "final_url": final_url,
                        **(meta_tags or {}),
                    }

                    return ParseResult(
                        url=final_url,
                        title=title or None,
                        description=description,
                        text_content=text_content or None,
                        headings=headings or [],
                        links=links,
                        prices=prices,
                        contacts={"emails": emails, "phones": phones},
                        meta=meta,
                    )
                finally:
                    await browser.close()
        except ParseError:
            raise
        except PlaywrightTimeoutError as exc:
            logger.warning("Parse timeout for %s: %s", url, exc)
            raise ParseError(f"Timeout while loading {url}") from exc
        except PlaywrightError as exc:
            logger.warning("Playwright error for %s: %s", url, exc)
            raise ParseError(f"Failed to load {url}: {exc}") from exc
        except Exception as exc:
            logger.exception("Unexpected parse error for %s", url)
            raise ParseError(f"Unexpected parse error: {exc}") from exc
