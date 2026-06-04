from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.services.news import all_country_news_signals


async def run() -> None:
    signals = await all_country_news_signals()
    output_path = Path(__file__).resolve().parents[3] / "data" / "processed" / "news_signals.json"
    output_path.write_text(
        json.dumps([signal.model_dump() for signal in signals.values()], indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {len(signals)} country news signals to {output_path}")


def main() -> None:
    asyncio.run(run())


if __name__ == "__main__":
    main()
