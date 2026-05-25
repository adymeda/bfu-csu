from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str
    bot_token: str
    service_token: str = "change-me"
    host: str = "0.0.0.0"
    port: int = 3910
    code_length: int = 8
    code_ttl_minutes: int = 15

settings = Settings()