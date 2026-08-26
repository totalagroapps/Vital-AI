import os

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

imports = '''from schemas_medical import MedicalSearchRequest, MedicalSearchResponse
from services.medical_search_service import MedicalSearchService
from services.pubmed_service import PubMedService
from services.clinical_trials_service import ClinicalTrialsService
from services.cochrane_service import CochraneService

def get_medical_search_service() -> MedicalSearchService:
    return MedicalSearchService(
        pubmed_service=PubMedService(),
        clinical_trials_service=ClinicalTrialsService(),
        cochrane_service=CochraneService(),
    )
'''

# Add imports
if 'MedicalSearchService' not in content:
    content = content.replace("import os", "import os\n" + imports)

# Add endpoint
endpoint = '''
@app.post("/api/medical/search", response_model=MedicalSearchResponse)
async def medical_search(
    request: MedicalSearchRequest,
    db: AsyncSession = Depends(get_db)
):
    service = get_medical_search_service()
    
    query = request.query
    try:
        result = await service.search(
            query=query,
            max_results=request.max_results
        )
        if isinstance(result, list):
            return {"results": result}
        return result
    except Exception as e:
        print(f"Error en búsqueda médica: {e}")
        raise HTTPException(
            status_code=500,
            detail="No fue posible realizar la búsqueda médica."
        )
'''

if '/api/medical/search' not in content:
    content += endpoint

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Added medical search endpoint")
