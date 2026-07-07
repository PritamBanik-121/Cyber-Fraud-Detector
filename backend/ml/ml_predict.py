#!/usr/bin/env python3
import sys
import json
import joblib
import numpy as np
import os

ML_DIR = os.path.dirname(os.path.abspath(__file__))

vectorizer = joblib.load(os.path.join(ML_DIR, "vectorizer.joblib"))
clf        = joblib.load(os.path.join(ML_DIR, "rf_model.joblib"))

def predict(text: str) -> dict:
    vec  = vectorizer.transform([text])
    prob = clf.predict_proba(vec)[0]
    pred = int(np.argmax(prob))

    feature_names = vectorizer.get_feature_names_out()
    tfidf_scores  = vec.toarray()[0]
    top_indices   = np.argsort(tfidf_scores)[::-1][:10]
    top_features  = [
        {"ngram": feature_names[i], "tfidf": round(float(tfidf_scores[i]), 4)}
        for i in top_indices if tfidf_scores[i] > 0
    ]

    return {
        "prediction":       pred,
        "label":            "Scam" if pred == 1 else "Non-Scam",
        "probability_scam": round(float(prob[1]), 4),
        "probability_safe": round(float(prob[0]), 4),
        "top_features":     top_features
    }

if __name__ == "__main__":
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            payload = json.loads(line)
            result  = predict(payload.get("text", ""))
            print(json.dumps(result), flush=True)
        except Exception as e:
            print(json.dumps({"error": str(e)}), flush=True)
