from fastapi import FastAPI
from pydantic import BaseModel
import requests
from keybert import KeyBERT

app = FastAPI(title="Text Analysis API")


# Define request body
class AnalyzeRequest(BaseModel):
    text: str


class TextInput(BaseModel):
    text: str


areas = ['weakness', 'strength', 'improvements', 'recommendations']
kw_model = KeyBERT()


def text_analysis(text, area):
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
        response[area] = text_analysis(req.text, area)
    return response


@app.post("/get_tag")
def getTag(data: TextInput):
    keywords = kw_model.extract_keywords(data.text,
                                         keyphrase_ngram_range=(1, 2),
                                         stop_words="english",
                                         top_n=1)
    tag = keywords[0][0] if keywords else None
    return {"tag": tag}


@app.get("/")
def root():
    return {"message": "Text Analysis API is running"}
