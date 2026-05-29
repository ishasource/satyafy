namespace FakeNewsAPI.Models
{
    public class AnalysisResult
    {
        public string Label { get; set; } = string.Empty;
        public double FakeProbability { get; set; }
        public string AnalysedText { get; set; } = string.Empty;
        public string GeminiExplanation { get; set; } = string.Empty;
        public bool Success { get; set; } = true;
        public string Error { get; set; } = string.Empty;
    }
}