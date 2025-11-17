# qgen_service.py

import os
import re
import json
from typing import List
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# 1) Load .env
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise RuntimeError("Set OPENAI_API_KEY in your environment or .env file")

# 2) New v1 client
from openai import OpenAI
client = OpenAI(api_key=api_key)

# 3) FastAPI setup
app = FastAPI(
    title="Movie Trivia Question Generator",
    description="Generate movie trivia questions via OpenAI",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4) Request & response schemas
class GenerateRequest(BaseModel):
    topic: str = Field(..., title="Topic", description="What to quiz on")
    n_questions: int = Field(5, ge=1, le=10, title="Number of Questions")

class Question(BaseModel):
    question: str
    options: List[str]
    answer: str

# 5) The single endpoint
@app.post("/generate", response_model=List[Question])
def generate(req: GenerateRequest):
    prompt = (
        f"Generate {req.n_questions} multiple choice trivia questions about \"{req.topic}\".\n"
        "Each question must have exactly 4 answer options.\n"
        "Output the result as a JSON array of objects, each with keys:\n"
        "  • question (string)\n"
        "  • options (array of 4 strings)\n"
        "  • answer (the correct option string)\n"
    )

    try:
        completion = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a question-generation assistant."},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.7,
            max_tokens=500,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    raw_text = completion.choices[0].message.content
    # strip out any ```json … ``` fences
    cleaned = re.sub(r"```(?:json)?\s*", "", raw_text)
    cleaned = re.sub(r"\s*```", "", cleaned)

    try:
        items = json.loads(cleaned)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="Could not parse JSON from OpenAI response:\n" + raw_text
        )

    questions: List[Question] = []
    for obj in items:
        if not all(k in obj for k in ("question", "options", "answer")):
            raise HTTPException(
                status_code=500,
                detail=f"Invalid question format returned by API: {obj}"
            )
        questions.append(Question(**obj))

    return questions
