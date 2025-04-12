
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/profile/{uid}")
def get_profile(uid: str):
    return {"uid": uid, "xp": 100, "stars": 10, "badges": ["başlangıç"]}
