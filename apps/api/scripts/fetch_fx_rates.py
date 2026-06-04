from __future__ import annotations

import asyncio
import json

from app.services.fx import historical_rates


async def main() -> None:
    data = await historical_rates()
    print(json.dumps(data, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
