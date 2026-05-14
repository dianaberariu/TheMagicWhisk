import json
import os

import openai
import yt_dlp
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

print("\n=== SECRETS CHECK ===")
print(f"Did Python find the key? -> {'YES!' if os.getenv('OPENAI_API_KEY') else 'NO. It is completely empty.'}")
print("=====================\n")

openai.api_key = os.getenv("OPENAI_API_KEY")

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


def get_video_description(url: str) -> str:
    ydl_opts = {
        "quiet": True,
        "skip_download": True,
        "noplayback": True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        is_tiktok_photo = "tiktok.com" in url and "/photo/" in url
        try:
            info = ydl.extract_info(url, download=False)
        except Exception as exc:
            message = str(exc)
            if "Unsupported URL" in message:
                return (
                    "Unsupported URL: TikTok photo slideshows are not yet supported. "
                    "Please use a video link."
                )
            if is_tiktok_photo:
                return "TikTok Photo posts are not yet supported, please use a video link."
            raise

    description = info.get("description") or info.get("title") or ""
    return description.strip()


def parse_recipe_with_ai(text: str) -> dict:
    system_prompt = (
        "You are an expert culinary chef and nutritionist. Detect the source language of the input text. "
        "Extract the recipe and return ONLY a valid JSON object with this structure: "
        "{ 'languages': { 'en': { ... }, 'ro': { ... } } }. "
        "Each language object must include these exact keys: 'title' (string), 'servings' (number), "
        "'ingredients' (array of objects, each with 'name' and 'amount' keys), 'instructions' (array of strings), "
        "'macros' (object with 'calories', 'protein', 'carbs', and 'fat' keys containing numerical strings like '350' or '30g'), "
        "and 'image_prompt' (a string containing a highly detailed, visual description of the final plated dish based on the ingredients. "
        "Specify professional food photography, lighting, camera angles, and visible textures to be used directly in an image generator). "
        "Rules: If the source is Romanian, extract into 'ro' first and translate to 'en'. "
        "If the source is English, extract into 'en' first and translate to 'ro'. "
        "If the source is German or any other language, extract into 'en' first and translate to 'ro'. "
        "Identify the number of servings (default to 1 if unknown). "
        "CRITICAL MACRO INSTRUCTION: First, identify the total quantity of every ingredient. Second, calculate the total combined macros (calories, protein, carbs, fat) for the ENTIRE recipe. Finally, divide those total macros by the number of servings to output the exact PER-SERVING macros. Do not skip the calculation step. "
        "CRITICAL TRANSLATION INSTRUCTION: When generating or translating the Romanian ('ro') version of the recipe, you MUST convert all imperial measurements (oz, lbs, cups, fluid ounces, Fahrenheit) into metric equivalents (grams, kilograms, milliliters, Celsius). Round the converted numbers to practical, realistic cooking measurements (e.g., output '340g' instead of '340.19g'). The English ('en') version should retain the original units."
    )

    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text},
        ],
        temperature=0.2,
    )

    content = response.choices[0].message.content or "{}"
    print("\n=== EXACTLY WHAT THE AI SAID ===")
    print(content)

    content = content.strip()
    if content.startswith("```json"):
        content = content[len("```json") :]
    elif content.startswith("```"):
        content = content[len("```") :]
    if content.endswith("```"):
        content = content[: -len("```")]
    content = content.strip()

    return json.loads(content)


def generate_recipe_image(image_prompt: str, client) -> str | None:
    prompt = image_prompt

    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            n=1,
            size="1024x1024",
        )
        image_url = response.data[0].url
        return image_url
    except Exception as e:
        print(f"\n=== DALL-E ERROR ===\n{e}\n====================\n")
        return None


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
        return {
            "status": "error",
            "message": f"Failed to parse recipe: {exc}",
        }

    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    recipe["image"] = generate_recipe_image(
        recipe.get("image_prompt", recipe.get("title", "A delicious meal")),
        client,
    )

    return recipe
