using System.Text;
using System.Text.Json;
using FakeNewsAPI.Models;

namespace FakeNewsAPI.Services
{
    public class FlaskService
    {
        private readonly HttpClient _httpClient;
        private readonly string _flaskUrl;

        public FlaskService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _flaskUrl = config["FlaskService:BaseUrl"] ?? "http://127.0.0.1:5001";
        }

        public async Task<(string Label, double FakeProbability, string AnalysedText)> PredictAsync(string text)
        {
            var payload = new { text };
            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{_flaskUrl}/predict", content);
            response.EnsureSuccessStatusCode();

            var responseJson = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(responseJson);

            var label = result.GetProperty("label").GetString() ?? "Unknown";
            var prob = result.GetProperty("fake_probability").GetDouble();
            var analysedText = result.GetProperty("analysed_text").GetString() ?? text;

            return (label, prob, analysedText);
        }
    }
}