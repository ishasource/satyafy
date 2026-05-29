using System.Text;
using System.Text.Json;

namespace FakeNewsAPI.Services
{
    public class GeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public GeminiService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _apiKey = config["Gemini:ApiKey"] ?? string.Empty;
        }

        public async Task<string> AnalyseAsync(string text)
        {
            var prompt = $"""
        Analyse the following news article or statement for credibility.
        
        Look for these red flags and comment on each if present:
        - Sensational or emotionally manipulative language
        - Vague or missing sources
        - Logical inconsistencies or exaggerated claims
        - One-sided or biased framing
        
        Be concise. Return your response as 3-5 bullet points.
        End with one line: either "Overall: likely credible" or "Overall: likely misleading".
        
        Article:
        {text}
        """;

            var requestBody = new
            {
                model = "llama-3.3-70b-versatile",
                messages = new[]
                {
            new { role = "user", content = prompt }
        }
            };

            var json = JsonSerializer.Serialize(requestBody);

            var httpRequest = new HttpRequestMessage(HttpMethod.Post,
                "https://api.groq.com/openai/v1/chat/completions");
            httpRequest.Headers.Add("Authorization", $"Bearer {_apiKey}");
            httpRequest.Content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(httpRequest);
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                throw new Exception($"Groq error {(int)response.StatusCode}: {errorBody}");
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(responseJson);

            return result
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString() ?? "No analysis available.";
        }
    }
}
