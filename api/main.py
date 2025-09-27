from fastapi import FastAPI
from pydantic import BaseModel
import requests

app = FastAPI(title="Text Analysis API")


# Define request body
class AnalyzeRequest(BaseModel):
    text: str


areas = ['weakness', 'strength', 'improvements', 'recommendations']


def chat_offline(text, area):
    prompt = f"""
    You are an expert writing assistant with deep knowledge of literary analysis and editing. 
    Your task is to carefully examine the given text and identify the {area}. 

    Guidelines for your response:
    - Provide a clear, insightful analysis in **only 1–2 lines**.  
    - Keep your response concise, objective, and comprehensive.  
    - Do not include unnecessary details, disclaimers, or formatting beyond plain text.  

    Here is the text to analyze:
    {text}
    """

    response = requests.post('http://localhost:11434/api/generate',
                             json={
                                 'model': 'mistral:latest',
                                 'prompt': prompt,
                                 'stream': False
                             })

    result = response.json()
    return result['response']


@app.post("/analyze")
def analyze_text(req: AnalyzeRequest):
    response = dict()
    for area in areas:
        response[area] = chat_offline(req.text, area)
    return response


@app.get("/")
def root():
    return {"message": "Text Analysis API is running"}
