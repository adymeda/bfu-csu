from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
	model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

	service_token: str = "change-me"
	host: str = "0.0.0.0"
	port: int = 3911
	model_path: str = "model.joblib"
	toxicity_threshold: float = 0.5

settings = Settings()