import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel

from services import (
    generate_recipe_image,
    get_openai_client,
    get_video_description,
    parse_recipe_with_ai,
)

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ExtractRequest(BaseModel):
    url: str


@app.get("/")
def root() -> dict:
    return {"message": "Welcome to The Magic Whisk API!"}


@app.post("/api/extract")
def extract(request: ExtractRequest) -> dict:
    try:
        description = get_video_description(request.url)
    except Exception as exc:
        return {
            "status": "error",
            "message": f"Failed to extract description: {exc}",
        }

    if not description:
        return {
            "status": "error",
            "message": "No description found for the provided URL.",
        }

    try:
        recipe = parse_recipe_with_ai(description)
    except Exception as exc:
        print(f"\n Error parsing recipe: {exc}")
        return {
            "status": "error",
            "message": f"Failed to parse recipe: {exc}",
        }

    if recipe.get("error") == "NOT_A_RECIPE":
        return recipe

    client = get_openai_client()
    image_prompt = recipe["languages"]["en"]["image_prompt"]
    recipe["image"] = generate_recipe_image(image_prompt, client)

    return recipe


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
