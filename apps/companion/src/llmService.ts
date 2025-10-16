import baseUrl from "./baseUrl";

interface LLMService {}

const llmService = {
  async fetchResponse(prompt) {
    const url = `${baseUrl}/generate`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ prompt }),
    });
  },
};

export default llmService;
