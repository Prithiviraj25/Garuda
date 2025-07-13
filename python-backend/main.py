import os
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
import httpx
from fastapi.responses import JSONResponse

# Load environment variables
load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
PINECONE_NAMESPACE = os.getenv("PINECONE_NAMESPACE")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama3-70b-8192")

# Initialize services
app = FastAPI()
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX_NAME)
model = SentenceTransformer("all-MiniLM-L6-v2")

# --- Request Schemas ---
class QueryRequest(BaseModel):
    query: str

class IOCRequest(BaseModel):
    ioc: str
    ioc_type: str
    severity: str
    sector: Optional[str] = "general"

class ReportRequest(BaseModel):
    type: str = "executive"
    format: str = "markdown"
    timeRange: dict
    includeCharts: bool = True
    includeRecommendations: bool = True

# --- Core LLM API Call ---
async def call_groq_api(system_prompt: str, user_prompt: str, context: str = ""):
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "model": GROQ_MODEL,
        "temperature": 0.2,
        "top_p": 1
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload
        )
        result = response.json()
        return {
            "response": result["choices"][0]["message"]["content"],
            "context_used": context
        }

# --- Endpoint: Ask Question with Context ---
@app.post("/ask")
async def ask_user_question(req: QueryRequest):
    query_embedding = model.encode([req.query])[0].tolist()

    pinecone_results = index.query(
        vector=query_embedding,
        top_k=5,
        namespace=PINECONE_NAMESPACE,
        include_metadata=True
    )

    context = ""
    for match in pinecone_results.get("matches", []):
        md = match.get("metadata", {})
        context += f"- {md.get('type', 'Unknown')} | {md.get('value', '')} | Severity: {md.get('severity')} | Confidence: {md.get('confidence')}\n"

    system_prompt = "You are a threat intelligence assistant. Use the context to answer questions."
    user_prompt = f"Question: {req.query}\n\nContext:\n{context}\n\nAnswer clearly:"

    return await call_groq_api(system_prompt, user_prompt, context)

# --- Endpoint: Search IOCs ---
@app.post("/search-iocs")
async def search_iocs(req: QueryRequest):
    query_embedding = model.encode([req.query])[0].tolist()
    pinecone_results = index.query(
        vector=query_embedding,
        top_k=10,
        namespace=PINECONE_NAMESPACE,
        include_metadata=True
    )

    cleaned_matches = []
    for match in pinecone_results.get("matches", []):
        cleaned_matches.append({
            "id": match.get("id"),
            "score": float(match.get("score", 0)),
            "metadata": match.get("metadata", {})
        })

    return JSONResponse(content={"matches": cleaned_matches})

# --- Endpoint: Enrich a Single IOC ---
@app.post("/analyze-ioc")
async def analyze_ioc(req: IOCRequest):
    system_prompt = "You are a cyber threat analyst AI. Enrich the given IOC with context, threats, and recommended mitigations."
    user_prompt = f"IOC: {req.ioc}\nType: {req.ioc_type}\nSeverity: {req.severity}\n\nProvide enriched threat context and remediation."
    result = await call_groq_api(system_prompt, user_prompt)
    return JSONResponse(content=result)

# --- Endpoint: BCM Impact Analysis ---
@app.post("/bcm-impact")
async def assess_bcm_impact(req: IOCRequest):
    system_prompt = "You are a cybersecurity BCM analyst. Assess the business continuity impact of the threat based on the client's sector."

    user_prompt = f"""
IOC: {req.ioc}
Type: {req.ioc_type}
Severity: {req.severity}
Client Sector: {req.sector}

Estimate impact:
- 🔥 High – Affects critical business operations, customer-facing systems, or revenue generators
- ⚠️ Medium – Disrupts internal processes or support functions
- 🟢 Low – Minimal or no business disruption

Return:
- BCM Impact Level
- Business Reason
- Suggested Mitigation
"""
    result = await call_groq_api(system_prompt, user_prompt)
    return JSONResponse(content=result)

# --- Endpoint: Generate Executive or Technical Report ---
@app.post("/generate-report")
async def generate_report(req: ReportRequest):
    system_prompt = "You are a security report generator. Create a summary report based on threat data and intelligence insights."
    user_prompt = f"""
Type: {req.type}
Format: {req.format}
Time Range: {req.timeRange}
Charts: {req.includeCharts}
Recommendations: {req.includeRecommendations}

Return a well-structured report.
"""
    result = await call_groq_api(system_prompt, user_prompt)
    return JSONResponse(content=result)

# --- Endpoint: Feeds Status ---
@app.get("/feeds/status")
async def feeds_status():
    return {
        "feeds": [
            {"name": "AbuseIPDB", "status": "active"},
            {"name": "URLhaus", "status": "active"},
            {"name": "PhishTank", "status": "active"}
        ]
    }

# --- Endpoint: Active Alerts ---
@app.get("/alerts")
async def get_alerts():
    return {
        "alerts": [
            {
                "id": "A-2025-001",
                "title": "Suspicious IP Contact",
                "severity": "High",
                "status": "open"
            },
            {
                "id": "A-2025-002",
                "title": "Phishing URL Detected",
                "severity": "Medium",
                "status": "investigating"
            }
        ]
    }

# --- Endpoint: BCM Dashboard from Pinecone ---
@app.get("/bcm-dashboard")
async def get_bcm_dashboard():
    # Dummy search vector (e.g., "threat" as seed) to fetch IOCs from Pinecone
    query_embedding = model.encode(["threat"])[0].tolist()
    pinecone_results = index.query(
        vector=query_embedding,
        top_k=10,
        namespace=PINECONE_NAMESPACE,
        include_metadata=True
    )

    bcm_summaries = []
    for match in pinecone_results.get("matches", []):
        md = match.get("metadata", {})
        user_prompt = f"""
IOC: {md.get('value')}
Type: {md.get('type')}
Severity: {md.get('severity', 'medium')}
Client Sector: {md.get('sector', 'general')}

Return BCM impact:
- BCM Impact Level
- Business Reason
- Suggested Mitigation
"""
        system_prompt = "You are a cybersecurity BCM analyst. Given an IOC, assess its business continuity impact."
        response = await call_groq_api(system_prompt, user_prompt)
        bcm_summaries.append({
            "ioc_id": match.get("id"),
            "score": match.get("score"),
            "bcm_summary": response["response"]
        })

    return JSONResponse(content={"bcm_results": bcm_summaries})