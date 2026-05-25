import joblib
from sklearn.pipeline import Pipeline
from .config import settings

_toxicity_model: Pipeline | None = None

def get_toxicity_model() -> Pipeline:
	global _toxicity_model
	if _toxicity_model is None:
		_toxicity_model = joblib.load(settings.model_path)
	return _toxicity_model