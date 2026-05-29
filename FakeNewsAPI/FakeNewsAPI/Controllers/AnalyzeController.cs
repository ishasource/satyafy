using Microsoft.AspNetCore.Mvc;
using FakeNewsAPI.Models;
using FakeNewsAPI.Services;

namespace FakeNewsAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyzeController : ControllerBase
    {
        private readonly FlaskService _flaskService;
        private readonly GeminiService _geminiService;
        private readonly ILogger<AnalyzeController> _logger;

        public AnalyzeController(
            FlaskService flaskService,
            GeminiService geminiService,
            ILogger<AnalyzeController> logger)
        {
            _flaskService = flaskService;
            _geminiService = geminiService;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> Analyze([FromBody] ArticleRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Text))
                return BadRequest(new { error = "Text cannot be empty." });

            if (string.IsNullOrWhiteSpace(request.Text))
                return BadRequest(new { error = "Text cannot be empty." });

            if (request.Text.Trim().Length < 50)
                return BadRequest(new { error = "Please enter at least 50 characters." });

            if (request.Text.Trim().Split(' ').Length < 5)
                return BadRequest(new { error = "Please enter a complete sentence." });

            try
            {
                var mlTask = _flaskService.PredictAsync(request.Text);
                var geminiTask = _geminiService.AnalyseAsync(request.Text);

                await Task.WhenAll(mlTask, geminiTask);

                var (label, fakeProbability, analysedText) = await mlTask;
                var geminiExplanation = await geminiTask;

                var result = new AnalysisResult
                {
                    Label = label,
                    FakeProbability = fakeProbability,
                    AnalysedText = analysedText,
                    GeminiExplanation = geminiExplanation,
                    Success = true
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Analysis failed");
                return StatusCode(500, new AnalysisResult
                {
                    Success = false,
                    Error = ex.Message + " | " + ex.InnerException?.Message
                });
            }
        }
    }
}