from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AtlasFX API"
    frankfurter_base_url: str = "https://api.frankfurter.dev/v1"
    world_bank_base_url: str = "https://api.worldbank.org/v2"
    gdelt_base_url: str = "https://api.gdeltproject.org/api/v2"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
