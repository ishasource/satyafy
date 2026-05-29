# Satyafy — Fake News Detector

A hybrid fake news detection system combining a classical ML classifier with LLM-based contextual analysis.

## Tech Stack
- **ML**: Python · scikit-learn · Flask · LIAR dataset
- **Backend**: C# · ASP.NET Web API
- **Frontend**: React · Tailwind CSS
- **AI**: Groq LLaMA API

## Architecture
- Python Flask microservice serves a logistic regression model trained on 10,240 LIAR dataset samples (74% accuracy)
- ASP.NET Web API orchestrates parallel async calls to Flask and Groq
- React frontend displays ML probability score and AI explanation side by side

## Setup

### ML Service
1. Download the LIAR dataset and place TSV files in `ml_service/liar_dataset/`
2. Run `liar_model.ipynb` to train and save the model
3. Run `python app.py` to start Flask on port 5001

### Backend
1. Add your Groq API key to `appsettings.json`
2. Run the ASP.NET project in Visual Studio (F5)

### Frontend
1. `cd frontend && npm install && npm run dev`

## Known Limitations
The ML model performs best on political headlines and short claims. It may underperform on science or technology topics due to the political nature of the LIAR training dataset.
