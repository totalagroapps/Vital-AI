from pydantic import BaseModel, ConfigDict

class InsuranceCompanyCreate(BaseModel):
    name: str

class InsuranceCompanyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
