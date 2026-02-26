"""Database models representing graph nodes and relationships."""

from typing import Any, Dict, List, Optional
from datetime import datetime
from dataclasses import dataclass
from enum import Enum


class NodeType(str, Enum):
    """Graph node types."""
    CUSTOMER = "Customer"
    ACCOUNT = "Account"
    TRANSACTION = "Transaction"
    ALERT = "Alert"


@dataclass
class CustomerNode:
    """Customer node in the graph."""
    customer_id: str
    name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    risk_score: float = 0.0
    risk_label: str = "Unknown"
    status: str = "active"
    created_at: datetime = None
    updated_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.updated_at is None:
            self.updated_at = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for database operations."""
        return {
            "customer_id": self.customer_id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            "risk_score": self.risk_score,
            "risk_label": self.risk_label,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


@dataclass
class AccountNode:
    """Account node in the graph."""
    account_id: str
    customer_id: str
    account_number: str
    account_type: str
    balance: float = 0.0
    currency: str = "USD"
    risk_score: float = 0.0
    risk_label: str = "Unknown"
    status: str = "active"
    created_at: datetime = None
    last_transaction: Optional[datetime] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for database operations."""
        return {
            "account_id": self.account_id,
            "customer_id": self.customer_id,
            "account_number": self.account_number,
            "account_type": self.account_type,
            "balance": self.balance,
            "currency": self.currency,
            "risk_score": self.risk_score,
            "risk_label": self.risk_label,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_transaction": self.last_transaction.isoformat() if self.last_transaction else None
        }


@dataclass
class TransactionNode:
    """Transaction node in the graph."""
    tx_id: str
    from_account: str
    to_account: str
    amount: float
    currency: str = "USD"
    type: str = "transfer"
    risk_score: float = 0.0
    risk_label: str = "Unknown"
    status: str = "pending"
    alert_id: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for database operations."""
        return {
            "tx_id": self.tx_id,
            "from_account": self.from_account,
            "to_account": self.to_account,
            "amount": self.amount,
            "currency": self.currency,
            "type": self.type,
            "risk_score": self.risk_score,
            "risk_label": self.risk_label,
            "status": self.status,
            "alert_id": self.alert_id,
            "meta": self.meta,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }


@dataclass
class AlertNode:
    """Alert node in the graph."""
    alert_id: str
    alert_type: str
    severity: str
    status: str = "new"
    description: str = ""
    risk_score: float = 0.0
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = None
    updated_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.updated_at is None:
            self.updated_at = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for database operations."""
        return {
            "alert_id": self.alert_id,
            "alert_type": self.alert_type,
            "severity": self.severity,
            "status": self.status,
            "description": self.description,
            "risk_score": self.risk_score,
            "assigned_to": self.assigned_to,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


# Relationship types
class RelationshipType(str, Enum):
    """Graph relationship types."""
    OWNS = "OWNS"
    TRANSFERS_TO = "TRANSFERS_TO"
    ALERTS = "ALERTS"
    INVOLVES = "INVOLVES"


@dataclass
class Relationship:
    """Graph relationship."""
    from_node: str
    to_node: str
    relationship_type: RelationshipType
    properties: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for database operations."""
        return {
            "from_node": self.from_node,
            "to_node": self.to_node,
            "relationship_type": self.relationship_type,
            "properties": self.properties or {}
        }
