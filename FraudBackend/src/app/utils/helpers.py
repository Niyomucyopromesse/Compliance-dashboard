"""Helper utilities for the fraud detection system."""

import uuid
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
import hashlib
import secrets


def generate_id(prefix: str = "") -> str:
    """Generate a unique ID with optional prefix."""
    unique_id = str(uuid.uuid4()).replace("-", "")
    return f"{prefix}-{unique_id}" if prefix else unique_id


def generate_tx_id() -> str:
    """Generate a transaction ID."""
    return generate_id("tx")


def generate_customer_id() -> str:
    """Generate a customer ID."""
    return generate_id("cust")


def generate_account_id() -> str:
    """Generate an account ID."""
    return generate_id("acc")


def generate_alert_id() -> str:
    """Generate an alert ID."""
    return generate_id("alert")


def hash_string(text: str) -> str:
    """Hash a string using SHA-256."""
    return hashlib.sha256(text.encode()).hexdigest()


def generate_api_key() -> str:
    """Generate a secure API key."""
    return secrets.token_urlsafe(32)


def mask_account_number(account_number: str, visible_chars: int = 4) -> str:
    """Mask account number showing only first and last few characters."""
    if len(account_number) <= visible_chars * 2:
        return "*" * len(account_number)
    
    start = account_number[:visible_chars]
    end = account_number[-visible_chars:]
    middle = "*" * (len(account_number) - visible_chars * 2)
    
    return f"{start}{middle}{end}"


def mask_email(email: str) -> str:
    """Mask email address showing only first character and domain."""
    if "@" not in email:
        return email
    
    local, domain = email.split("@", 1)
    if len(local) <= 2:
        masked_local = "*" * len(local)
    else:
        masked_local = local[0] + "*" * (len(local) - 2) + local[-1]
    
    return f"{masked_local}@{domain}"


def calculate_risk_score(
    amount: float,
    frequency: int,
    time_of_day: int,
    location_anomaly: bool = False,
    device_anomaly: bool = False,
    amount_anomaly: bool = False
) -> float:
    """Calculate risk score based on various factors."""
    base_score = 0.0
    
    # Amount factor (0-0.4)
    if amount > 10000:
        base_score += 0.4
    elif amount > 5000:
        base_score += 0.3
    elif amount > 1000:
        base_score += 0.2
    elif amount > 100:
        base_score += 0.1
    
    # Frequency factor (0-0.2)
    if frequency > 50:
        base_score += 0.2
    elif frequency > 20:
        base_score += 0.15
    elif frequency > 10:
        base_score += 0.1
    elif frequency > 5:
        base_score += 0.05
    
    # Time of day factor (0-0.1)
    if time_of_day < 6 or time_of_day > 22:  # Night time
        base_score += 0.1
    
    # Anomaly factors (0-0.3)
    if location_anomaly:
        base_score += 0.1
    if device_anomaly:
        base_score += 0.1
    if amount_anomaly:
        base_score += 0.1
    
    return min(base_score, 1.0)


def get_risk_label(risk_score: float) -> str:
    """Get risk label based on risk score."""
    if risk_score >= 0.8:
        return "Critical"
    elif risk_score >= 0.6:
        return "High"
    elif risk_score >= 0.4:
        return "Medium"
    elif risk_score >= 0.2:
        return "Low"
    else:
        return "Unknown"


def format_currency(amount: float, currency: str = "USD") -> str:
    """Format currency amount."""
    currency_symbols = {
        "USD": "$",
        "EUR": "€",
        "GBP": "£",
        "JPY": "¥"
    }
    
    symbol = currency_symbols.get(currency, currency)
    return f"{symbol}{amount:,.2f}"


def parse_datetime(date_string: str) -> Optional[datetime]:
    """Parse datetime string with multiple format support."""
    if not date_string:
        return None
    
    formats = [
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d"
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_string, fmt)
        except ValueError:
            continue
    
    return None


def get_time_buckets(start_time: datetime, end_time: datetime, bucket_size: str = "hour") -> List[datetime]:
    """Get time buckets for aggregation."""
    buckets = []
    current = start_time
    
    if bucket_size == "hour":
        delta = timedelta(hours=1)
    elif bucket_size == "day":
        delta = timedelta(days=1)
    elif bucket_size == "week":
        delta = timedelta(weeks=1)
    else:
        delta = timedelta(hours=1)
    
    while current <= end_time:
        buckets.append(current)
        current += delta
    
    return buckets


def aggregate_by_time_bucket(
    data: List[Dict[str, Any]], 
    time_field: str = "timestamp",
    value_field: str = "value",
    bucket_size: str = "hour"
) -> List[Dict[str, Any]]:
    """Aggregate data by time buckets."""
    if not data:
        return []
    
    # Group by time bucket
    buckets = {}
    for item in data:
        timestamp = parse_datetime(item.get(time_field))
        if not timestamp:
            continue
        
        # Round to bucket size
        if bucket_size == "hour":
            bucket_time = timestamp.replace(minute=0, second=0, microsecond=0)
        elif bucket_size == "day":
            bucket_time = timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
        else:
            bucket_time = timestamp.replace(minute=0, second=0, microsecond=0)
        
        if bucket_time not in buckets:
            buckets[bucket_time] = []
        
        buckets[bucket_time].append(item)
    
    # Aggregate each bucket
    result = []
    for bucket_time, items in sorted(buckets.items()):
        total_value = sum(item.get(value_field, 0) for item in items)
        result.append({
            "timestamp": bucket_time.isoformat(),
            "value": total_value,
            "count": len(items)
        })
    
    return result


def validate_risk_score(risk_score: float) -> bool:
    """Validate risk score is between 0 and 1."""
    return 0.0 <= risk_score <= 1.0


def validate_amount(amount: float) -> bool:
    """Validate amount is positive."""
    return amount > 0


def validate_email(email: str) -> bool:
    """Basic email validation."""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def sanitize_string(text: str, max_length: int = 255) -> str:
    """Sanitize string input."""
    if not text:
        return ""
    
    # Remove control characters and limit length
    sanitized = "".join(char for char in text if ord(char) >= 32)
    return sanitized[:max_length].strip()


def deep_merge_dicts(dict1: Dict[str, Any], dict2: Dict[str, Any]) -> Dict[str, Any]:
    """Deep merge two dictionaries."""
    result = dict1.copy()
    
    for key, value in dict2.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge_dicts(result[key], value)
        else:
            result[key] = value
    
    return result
