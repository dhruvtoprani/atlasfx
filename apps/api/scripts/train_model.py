from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.ml.risk_classifier import model_info


async def run() -> None:
    info = await model_info()
    output_path = Path(__file__).resolve().parents[3] / "data" / "processed" / "risk_classifier.json"
    output_path.write_text(json.dumps(info.model_dump(), indent=2), encoding="utf-8")
    print(f"Wrote classifier report to {output_path}")


def main() -> None:
    asyncio.run(run())


if __name__ == "__main__":
    main()
