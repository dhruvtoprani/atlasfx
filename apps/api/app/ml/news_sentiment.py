from __future__ import annotations

from functools import lru_cache
from re import findall

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score
from sklearn.pipeline import Pipeline

from app.schemas.ml import NlpEvaluationReport
from app.services.scoring import clamp


TRAINING_EXAMPLES = [
    ("currency crisis deepens as inflation surges and reserves fall", 1),
    ("central bank emergency meeting after sharp devaluation", 1),
    ("debt default fears trigger market selloff", 1),
    ("protests erupt over food prices and currency collapse", 1),
    ("capital controls imposed after exchange rate plunge", 1),
    ("bond yields spike as recession risk rises", 1),
    ("investors flee local currency after downgrade", 1),
    ("government seeks imf bailout amid balance of payments pressure", 1),
    ("inflation shock hits households as currency weakens", 1),
    ("foreign reserves drop to multi year low", 1),
    ("banking stress grows after political turmoil", 1),
    ("sovereign spreads widen on debt restructuring concerns", 1),
    ("central bank raises rates to defend currency", 1),
    ("exchange rate volatility jumps after election uncertainty", 1),
    ("shortage of dollars pressures importers", 1),
    ("markets calm as inflation cools", 0),
    ("currency steadies after central bank statement", 0),
    ("economic growth improves with stable prices", 0),
    ("trade surplus supports local currency", 0),
    ("foreign reserves increase for third month", 0),
    ("bond market rallies as risk premium narrows", 0),
    ("central bank keeps rates unchanged as outlook stabilizes", 0),
    ("tourism revenue boosts current account", 0),
    ("exports grow while inflation expectations ease", 0),
    ("government announces orderly budget plan", 0),
    ("investor confidence improves after reform package", 0),
    ("currency gains as dollar demand eases", 0),
    ("stable exchange rate helps import costs", 0),
    ("markets open higher after peaceful election", 0),
    ("reserves remain adequate according to central bank", 0),
]

HOLDOUT_EXAMPLES = [
    ("peso falls sharply as central bank reserves hit a new low", 1),
    ("emergency rate hike follows currency selloff and inflation spike", 1),
    ("imf talks intensify after debt pressure and dollar shortage", 1),
    ("local currency volatility jumps on election turmoil", 1),
    ("sovereign downgrade raises default fears", 1),
    ("exchange rate steadies as reserves recover", 0),
    ("inflation eases while exports support the currency", 0),
    ("central bank says reserves remain adequate", 0),
    ("market confidence improves after fiscal reform plan", 0),
    ("trade surplus helps currency gain against dollar", 0),
]

STRESS_TERMS = {
    "currency": {
        "devaluation",
        "depreciation",
        "plunge",
        "collapse",
        "weakens",
        "weakened",
        "selloff",
        "volatility",
        "dollar shortage",
        "capital controls",
    },
    "macro": {
        "inflation",
        "recession",
        "unemployment",
        "current account",
        "deficit",
        "reserves",
        "balance of payments",
        "food prices",
    },
    "debt": {
        "default",
        "debt",
        "downgrade",
        "restructuring",
        "bailout",
        "imf",
        "sovereign spreads",
        "bond yields",
    },
    "instability": {
        "protest",
        "protests",
        "turmoil",
        "unrest",
        "election uncertainty",
        "emergency",
        "crisis",
        "shock",
    },
}

POSITIVE_TERMS = {
    "steadies",
    "stabilizes",
    "stable",
    "rallies",
    "gains",
    "improves",
    "surplus",
    "adequate",
    "eases",
    "cools",
    "confidence",
}

NEGATIVE_TERMS = set().union(*STRESS_TERMS.values())


class AtlasNewsSentimentModel:
    def __init__(self) -> None:
        self.pipeline = Pipeline(
            steps=[
                ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1, lowercase=True)),
                ("classifier", LogisticRegression(max_iter=1000, random_state=42)),
            ]
        )
        texts, labels = zip(*TRAINING_EXAMPLES, strict=True)
        self.pipeline.fit(list(texts), list(labels))

    def predict(self, text: str) -> dict[str, float | list[str]]:
        normalized = text.lower()
        stress_probability = float(self.pipeline.predict_proba([text])[0][1])
        theme_hits = theme_matches(normalized)
        lexicon_score = lexicon_stress_score(normalized, theme_hits)
        blended_stress = clamp((stress_probability * 70) + (lexicon_score * 30)) / 100
        sentiment_score = round((1 - blended_stress) * 2 - 1, 3)

        return {
            "sentiment_score": sentiment_score,
            "stress_probability": round(blended_stress, 3),
            "theme_hits": theme_hits,
        }


def theme_matches(text: str) -> list[str]:
    matches: list[str] = []
    for theme, terms in STRESS_TERMS.items():
        if any(term in text for term in terms):
            matches.append(theme)
    return matches


def lexicon_stress_score(text: str, theme_hits: list[str]) -> float:
    words = set(findall(r"[a-z][a-z-]+", text.lower()))
    negative_hits = len(words.intersection(NEGATIVE_TERMS))
    positive_hits = len(words.intersection(POSITIVE_TERMS))
    phrase_hits = sum(1 for terms in STRESS_TERMS.values() for term in terms if " " in term and term in text)
    raw = negative_hits + phrase_hits + (len(theme_hits) * 1.5) - (positive_hits * 0.75)
    return float(np.clip(raw / 8, 0, 1))


def evaluate_news_model() -> NlpEvaluationReport:
    model = get_news_sentiment_model()
    texts, labels = zip(*HOLDOUT_EXAMPLES, strict=True)
    probabilities = [float(model.predict(text)["stress_probability"]) for text in texts]
    predictions = [1 if probability >= 0.5 else 0 for probability in probabilities]

    return NlpEvaluationReport(
        model_type="TF-IDF + logistic regression headline stress classifier",
        holdout_examples=len(HOLDOUT_EXAMPLES),
        accuracy=round(float(accuracy_score(labels, predictions)), 3),
        stress_precision=round(float(precision_score(labels, predictions, pos_label=1, zero_division=0)), 3),
        stress_recall=round(float(recall_score(labels, predictions, pos_label=1, zero_division=0)), 3),
        stable_precision=round(float(precision_score(labels, predictions, pos_label=0, zero_division=0)), 3),
        stable_recall=round(float(recall_score(labels, predictions, pos_label=0, zero_division=0)), 3),
    )


@lru_cache(maxsize=1)
def get_news_sentiment_model() -> AtlasNewsSentimentModel:
    return AtlasNewsSentimentModel()
