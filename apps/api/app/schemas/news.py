from pydantic import BaseModel


class NewsArticle(BaseModel):
    title: str
    url: str
    domain: str | None = None
    language: str | None = None
    source_country: str | None = None
    seen_at: str | None = None
    sentiment_score: float
    stress_probability: float
    theme_hits: list[str]


class NewsSignal(BaseModel):
    country_code: str
    country_name: str
    currency: str
    as_of: str
    source: str
    query: str
    article_count: int
    news_stress_score: float
    average_sentiment: float
    negative_article_share: float
    crisis_theme_share: float
    articles: list[NewsArticle]
