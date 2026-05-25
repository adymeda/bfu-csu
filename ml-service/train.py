from datasets import load_dataset
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, precision_score, recall_score, f1_score, accuracy_score
import joblib

MODEL_PATH = "model.joblib"

print("Loading dataset...")
ds = load_dataset("AlexSham/Toxic_Russian_Comments")

X_train = ds["train"]["text"]
y_train = ds["train"]["label"]
X_test  = ds["test"]["text"]
y_test  = ds["test"]["label"]

print(f"Train: {len(X_train)} samples | Toxic: {sum(y_train)} ({sum(y_train)/len(y_train):.1%})")
print(f"Test:  {len(X_test)} samples  | Toxic: {sum(y_test)} ({sum(y_test)/len(y_test):.1%})")

features = FeatureUnion([
    ("word", TfidfVectorizer(
        analyzer="word",
        ngram_range=(1, 2),
        sublinear_tf=True,
        max_features=100_000,
        min_df=2,
    )),
    ("char", TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(3, 5),
        sublinear_tf=True,
        max_features=100_000,
        min_df=3,
    )),
])

pipeline = Pipeline([
    ("features", features),
    ("clf", LogisticRegression(
        C=1.0,
        max_iter=1000,
        solver="lbfgs",
        class_weight="balanced",
    )),
])

print("Training...")
pipeline.fit(X_train, y_train)

y_pred = pipeline.predict(X_test)

print("\n=== Metrics ===")
print(f"Accuracy:  {accuracy_score(y_test, y_pred):.4f}")
print(f"Precision: {precision_score(y_test, y_pred):.4f}")
print(f"Recall:    {recall_score(y_test, y_pred):.4f}")
print(f"F1 Score:  {f1_score(y_test, y_pred):.4f}")
print()
print(classification_report(y_test, y_pred, target_names=["normal", "toxic"]))

joblib.dump(pipeline, MODEL_PATH)
print(f"Model saved to {MODEL_PATH}")