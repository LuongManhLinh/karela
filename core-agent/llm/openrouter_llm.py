from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="meta-llama/llama-3.1-405b-instruct",  # or any OpenRouter model
    openai_api_key="YOUR_OPENROUTER_API_KEY",
    base_url="https://openrouter.ai/api/v1",
    default_headers={
        "HTTP-Referer": "https://your-site-or-project",
        "X-Title": "Your App Name",
    },
)

llm.openai_api_key
response = llm.invoke("Explain dependency injection simply.")
print(response)
