"""Application configuration using Pydantic settings."""

from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application settings
    app_env: str = Field(default="development", env="APP_ENV")
    app_host: str = Field(default="0.0.0.0", env="APP_HOST")
    app_port: int = Field(default=8000, env="APP_PORT")
    app_debug: bool = Field(default=True, env="APP_DEBUG")
    
    # Database settings
    memgraph_uri: str = Field(default="bolt://10.24.38.54:7687", env="MEMGRAPH_URI")
    memgraph_user: str = Field(default="mg_user", env="MEMGRAPH_USER")
    memgraph_password: str = Field(default="mg_password", env="MEMGRAPH_PASSWORD")
    memgraph_database: str = Field(default="memgraph", env="MEMGRAPH_DATABASE")
    
    # Authentication (JWT)
    jwt_secret: str = Field(default="your-super-secret-jwt-key", env="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    
    # Redis settings
    redis_url: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    use_redis_cache: bool = Field(default=False, env="USE_REDIS_CACHE")
    redis_cache_ttl: int = Field(default=300, env="REDIS_CACHE_TTL")
    
    # WebSocket settings
    ws_heartbeat_interval: int = Field(default=30, env="WS_HEARTBEAT_INTERVAL")
    ws_max_connections: int = Field(default=1000, env="WS_MAX_CONNECTIONS")
    
    # Logging
    log_level: str = Field(default="info", env="LOG_LEVEL")
    log_format: str = Field(default="json", env="LOG_FORMAT")
    
    # CORS settings
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001","127.0.0.1:3000","127.0.0.1:3001"],
        env="CORS_ORIGINS"
    )
    
    # Rate limiting
    rate_limit_requests: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(default=60, env="RATE_LIMIT_WINDOW")
    
    # Background tasks
    enable_background_tasks: bool = Field(default=True, env="ENABLE_BACKGROUND_TASKS")
    kafka_bootstrap_servers: str = Field(default="localhost:9092", env="KAFKA_BOOTSTRAP_SERVERS")
    kafka_topic_transactions: str = Field(default="fraud-transactions", env="KAFKA_TOPIC_TRANSACTIONS")
    kafka_topic_alerts: str = Field(default="fraud-alerts", env="KAFKA_TOPIC_ALERTS")
    
    # Monitoring
    enable_metrics: bool = Field(default=True, env="ENABLE_METRICS")
    metrics_port: int = Field(default=9090, env="METRICS_PORT")
    
    # Development
    reload: bool = Field(default=True, env="RELOAD")
    workers: int = Field(default=1, env="WORKERS")

    # SMTP / Mail (Office 365)
    mail_server: str = Field(default="smtp.office365.com", env="MAIL_SERVER")
    mail_port: int = Field(default=587, env="MAIL_PORT")
    mail_use_tls: bool = Field(default=True, env="MAIL_USE_TLS")
    mail_username: str = Field(default="", env="MAIL_USERNAME")
    mail_password: str = Field(default="", env="MAIL_PASSWORD")
    mail_default_sender: str = Field(default="", env="MAIL_DEFAULT_SENDER")

    # JWT (8 hours default)
    jwt_access_token_expire_minutes: int = Field(default=480, env="JWT_ACCESS_TOKEN_EXPIRE_MINUTES")

    # LDAP / AD
    ad_server: str = Field(default="", env="AD_SERVER")
    ad_domain: str = Field(default="", env="AD_DOMAIN")
    ad_search_base: str = Field(default="", env="AD_SEARCH_BASE")
    ad_timeout: int = Field(default=30, env="AD_TIMEOUT")
    ad_port: int = Field(default=389, env="AD_PORT")
    ad_use_ssl: bool = Field(default=False, env="AD_USE_SSL")  # "1" or "true" to enable
    ad_user: str = Field(default="", env="AD_USER")
    ad_user_password: str = Field(default="", env="AD_USER_PASSWORD")
    ad_pool_size: int = Field(default=3, env="AD_POOL_SIZE")
    ad_pool_lifetime: int = Field(default=600, env="AD_POOL_LIFETIME")

    # Demo login when AD is not configured or unreachable (dev/local only)
    demo_login_enabled: bool = Field(default=False, env="DEMO_LOGIN_ENABLED")
    demo_username: str = Field(default="demo", env="DEMO_USERNAME")
    demo_password: str = Field(default="demo", env="DEMO_PASSWORD")

    # Access allowlist: only these usernames can log in (SQLite in app/data/access_allowlist.db)
    access_allowlist_enabled: bool = Field(default=True, env="ACCESS_ALLOWLIST_ENABLED")
    access_list_admin_secret: str = Field(default="", env="ACCESS_LIST_ADMIN_SECRET")

    # Compliance: serve from SQLite (app/data/compliance.db) for lower latency
    use_compliance_sqlite: bool = Field(default=True, env="USE_COMPLIANCE_SQLITE")

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()


# Global settings instance
settings = get_settings()
