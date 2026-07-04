import base64
import json
import os
import uuid

import openai
import requests
import yt_dlp
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

openai.api_key = OPENAI_API_KEY
supabase = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None


def get_openai_client() -> openai.OpenAI:
    return openai.OpenAI(api_key=OPENAI_API_KEY)


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
    system_prompt = """
You are an expert culinary chef and nutritionist. First, analyze the provided text or
transcript and determine whether it is actually related to food, cooking, a recipe, or
culinary instructions.
If the content is not about cooking or food at all (for example, a dance video, gaming
clip, random vlog, or unrelated article), do NOT invent ingredients or a recipe.
Instead, return ONLY this exact JSON object: { "error": "NOT_A_RECIPE" }.
If the content is related to food or cooking, detect the source language of the input
text. Extract the recipe and return ONLY a valid JSON object with this structure:
{ 'languages': { 'en': { ... }, 'ro': { ... } } }.
Each language object must include these exact keys: 'title' (string), 'servings'
(number), 'ingredients' (array of objects, each with 'name' and 'amount' keys),
'instructions' (array of strings), 'macros' (object with 'calories', 'protein',
'carbs', and 'fat' keys containing numerical strings like '350' or '30g'), and
'image_prompt' (a string containing a highly detailed, visual description of the
final plated dish based on the ingredients. Specify professional food photography,
lighting, camera angles, and visible textures to be used directly in an image
generator).
Rules: If the source is Romanian, extract into 'ro' first and translate to 'en'.
If the source is English, extract into 'en' first and translate to 'ro'.
If the source is German or any other language, extract into 'en' first and translate
to 'ro'. Identify the number of servings (default to 1 if unknown).
CRITICAL MACRO INSTRUCTION: First, identify the total quantity of every ingredient.
Second, calculate the total combined macros (calories, protein, carbs, fat) for the
ENTIRE recipe. Finally, divide those total macros by the number of servings to output
the exact PER-SERVING macros. Do not skip the calculation step.
CRITICAL TRANSLATION INSTRUCTION: When generating or translating the Romanian ('ro')
version of the recipe, you MUST convert all imperial measurements (oz, lbs, cups,
fluid ounces, Fahrenheit) into metric equivalents (grams, kilograms, milliliters,
Celsius). Round the converted numbers to practical, realistic cooking measurements
(e.g., output '340g' instead of '340.19g'). The English ('en') version should retain
the original units.
"""

    client = get_openai_client()
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text},
        ],
        temperature=0.2,
    )

    content = response.choices[0].message.content or "{}"

    content = content.strip()
    if content.startswith("```json"):
        content = content[len("```json") :]
    elif content.startswith("```"):
        content = content[len("```") :]
    if content.endswith("```"):
        content = content[: -len("```")]
    content = content.strip()

    return json.loads(content)


def generate_recipe_image(image_prompt: str, client: openai.OpenAI | None = None) -> str | None:
    try:
        response = client.images.generate(
            model="gpt-image-1.5",
            prompt=image_prompt,
            n=1,
            size="1024x1024",
        ) if client else get_openai_client().images.generate(
            model="gpt-image-1.5",
            prompt=image_prompt,
            n=1,
            size="1024x1024",
        )

        image_item = response.data[0]
        image_url = None
        image_bytes = None

        if hasattr(image_item, "url"):
            image_url = image_item.url
        elif isinstance(image_item, dict):
            image_url = image_item.get("url")

        if hasattr(image_item, "b64_json"):
            image_b64 = image_item.b64_json
        elif isinstance(image_item, dict):
            image_b64 = image_item.get("b64_json")
        else:
            image_b64 = None

        if image_url:
            image_response = requests.get(image_url, timeout=60)
            image_response.raise_for_status()
            image_bytes = image_response.content
        elif image_b64:
            image_bytes = base64.b64decode(image_b64)
        else:
            print("Error: Neither url nor b64_json was returned by OpenAI.")
            return None

        if not supabase:
            print("Warning: Supabase client is missing; returning the temporary OpenAI URL.")
            return image_url if image_url else None

        file_name = f"{uuid.uuid4().hex}.png"

        supabase.storage.from_("recipe-images").upload(
            file_name,
            image_bytes,
            file_options={"content-type": "image/png"},
        )

        permanent_url = supabase.storage.from_("recipe-images").get_public_url(file_name)

        return permanent_url
    except Exception as exc:
        print(f"\n Error generating image: {exc}")
        return None
