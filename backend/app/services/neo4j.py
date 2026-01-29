import logging
from typing import List, Dict, Optional, Any
from neo4j import GraphDatabase
from app.core.config import settings

logger = logging.getLogger(__name__)

class Neo4jService:
    def __init__(self):
        self._driver = None
        self._database = settings.NEO4J_DATABASE
        
    def connect(self):
        """Establish connection to Neo4j database"""
        if self._driver:
            return

        if not settings.NEO4J_URI or not settings.NEO4J_USERNAME or not settings.NEO4J_PASSWORD:
            logger.warning("Neo4j credentials not found. Contact Graph features will be disabled.")
            return

        try:
            self._driver = GraphDatabase.driver(
                settings.NEO4J_URI, 
                auth=(settings.NEO4J_USERNAME, settings.NEO4J_PASSWORD)
            )
            self._driver.verify_connectivity()
            logger.info("Connected to Neo4j Contact Graph")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")
            self._driver = None

    def close(self):
        """Close the Neo4j driver connection"""
        if self._driver:
            self._driver.close()
            self._driver = None
            logger.info("Closed Neo4j connection")

    def execute_query(self, query: str, params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Execute a Cypher query and return results as a list of dictionaries"""
        if not self._driver:
            self.connect()
            if not self._driver:
                return []

        if params is None:
            params = {}

        try:
            records, _, _ = self._driver.execute_query(
                query, 
                parameters_=params, 
                database_=self._database
            )
            return [record.data() for record in records]
        except Exception as e:
            logger.error(f"Neo4j Query Error: {e}")
            return []

    def resolve_person(self, name: str) -> Dict[str, Any]:
        """
        Find or create a Person node by name.
        Behaves deterministically: if exists, return it; if not, create it.
        """
        query = """
        MERGE (p:Person {name: $name})
        RETURN p
        """
        results = self.execute_query(query, {"name": name})
        if results:
            return results[0].get("p", {})
        return {}

    def add_contact_method(self, person_name: str, channel: str, identifier: str) -> bool:
        """
        Add a contact method to a person.
        Example: (Person {name: "Sriram"})-[:HAS_EMAIL]->(Email {email: "sriram@gmail.com"})
        
        Channels: email, linkedin, github, twitter, phone, etc.
        """
        # Normalize channel to uppercase for relationship type convention (e.g., HAS_EMAIL)
        # But user asked for specific node labels like 'Email', 'LinkedIn'. 
        # Let's follow the pattern: (Person)-[:HAS_<CHANNEL>]->(ChannelNode)
        
        channel_upper = channel.upper()
        rel_type = f"HAS_{channel_upper}"
        
        # Determine node label and property based on channel
        # e.g., channel="email" -> Label="Email", prop="email" or just "id"
        # The prompt used: (Sriram)-[:HAS_EMAIL]->(sriram@gmail.com) 
        # But (sriram@gmail.com) implies a node. 
        # Let's standardize node labels: Email, LinkedIn, etc. 
        # And the property should probably be `value` or `id` to be generic, or `email`/`url`.
        # Prompt said: extract Identifier: sriram@gmail.com
        
        node_label = channel.capitalize() # Email, Linkedin
        if node_label == "Linkedin": node_label = "LinkedIn" # Fix casing
        
        # We need a generic way to creating the node. 
        # Query: Match Person, Merge ChannelNode, Merge Relationship
        
        query = f"""
        MERGE (p:Person {{name: $name}})
        MERGE (c:{node_label} {{id: $identifier}})
        MERGE (p)-[:{rel_type}]->(c)
        RETURN p, c
        """
        
        results = self.execute_query(query, {"name": person_name, "identifier": identifier})
        return len(results) > 0

    def get_contact_methods(self, person_name: str) -> Dict[str, str]:
        """
        Retrieve all known contact methods for a person.
        Returns a dictionary: { "email": "sriram@example.com", "linkedin": "..." }
        """
        # Dynamic query to fetch all outgoing relationships that look like contact methods
        query = """
        MATCH (p:Person {name: $name})-[r]->(c)
        WHERE type(r) STARTS WITH 'HAS_'
        RETURN type(r) as type, c.id as value
        """
        
        results = self.execute_query(query, {"name": person_name})
        
        contacts = {}
        for row in results:
            rel_type = row.get("type", "")
            value = row.get("value")
            
            # Parse channel name from rel_type (HAS_EMAIL -> email)
            if rel_type.startswith("HAS_"):
                channel = rel_type[4:].lower()
                contacts[channel] = value
                
        return contacts

neo4j_service = Neo4jService()
