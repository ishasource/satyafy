from flask import Flask, request, jsonify
import joblib
import numpy as np
from scipy.sparse import hstack, csr_matrix
from sklearn.base import BaseEstimator, TransformerMixin
import re
import os

class TextFeatures(BaseEstimator, TransformerMixin):
    
    SENSATIONAL = re.compile(
        r'\b(BREAKING|EXCLUSIVE|SHOCKING|REVEALED|CONSPIRACY|'
        r'SECRET|BANNED|CENSORED|HOAX|URGENT|ALERT)\b',
        re.IGNORECASE
    )
    
    def fit(self, X, y=None):
        return self
    
    def transform(self, X):
        features = []
        for text in X:
            text = str(text)
            words = text.split()
            features.append([
                len(text),
                len(words),
                text.count('!'),
                text.count('?'),
                sum(1 for c in text if c.isupper()),
                len(self.SENSATIONAL.findall(text)),
                sum(1 for w in words if w.isupper() and len(w) > 2),
            ])
        return np.array(features, dtype=float)

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
clf            = joblib.load(os.path.join(BASE_DIR, 'fake_news_model.pkl'))
tfidf          = joblib.load(os.path.join(BASE_DIR, 'tfidf_vectorizer.pkl'))
feat_extractor = joblib.load(os.path.join(BASE_DIR, 'text_features.pkl'))

AVERAGE_LIE_RATIO = 0.495

def extract_first_sentence(text):
    sentences = text.strip().split('.')
    return sentences[0].strip() if sentences else text

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    text = data.get('text', '').strip()
    
    # validation
    if len(text) < 50:
        return jsonify({'error': 'Text too short for analysis.'}), 400
    
    words = text.split()
    if len(words) < 5:
        return jsonify({'error': 'Please enter a complete sentence.'}), 400
    
    real_words = [w for w in words if w.isalpha()]
    if len(real_words) < 3:
        return jsonify({'error': 'Please enter readable text.'}), 400
    first_sentence = extract_first_sentence(text)
    combined = first_sentence + " unknown"
    
    tfidf_vec = tfidf.transform([combined])
    feat_vec  = csr_matrix(feat_extractor.transform([combined]))
    spk_vec   = csr_matrix(np.array([[0, 0, AVERAGE_LIE_RATIO]]))
    
    X = hstack([tfidf_vec, feat_vec, spk_vec])
    
    prob = float(clf.predict_proba(X)[0][1])
    label = "Fake" if prob > 0.5 else "Real"
    
    return jsonify({
        'label': label,
        'fake_probability': round(prob, 3),
        'analysed_text': first_sentence
    })   

if __name__ == '__main__':
    app.run(port=5001, debug=True)