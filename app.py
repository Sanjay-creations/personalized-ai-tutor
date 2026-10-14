from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Personalized AI Tutor is running"}