"""BlogNexa AI - Backend Core Configuration."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "BlogNexa AI Cloud Backend"
    API_V1_STR: str = "/v1"
    MAX_TIMESTAMP_SKEW_SECONDS: int = 300
    REPLAY_CACHE_TTL_SECONDS: int = 300
    REDIS_URL: str = "redis://localhost:6379/0"
    FAIL_CLOSED_REPLAY: bool = False
    CRAWLER_MAX_RESPONSE_SIZE: int = 10 * 1024 * 1024  # 10 MB
    CRAWLER_TIMEOUT_SECONDS: int = 15

    model_config = SettingsConfigDict(
        env_prefix="BNX_",
        case_sensitive=True
    )


settings = Settings()
