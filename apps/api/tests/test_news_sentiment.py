from app.ml.news_sentiment import get_news_sentiment_model
from app.models.countries import COUNTRY_BY_CODE
from app.services.news import analyze_articles, build_country_news_query, parse_rss_articles


def test_news_model_scores_crisis_language_higher_than_stability_language() -> None:
    model = get_news_sentiment_model()
    crisis = model.predict("currency crisis deepens after devaluation and inflation shock")
    stable = model.predict("currency steadies as inflation cools and reserves improve")

    assert crisis["stress_probability"] > stable["stress_probability"]
    assert crisis["sentiment_score"] < stable["sentiment_score"]


def test_gdelt_query_includes_country_currency_and_language_filter() -> None:
    query = build_country_news_query(COUNTRY_BY_CODE["JPN"])

    assert '"Japan"' in query
    assert "JPY" in query
    assert "sourcelang:English" in query


def test_analyze_articles_returns_news_signal() -> None:
    signal = analyze_articles(
        COUNTRY_BY_CODE["TUR"],
        [
            {
                "title": "Turkey lira weakens as inflation pressure grows",
                "url": "https://example.com/turkey-lira",
                "domain": "example.com",
                "language": "English",
                "sourcecountry": "US",
                "seendate": "20260604120000",
            },
            {
                "title": "Turkey markets steady after central bank statement",
                "url": "https://example.com/turkey-steady",
            },
        ],
        "Turkey query",
    )

    assert signal.article_count == 2
    assert signal.news_stress_score > 0
    assert signal.articles[0].stress_probability >= signal.articles[-1].stress_probability


def test_parse_rss_articles_extracts_clean_titles() -> None:
    articles = parse_rss_articles(
        """
        <rss>
          <channel>
            <item>
              <title>Argentina peso weakens as inflation pressure grows</title>
              <link>https://news.example/argentina</link>
              <source url="https://news.example">Example News</source>
              <pubDate>Thu, 04 Jun 2026 12:00:00 GMT</pubDate>
            </item>
          </channel>
        </rss>
        """
    )

    assert articles == [
        {
            "title": "Argentina peso weakens as inflation pressure grows",
            "url": "https://news.example/argentina",
            "domain": "Example News",
            "language": "English",
            "sourcecountry": None,
            "seendate": "2026-06-04T12:00:00+00:00",
        }
    ]
