
import asyncio
from typing import TypedDict, List, Dict
from langgraph.graph import StateGraph, END
from app.services.integrations import prospect_pipeline, llm_service

# STATE DEFINITION
class ScoutState(TypedDict):
    mission_id: str
    objective: str
    status: str
    search_queries: List[str]
    visited_urls: List[str]
    prospect_candidates: List[Dict] 
    iteration: int
    errors: List[str]

# NODE: PLANNER
async def planner_node(state: ScoutState) -> Dict:
    """Generate search strategy"""
    print("--- 🧠 PLANNER ---")
    
    prompt = f"""Analyze this objective and extract key search parameters: {state["objective"]}

Extract:
1. Job titles to search for (e.g., ["CTO", "CEO"])
2. Industries to target (e.g., ["fintech", "saas"])

Return JSON: {{"titles": ["title1", "title2"], "industries": ["industry1"]}}"""
    
    data = await llm_service.generate_json(prompt)
    
    return {
        "search_queries": data.get("titles", []),
        "status": "searching"
    }

# NODE: RESEARCHER
async def research_node(state: ScoutState) -> Dict:
    """Execute prospect research pipeline"""
    print("--- 🕵️ RESEARCHER ---")
    
    # Extract titles and industries from objective
    obj_lower = state["objective"].lower()
    
    titles = []
    if "cto" in obj_lower:
        titles = ["CTO", "Chief Technology Officer"]
    elif "ceo" in obj_lower:
        titles = ["CEO", "Chief Executive Officer"]
    elif "cfo" in obj_lower:
        titles = ["CFO", "Chief Financial Officer"]
    
    industries = []
    if "fintech" in obj_lower:
        industries = ["fintech"]
    elif "saas" in obj_lower:
        industries = ["saas"]
    
    # Run complete pipeline: Apollo → Hunter → Analysis
    prospects = await prospect_pipeline.find_prospects(
        objective=state["objective"],
        titles=titles,
        industries=industries,
        max_results=10
    )
    
    print(f"Pipeline returned {len(prospects)} verified prospects")
    
    return {
        "prospect_candidates": prospects,
        "status": "completed"
    }

# BUILD GRAPH
workflow = StateGraph(ScoutState)
workflow.add_node("planner", planner_node)
workflow.add_node("researcher", research_node)

workflow.set_entry_point("planner")
workflow.add_edge("planner", "researcher")
workflow.add_edge("researcher", END)

scout_app = workflow.compile()
