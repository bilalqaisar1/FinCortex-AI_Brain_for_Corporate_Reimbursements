
import sys
import os
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), '../.env')))

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from openai import OpenAI
from app.config.settings import settings

def test_openai():
    print(f"Testing OpenAI with model: {settings.openai_model}...")
    
    if not settings.openai_api_key:
        print("❌ OpenAI API Key not found in settings!")
        return

    try:
        client = OpenAI(api_key=settings.openai_api_key)
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[{"role": "user", "content": "Hello, respond with 'Success' if you can read this."}],
            max_tokens=10
        )
        print("\n✅ OPENAI SUCCESS!")
        print(f"Response: {response.choices[0].message.content.strip()}")
    except Exception as e:
        print(f"\n❌ OPENAI FAILED: {str(e)}")

if __name__ == "__main__":
    test_openai()
