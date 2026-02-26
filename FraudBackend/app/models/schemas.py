"""Pydantic schemas for API requests and responses."""

from typing import Any, Dict, List, Optional, Union
from datetime import datetime, date
from pydantic import BaseModel, Field, validator
from enum import Enum


class RiskLabel(str, Enum):
    """Risk level enumeration."""
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
    UNKNOWN = "Unknown"


class TransactionStatus(str, Enum):
    """Transaction status enumeration."""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    FLAGGED = "flagged"


class CustomerStatus(str, Enum):
    """Customer status enumeration."""
    ACTIVE = "active"
    SUSPENDED = "suspended"
    CLOSED = "closed"


class AccountStatus(str, Enum):
    """Account status enumeration."""
    ACTIVE = "active"
    FROZEN = "frozen"
    CLOSED = "closed"


class AlertStatus(str, Enum):
    """Alert status enumeration."""
    NEW = "new"
    ACKNOWLEDGED = "acknowledged"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"


class AlertSeverity(str, Enum):
    """Alert severity enumeration."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class AlertType(str, Enum):
    """Alert type enumeration."""
    SUSPICIOUS_TRANSACTION = "suspicious_transaction"
    UNUSUAL_PATTERN = "unusual_pattern"
    HIGH_RISK_CUSTOMER = "high_risk_customer"
    ACCOUNT_ANOMALY = "account_anomaly"


def convert_neo4j_date(value):
    """Convert Neo4j date/datetime objects to Python datetime."""
    if value is None:
        return None
    
    # Handle Neo4j Date objects
    if hasattr(value, 'year') and hasattr(value, 'month') and hasattr(value, 'day'):
        if hasattr(value, 'hour'):  # LocalDateTime or ZonedDateTime
            # Handle microsecond safely - some Neo4j DateTime objects don't have microsecond
            microsecond = getattr(value, 'microsecond', 0)
            return datetime(value.year, value.month, value.day, value.hour, value.minute, value.second, microsecond)
        else:  # Date
            return datetime(value.year, value.month, value.day)
    
    # Handle string representations of Neo4j DateTime
    if isinstance(value, str):
        # Try to parse common Neo4j DateTime string formats
        try:
            # Handle formats like "ZonedDateTime('2025-09-17T18:51:12.862333+00:00[Etc/UTC]')"
            if 'ZonedDateTime(' in value:
                # Extract the ISO string from ZonedDateTime
                start = value.find("'") + 1
                end = value.rfind("'")
                iso_string = value[start:end]
                # Parse the ISO string, ignoring timezone info for now
                iso_string = iso_string.split('[')[0]  # Remove timezone part
                return datetime.fromisoformat(iso_string)
            elif 'LocalDateTime(' in value:
                # Extract the ISO string from LocalDateTime
                start = value.find("'") + 1
                end = value.rfind("'")
                iso_string = value[start:end]
                return datetime.fromisoformat(iso_string)
        except (ValueError, IndexError):
            pass
    
    return value


# Base schemas
class BaseResponse(BaseModel):
    """Base response schema."""
    success: bool = True
    message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class PaginationParams(BaseModel):
    """Pagination parameters."""
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    sort_by: Optional[str] = None
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")


class SearchParams(PaginationParams):
    """Search parameters with filters."""
    search: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    risk_level: Optional[RiskLabel] = None


# Transaction schemas
class TransactionBase(BaseModel):
    """Base transaction schema."""
    transaction_id: str
    processing_date: Optional[datetime] = None
    value_date: Optional[datetime] = None
    transaction_time: Optional[str] = None
    credit_account: Optional[str] = None
    debit_account: Optional[str] = None
    credit_amount: Optional[float] = None
    debit_amount: Optional[float] = None
    transaction_type: Optional[str] = None
    payment_details: Optional[str] = None
    local_charge_amt: Optional[float] = None
    risk_score: Optional[float] = None
    risk_label: Optional[RiskLabel] = None
    alert_id: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None
    status: Optional[TransactionStatus] = None
    
    @validator('processing_date', 'value_date', pre=True)
    def convert_processing_date(cls, v):
        return convert_neo4j_date(v)
    
    @validator('transaction_time', pre=True)
    def convert_transaction_time(cls, v):
        if v is None:
            return None
        # Convert Neo4j DateTime to string
        if hasattr(v, 'year') and hasattr(v, 'month') and hasattr(v, 'day'):
            if hasattr(v, 'hour'):  # DateTime
                return f"{v.year}-{v.month:02d}-{v.day:02d} {v.hour:02d}:{v.minute:02d}:{v.second:02d}"
        return str(v) if v is not None else None


class Transaction(TransactionBase):
    """Transaction schema."""
    pass


class TransactionCreate(TransactionBase):
    """Transaction creation schema."""
    pass


class TransactionUpdate(BaseModel):
    """Transaction update schema."""
    status: Optional[TransactionStatus] = None
    risk_score: Optional[float] = Field(None, ge=0, le=1)
    risk_label: Optional[RiskLabel] = None
    alert_id: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None


class TransactionResponse(BaseResponse):
    """Transaction response schema."""
    data: Transaction


class TransactionListResponse(BaseResponse):
    """Transaction list response schema."""
    data: List[Transaction]
    pagination: Dict[str, Any]


# Customer schemas
class CustomerBase(BaseModel):
    """Base customer schema."""
    customer_id: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    residence: Optional[str] = None
    risk_class: Optional[str] = None
    status: Optional[str] = None
    customer_since: Optional[datetime] = None
    kyc_complete: Optional[str] = None
    aml_result: Optional[str] = None
    account_officer: Optional[str] = None
    dob: Optional[datetime] = None
    gender: Optional[str] = None
    industry: Optional[str] = None
    language: Optional[str] = None
    last_updated_date: Optional[datetime] = None
    marital_status: Optional[str] = None
    nationality: Optional[str] = None
    next_of_kin_name: Optional[str] = None
    segment: Optional[str] = None
    spouse_name: Optional[str] = None
    target: Optional[str] = None
    title: Optional[str] = None
    
    @validator('customer_since', 'dob', 'last_updated_date', pre=True)
    def convert_customer_dates(cls, v):
        return convert_neo4j_date(v)


class Customer(CustomerBase):
    """Customer schema."""
    accounts: Optional[List['Account']] = None


class CustomerCreate(CustomerBase):
    """Customer creation schema."""
    pass


class CustomerUpdate(BaseModel):
    """Customer update schema."""
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    residence: Optional[str] = None
    risk_class: Optional[str] = None
    status: Optional[str] = None
    kyc_complete: Optional[str] = None
    aml_result: Optional[str] = None
    account_officer: Optional[str] = None
    dob: Optional[datetime] = None
    gender: Optional[str] = None
    industry: Optional[str] = None
    language: Optional[str] = None
    marital_status: Optional[str] = None
    nationality: Optional[str] = None
    next_of_kin_name: Optional[str] = None
    segment: Optional[str] = None
    spouse_name: Optional[str] = None
    target: Optional[str] = None
    title: Optional[str] = None


class CustomerResponse(BaseResponse):
    """Customer response schema."""
    data: Customer


class CustomerListResponse(BaseResponse):
    """Customer list response schema."""
    data: List[Customer]
    pagination: Dict[str, Any]


# Account schemas
class AccountBase(BaseModel):
    """Base account schema."""
    account_id: str
    account_officer: Optional[str] = None
    account_title_1: Optional[str] = None
    category: Optional[str] = None
    currency: Optional[str] = None
    customer_id: Optional[str] = None
    last_updated_date: Optional[datetime] = None
    limit_ref: Optional[str] = None
    opening_date: Optional[datetime] = None
    position_type: Optional[str] = None
    short_title: Optional[str] = None
    working_balance: Optional[float] = None
    
    @validator('opening_date', 'last_updated_date', pre=True)
    def convert_account_dates(cls, v):
        return convert_neo4j_date(v)


class Account(AccountBase):
    """Account schema."""
    customer: Optional[Customer] = None
    transactions: Optional[List[Transaction]] = None


class AccountCreate(AccountBase):
    """Account creation schema."""
    pass


class AccountUpdate(BaseModel):
    """Account update schema."""
    account_officer: Optional[str] = None
    account_title_1: Optional[str] = None
    category: Optional[str] = None
    currency: Optional[str] = None
    position_type: Optional[str] = None
    short_title: Optional[str] = None
    limit_ref: Optional[str] = None


class AccountResponse(BaseResponse):
    """Account response schema."""
    data: Account


class AccountListResponse(BaseResponse):
    """Account list response schema."""
    data: List[Account]
    pagination: Dict[str, Any]


# Alert schemas - Unified to match Memgraph database structure
class AlertBase(BaseModel):
    """Base alert schema matching Memgraph Alert node structure."""
    alert_id: str
    alert_type: str  # VELOCITY_ANOMALY, HIGH_AMOUNT, QUICK_MOVEMENT, etc.
    severity: str    # CRITICAL, HIGH, MEDIUM, LOW
    status: str      # OPEN, INVESTIGATING, RESOLVED, FALSE_POSITIVE
    description: str
    amount: Optional[float] = None
    customer_id: Optional[str] = None
    account_id: Optional[str] = None
    transaction_id: Optional[str] = None
    risk_score: int  # 0-100 scale to match Memgraph
    timestamp: datetime
    additional_data: Optional[Dict[str, Any]] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    
    @validator('timestamp', pre=True)
    def convert_timestamp(cls, v):
        return convert_neo4j_date(v)


class Alert(AlertBase):
    """Alert schema."""
    transaction: Optional[Transaction] = None
    customer: Optional[Customer] = None


class AlertCreate(AlertBase):
    """Alert creation schema."""
    pass


class AlertUpdate(BaseModel):
    """Alert update schema."""
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None


class AlertResponse(BaseResponse):
    """Alert response schema."""
    data: Alert


class AlertListResponse(BaseResponse):
    """Alert list response schema."""
    data: List[Alert]
    pagination: Dict[str, Any]


# Metrics schemas
class OverviewMetrics(BaseModel):
    """Overview metrics schema."""
    total_transactions: int
    flagged_transactions: int
    total_customers: int
    total_accounts: int
    transactions_last_24h: int
    high_risk_customers: int
    total_alerts: int
    unresolved_alerts: int
    total_amount: float
    flagged_amount: float
    fraud_rate: float = Field(ge=0, le=1)
    detection_rate: float = Field(ge=0, le=1)


class TimeSeriesPoint(BaseModel):
    """Time series data point."""
    timestamp: datetime
    value: Union[int, float]
    label: Optional[str] = None
    channel: Optional[str] = None
    total_amount: Optional[float] = None
    avg_amount: Optional[float] = None


class RiskDistribution(BaseModel):
    """Risk distribution data."""
    label: RiskLabel
    count: int
    percentage: float = Field(ge=0, le=100)


class MetricsResponse(BaseResponse):
    """Metrics response schema."""
    data: Union[OverviewMetrics, List[TimeSeriesPoint], List[RiskDistribution]]


# WebSocket schemas
class WebSocketMessage(BaseModel):
    """WebSocket message schema."""
    type: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class WebSocketAlert(BaseModel):
    """WebSocket alert message matching unified Memgraph Alert node schema."""
    alert_id: str
    alert_type: str
    severity: str
    status: str
    description: str
    amount: Optional[float] = None
    customer_id: Optional[str] = None
    account_id: Optional[str] = None
    transaction_id: Optional[str] = None
    risk_score: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    additional_data: Optional[Dict[str, Any]] = None


class WebSocketTransaction(BaseModel):
    """WebSocket transaction message."""
    tx_id: str
    amount: float
    currency: str
    risk_score: float
    risk_label: RiskLabel
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Action schemas
class TransactionAction(BaseModel):
    """Transaction action schema."""
    action: str = Field(pattern="^(investigate|mark_false_positive|escalate)$")
    notes: Optional[str] = None


class AlertAction(BaseModel):
    """Alert action schema."""
    action: str = Field(pattern="^(acknowledge|escalate|resolve|mark_false_positive)$")
    notes: Optional[str] = None
    assigned_to: Optional[str] = None


class AccountAction(BaseModel):
    """Account action schema."""
    action: str = Field(pattern="^(freeze|unfreeze|close)$")
    reason: str
    duration: Optional[int] = None  # hours for freeze
