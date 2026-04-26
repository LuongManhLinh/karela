import tiktoken


def count_tokens(text):
    encoding = tiktoken.get_encoding("o200k_base")
    tokens = encoding.encode(text)
    return len(tokens)


with open("data/500_us.json", "r") as f:
    data = f.read()
token_count = count_tokens(data)
print(f"Token count: {token_count}")
