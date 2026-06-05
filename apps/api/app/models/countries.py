from dataclasses import dataclass


@dataclass(frozen=True)
class Country:
    country_code: str
    country_name: str
    currency: str
    region: str
    latitude: float
    longitude: float
    world_bank_code: str | None = None

    @property
    def macro_code(self) -> str:
        return self.world_bank_code or self.country_code


COUNTRIES: tuple[Country, ...] = (
    Country("USA", "United States", "USD", "North America", 38.9, -77.0),
    Country("CAN", "Canada", "CAD", "North America", 45.4, -75.7),
    Country("MEX", "Mexico", "MXN", "North America", 19.4, -99.1),
    Country("GBR", "United Kingdom", "GBP", "Europe", 51.5, -0.1),
    Country("EUR", "Eurozone", "EUR", "Europe", 50.9, 4.4, "EMU"),
    Country("JPN", "Japan", "JPY", "Asia", 35.7, 139.7),
    Country("CHE", "Switzerland", "CHF", "Europe", 46.9, 7.4),
    Country("AUS", "Australia", "AUD", "Oceania", -35.3, 149.1),
    Country("TUR", "Turkey", "TRY", "Europe/Asia", 39.9, 32.9),
    Country("BRA", "Brazil", "BRL", "South America", -15.8, -47.9),
    Country("IND", "India", "INR", "Asia", 28.6, 77.2),
    Country("ZAF", "South Africa", "ZAR", "Africa", -25.7, 28.2),
    Country("THA", "Thailand", "THB", "Asia", 13.8, 100.5),
    Country("KOR", "South Korea", "KRW", "Asia", 37.6, 126.9),
    Country("IDN", "Indonesia", "IDR", "Asia", -6.2, 106.8),
    Country("CHN", "China", "CNY", "Asia", 39.9, 116.4),
    Country("POL", "Poland", "PLN", "Europe", 52.2, 21.0),
    Country("SWE", "Sweden", "SEK", "Europe", 59.3, 18.1),
    Country("NOR", "Norway", "NOK", "Europe", 59.9, 10.8),
    Country("ISL", "Iceland", "ISK", "Europe", 64.1, -21.9),
    Country("DNK", "Denmark", "DKK", "Europe", 55.7, 12.6),
    Country("NZL", "New Zealand", "NZD", "Oceania", -41.3, 174.8),
    Country("SGP", "Singapore", "SGD", "Asia", 1.35, 103.82),
    Country("HKG", "Hong Kong", "HKD", "Asia", 22.3, 114.2),
    Country("CZE", "Czechia", "CZK", "Europe", 50.1, 14.4),
    Country("HUN", "Hungary", "HUF", "Europe", 47.5, 19.0),
    Country("ISR", "Israel", "ILS", "Middle East", 31.8, 35.2),
    Country("MYS", "Malaysia", "MYR", "Asia", 3.1, 101.7),
    Country("PHL", "Philippines", "PHP", "Asia", 14.6, 121.0),
    Country("ROU", "Romania", "RON", "Europe", 44.4, 26.1),
)


COUNTRY_BY_CODE = {country.country_code: country for country in COUNTRIES}
COUNTRY_BY_CURRENCY = {country.currency: country for country in COUNTRIES}
SUPPORTED_CURRENCIES = tuple(
    country.currency
    for country in COUNTRIES
    if country.currency != "USD"
)
