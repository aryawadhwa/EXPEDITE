import asyncio
from app.core.config import settings
from app.core.llm import create_chat_llm

async def main():
    print("Testing MLX...")
    settings.LLM_PROVIDER = "mlx"
    settings.MLX_MODEL = "mlx-community/Meta-Llama-3-8B-Instruct-4bit"
    
    llm = create_chat_llm(temperature=0)
    print("LLM Created:", type(llm))
    
    if llm:
        print("Invoking LLM...")
        try:
            res = await llm.ainvoke("Say 'MLX is working!'")
            print("Response:", res.content)
        except Exception as e:
            print("Failed to invoke:", e)
    else:
        print("Failed to create LLM.")

if __name__ == "__main__":
    asyncio.run(main())
