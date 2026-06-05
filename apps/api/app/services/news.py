from __future__ import annotations

from asyncio import Lock, Semaphore, gather, sleep
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html import unescape
from re import sub
from statistics import mean
from time import monotonic
from urllib.parse import urlencode
from xml.etree import ElementTree

import httpx

from app.config import settings
from app.ml.news_sentiment import get_news_sentiment_model
from app.models.countries import COUNTRIES, Country
from app.schemas.news import NewsArticle, NewsSignal
from app.services.scoring import clamp


CURRENCY_ALIASES = {
    "USD": "dollar",
    "CAD": "loonie",
    "MXN": "peso",
    "GBP": "pound",
    "EUR": "euro",
    "JPY": "yen",
    "CHF": "franc",
    "AUD": "aussie",
    "TRY": "lira",
    "BRL": "real",
    "INR": "rupee",
    "ZAR": "rand",
    "THB": "baht",
    "KRW": "won",
    "IDR": "rupiah",
    "CNY": "yuan",
    "PLN": "zloty",
    "ISK": "krona",
}

NEWS_CACHE_TTL_SECONDS = 60 * 60 * 6
GDELT_MIN_INTERVAL_SECONDS = 5.2
NEUTRAL_NEWS_SCORE = 50.0
GOOGLE_NEWS_RSS_URL = "https://news.google.com/rss/search"
_NEWS_CACHE: dict[str, tuple[float, NewsSignal]] = {}
_GDELT_LOCK = Lock()
_LAST_GDELT_CALL = 0.0


def build_country_news_terms(country: Country, include_window: bool = False) -> str:
    currency_alias = CURRENCY_ALIASES.get(country.currency, country.currency.lower())
    terms = (
        f'"{country.country_name}" {country.currency} {currency_alias} '
        "currency economy inflation central bank debt reserves"
    )
    if include_window:
        return f"{terms} when:90d"
    return terms


def build_country_news_query(country: Country) -> str:
    return f"{build_country_news_terms(country)} sourcelang:English"


def build_google_news_rss_url(country: Country) -> str:
    params = urlencode(
        {
            "q": build_country_news_terms(country, include_window=True),
            "hl": "en-US",
            "gl": "US",
            "ceid": "US:en",
        }
    )
    return f"{GOOGLE_NEWS_RSS_URL}?{params}"


def clean_text(value: str | None) -> str:
    if not value:
        return ""
    without_tags = sub(r"<[^>]+>", " ", value)
    return " ".join(unescape(without_tags).split())


def parse_rss_datetime(value: str | None) -> str | None:
    if not value:
        return None
    try:
        return parsedate_to_datetime(value).isoformat()
    except (TypeError, ValueError, IndexError, AttributeError):
        return value


def parse_rss_articles(xml_text: str) -> list[dict]:
    root = ElementTree.fromstring(xml_text)
    articles: list[dict] = []

    for item in root.findall(".//item"):
        title = clean_text(item.findtext("title"))
        url = clean_text(item.findtext("link"))
        if not title or not url:
            continue

        source = item.find("source")
        source_name = clean_text(source.text if source is not None else None)
        articles.append(
            {
                "title": title,
                "url": url,
                "domain": source_name or "Google News",
                "language": "English",
                "sourcecountry": None,
                "seendate": parse_rss_datetime(item.findtext("pubDate")),
            }
        )

    return articles


async def fetch_rss_articles(country: Country, max_records: int = 30) -> list[dict]:
    async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
        response = await client.get(
            build_google_news_rss_url(country),
            headers={"User-Agent": "AtlasFX research prototype"},
        )
        response.raise_for_status()

    return parse_rss_articles(response.text)[:max_records]


async def fetch_gdelt_articles(country: Country, max_records: int = 30, timespan: str = "7d") -> dict:
    global _LAST_GDELT_CALL

    async with _GDELT_LOCK:
        elapsed = monotonic() - _LAST_GDELT_CALL
        if elapsed < GDELT_MIN_INTERVAL_SECONDS:
            await sleep(GDELT_MIN_INTERVAL_SECONDS - elapsed)
        _LAST_GDELT_CALL = monotonic()

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(
            f"{settings.gdelt_base_url}/doc/doc",
            params={
                "query": build_country_news_query(country),
                "mode": "artlist",
                "format": "json",
                "maxrecords": max_records,
                "timespan": timespan,
                "sort": "datedesc",
            },
        )
        response.raise_for_status()
        return response.json()


def parse_articles(payload: dict) -> list[dict]:
    articles = payload.get("articles", [])
    if isinstance(articles, list):
        return [article for article in articles if isinstance(article, dict)]
    return []


def analyze_articles(
    country: Country,
    articles: list[dict],
    query: str,
    source: str = "GDELT DOC API + Atlas local NLP",
) -> NewsSignal:
    model = get_news_sentiment_model()
    analyzed: list[NewsArticle] = []

    for article in articles:
        title = str(article.get("title") or "").strip()
        url = str(article.get("url") or "").strip()
        if not title or not url:
            continue

        prediction = model.predict(title)
        analyzed.append(
            NewsArticle(
                title=title,
                url=url,
                domain=article.get("domain"),
                language=article.get("language"),
                source_country=article.get("sourcecountry"),
                seen_at=article.get("seendate"),
                sentiment_score=float(prediction["sentiment_score"]),
                stress_probability=float(prediction["stress_probability"]),
                theme_hits=list(prediction["theme_hits"]),
            )
        )

    return build_news_signal(country, analyzed, query, source)


def build_news_signal(
    country: Country,
    articles: list[NewsArticle],
    query: str,
    source: str,
) -> NewsSignal:
    if not articles:
        return NewsSignal(
            country_code=country.country_code,
            country_name=country.country_name,
            currency=country.currency,
            as_of=datetime.now(timezone.utc).date().isoformat(),
            source=f"{source}; no live headlines returned, neutral no-data score",
            query=query,
            article_count=0,
            news_stress_score=NEUTRAL_NEWS_SCORE,
            average_sentiment=0.0,
            negative_article_share=0.0,
            crisis_theme_share=0.0,
            articles=[],
        )

    stress_values = [article.stress_probability for article in articles]
    sentiment_values = [article.sentiment_score for article in articles]
    negative_share = sum(1 for value in stress_values if value >= 0.55) / len(stress_values)
    crisis_theme_share = sum(1 for article in articles if article.theme_hits) / len(articles)
    volume_score = clamp((len(articles) / 30) * 100)
    news_stress_score = clamp(
        (mean(stress_values) * 55)
        + (negative_share * 20)
        + (crisis_theme_share * 15)
        + (volume_score * 0.10)
    )

    return NewsSignal(
        country_code=country.country_code,
        country_name=country.country_name,
        currency=country.currency,
        as_of=datetime.now(timezone.utc).date().isoformat(),
        source=source,
        query=query,
        article_count=len(articles),
        news_stress_score=round(news_stress_score, 1),
        average_sentiment=round(mean(sentiment_values), 3),
        negative_article_share=round(negative_share, 3),
        crisis_theme_share=round(crisis_theme_share, 3),
        articles=sorted(articles, key=lambda article: article.stress_probability, reverse=True)[:10],
    )


async def country_news_signal(country: Country) -> NewsSignal:
    cache_key = country.country_code
    cached = _NEWS_CACHE.get(cache_key)
    if cached and monotonic() - cached[0] < NEWS_CACHE_TTL_SECONDS:
        return cached[1]

    rss_query = build_country_news_terms(country, include_window=True)
    try:
        articles = await fetch_rss_articles(country)
        signal = analyze_articles(country, articles, rss_query, "Google News RSS + Atlas local NLP")
        _NEWS_CACHE[cache_key] = (monotonic(), signal)
        return signal
    except (httpx.HTTPError, ValueError, KeyError, ElementTree.ParseError):
        pass

    gdelt_query = build_country_news_query(country)
    try:
        payload = await fetch_gdelt_articles(country)
        signal = analyze_articles(country, parse_articles(payload), gdelt_query)
    except (httpx.HTTPError, ValueError, KeyError):
        signal = build_news_signal(
            country,
            [],
            rss_query,
            "Google News RSS and GDELT unavailable",
        )

    _NEWS_CACHE[cache_key] = (monotonic(), signal)
    return signal


async def all_country_news_signals(
    countries: tuple[Country, ...] = COUNTRIES,
) -> dict[str, NewsSignal]:
    semaphore = Semaphore(5)

    async def load_signal(country: Country) -> tuple[str, NewsSignal]:
        async with semaphore:
            return country.country_code, await country_news_signal(country)

    signals = await gather(*(load_signal(country) for country in countries))
    return dict(signals)
