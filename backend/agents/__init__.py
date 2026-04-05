"""
LangGraph multi-agent negotiation system.

The heavy graph imports stay lazy so demo mode can run without the full AI stack
installed in the local Python environment.
"""

from .state import GraphState

__all__ = ["GraphState"]
