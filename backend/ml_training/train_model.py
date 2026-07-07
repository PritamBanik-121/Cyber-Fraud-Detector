import joblib
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
from prepare_data import load_and_clean, split_and_balance

BASE_DIR = r"D:\code files\app_first\cyber-detector"
ML_OUT  = os.path.join(BASE_DIR, "backend", "ml")

def train():
    df = load_and_clean()
    X_train, X_test, y_train, y_test = split_and_balance(df)

    vectorizer = TfidfVectorizer(
        analyzer='char_wb',
        ngram_range=(2, 5),
        max_features=50000,
        sublinear_tf=True
    )

    clf = RandomForestClassifier(
        n_estimators=300,
        min_samples_split=5,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )

    print("Vectorizing...")
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec  = vectorizer.transform(X_test)

    print("Training Random Forest (this takes 1-3 minutes)...")
    clf.fit(X_train_vec, y_train)

    print("\n--- Evaluation ---")
    y_pred = clf.predict(X_test_vec)
    print(classification_report(y_test, y_pred, target_names=["Safe", "Scam"]))
    print("Confusion matrix:\n", confusion_matrix(y_test, y_pred))

    # Save into backend/ml/
    os.makedirs(ML_OUT, exist_ok=True)
    joblib.dump(vectorizer, os.path.join(ML_OUT, "vectorizer.joblib"))
    joblib.dump(clf,        os.path.join(ML_OUT, "rf_model.joblib"))
    print(f"\nSaved model files to: {ML_OUT}")

if __name__ == "__main__":
    train()