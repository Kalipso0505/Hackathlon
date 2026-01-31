from fastapi import APIRouter
from scenarios.office_murder import OFFICE_MURDER_SCENARIO

router = APIRouter()

@router.get("/personas")
async def get_personas_debug():
    """Get all personas with their full knowledge for debugging"""
    personas = []
    
    for p in OFFICE_MURDER_SCENARIO["personas"]:
        personas.append({
            "slug": p["slug"],
            "name": p["name"],
            "role": p["role"],
            "personality": p["personality"],
            "private_knowledge": p["private_knowledge"],
            "shared_knowledge": OFFICE_MURDER_SCENARIO["shared_knowledge"],
            "knows_about_others": p["knows_about_others"],
        })
    
    return {"personas": personas}
