#!/usr/bin/env python3
"""
Utility functions for the Fraud Detection System
"""

import datetime
from typing import Any, Dict, List, Union


def serialize_memgraph_data(data: Any) -> Any:
    """
    Convert Memgraph data to JSON-serializable format.
    
    Args:
        data: Data from Memgraph (can be dict, list, or primitive types)
    
    Returns:
        JSON-serializable data
    """
    if isinstance(data, dict):
        serializable_data = {}
        for key, value in data.items():
            # Skip internal Memgraph properties
            if key.startswith('_'):
                continue
            
            serializable_data[key] = serialize_memgraph_data(value)
        return serializable_data
    
    elif isinstance(data, list):
        return [serialize_memgraph_data(item) for item in data]
    
    elif isinstance(data, set):
        return list(data)
    
    elif hasattr(data, 'isoformat'):  # datetime objects
        return data.isoformat()
    
    elif not isinstance(data, (str, int, float, bool, type(None))):
        # Convert other non-serializable types to strings
        return str(data)
    
    else:
        return data


def serialize_memgraph_result(result: List[Dict]) -> List[Dict]:
    """
    Serialize a list of Memgraph query results.
    
    Args:
        result: List of dictionaries from Memgraph execute_and_fetch
    
    Returns:
        List of serializable dictionaries
    """
    if not result:
        return []
    
    # Handle case where result might be a single value instead of a list
    if not isinstance(result, list):
        result = [result]
    
    serialized = []
    for row in result:
        if isinstance(row, dict):
            # Handle case where row contains node data
            if len(row) == 1 and any(key.startswith('a') or key.startswith('c') or key.startswith('t') for key in row.keys()):
                # Extract the actual data from the node
                node_key = list(row.keys())[0]
                node_data = row[node_key]
                if hasattr(node_data, '__dict__'):
                    serialized.append(serialize_memgraph_data(node_data.__dict__))
                else:
                    serialized.append(serialize_memgraph_data(node_data))
            else:
                serialized.append(serialize_memgraph_data(row))
        else:
            serialized.append(serialize_memgraph_data(row))
    
    return serialized


def clean_memgraph_node(node_data: Any) -> Dict:
    """
    Clean a single Memgraph node for serialization.
    
    Args:
        node_data: Node data from Memgraph
    
    Returns:
        Cleaned dictionary
    """
    if hasattr(node_data, '__dict__'):
        return serialize_memgraph_data(node_data.__dict__)
    elif isinstance(node_data, dict):
        return serialize_memgraph_data(node_data)
    else:
        return serialize_memgraph_data(node_data)


def safe_extract_count(result: List, key: str = None, default: int = 0) -> int:
    """
    Safely extract a count value from a Memgraph query result.
    
    Args:
        result: Query result from Memgraph
        key: Key to extract from the result (if None, assumes result is a direct count)
        default: Default value if extraction fails
    
    Returns:
        Extracted count value
    """
    try:
        if not result or len(result) == 0:
            return default
        
        first_result = result[0]
        
        if key is None:
            # Assume result is a direct count
            if isinstance(first_result, (int, float)):
                return int(first_result)
            elif isinstance(first_result, dict):
                # Try to find any numeric value
                for value in first_result.values():
                    if isinstance(value, (int, float)):
                        return int(value)
            return default
        else:
            # Extract from specific key
            if isinstance(first_result, dict) and key in first_result:
                value = first_result[key]
                if isinstance(value, (int, float)):
                    return int(value)
            
            return default
            
    except Exception:
        return default


def safe_extract_value(result: List, key: str, default: Any = None) -> Any:
    """
    Safely extract a value from a Memgraph query result.
    
    Args:
        result: Query result from Memgraph
        key: Key to extract from the result
        default: Default value if extraction fails
    
    Returns:
        Extracted value
    """
    try:
        if not result or len(result) == 0:
            return default
        
        first_result = result[0]
        
        if isinstance(first_result, dict) and key in first_result:
            return first_result[key]
        
        return default
        
    except Exception:
        return default
