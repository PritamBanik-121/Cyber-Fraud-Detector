import pandas as pd
import re
import os
from sklearn.model_selection import train_test_split

BASE_DIR = r"D:\code files\app_first\cyber-detector"
CSV_PATH = os.path.join(BASE_DIR, "frontend", "src", "data", "Comments - Sheet1.csv")

def clean_text(text):
    if not isinstance(text, str):
        return ""
    text = re.sub(r'http\S+|@\w+|#\w+', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def load_and_clean(path=CSV_PATH):
    df = pd.read_csv(path)

    # Drop junk header row appearing as data
    df = df[df["Label"] != "Label"]
    df = df.dropna(subset=["Comment", "Label"])
    df = df[df["Comment"].str.strip() != ""]

    # Simple binary: anything cyber-crime related = Scam (1), everything else = Non-Scam (0)
    def map_label(val):
        val = str(val).strip()
        if val in ["Non Cyber Crime"]:
            return 0
        elif val in ["Cyber Crime", "Bot Comment", "Scam Promotion", "Fraud", "Scam", "Spam"]:
            return 1
        else:
            return None

    df["label"] = df["Label"].apply(map_label)
    df = df.dropna(subset=["label"])
    df["label"] = df["label"].astype(int)
    df["text"]  = df["Comment"].apply(clean_text)

    print(f"Loaded {len(df)} rows | Scam: {df['label'].sum()} | Non-Scam: {(df['label']==0).sum()}")
    return df

def split_and_balance(df):
    X_train, X_test, y_train, y_test = train_test_split(
        df["text"], df["label"], test_size=0.2, random_state=42, stratify=df["label"]
    )
    test_df = pd.DataFrame({"text": X_test, "label": y_test})
    test_df.to_csv("test_set.csv", index=False)
    return X_train, X_test, y_train, y_test

if __name__ == "__main__":
    df = load_and_clean()
    X_train, X_test, y_train, y_test = split_and_balance(df)
    print(f"Train: {len(X_train)} | Test: {len(X_test)}")