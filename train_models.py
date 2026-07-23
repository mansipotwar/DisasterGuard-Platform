"""
Train IntelliGuard disaster classifiers from CSV files in ./data.

Writes joblib bundles to ./models/ (see model_utils.OUTPUT_NAMES).

Usage (from project root):

    pip install -r requirements.txt
    python train_models.py
"""

from __future__ import annotations

import sys
from pathlib import Path

from model_utils import DATA_DIR, discover_data_files, infer_disaster_key, run_pipeline_for_file

_TRAIN_ORDER = ["flood", "wildfire", "landslide", "cyclone", "earthquake"]


def _sort_paths(paths: list[Path]) -> list[Path]:
    rank = {k: i for i, k in enumerate(_TRAIN_ORDER)}

    def key(p: Path) -> tuple[int, str]:
        k = infer_disaster_key(p)
        return (rank.get(k or "", 999), p.name)

    return sorted(paths, key=key)


def main() -> int:
    files = _sort_paths(discover_data_files())
    if not files:
        print(f"No mapped CSV files found under {DATA_DIR}", file=sys.stderr)
        return 1

    results: list[dict] = []
    for path in files:
        print(f"\n{'=' * 60}\nTraining: {path.name}\n{'=' * 60}")
        r = run_pipeline_for_file(path)
        results.append(r)
        print(f"Saved: {r['output_path']}")
        print(f"Best estimator: {r['best_model']}  |  holdout accuracy: {r['test_accuracy']:.4f}")
        print("All CV-selected holdout scores:", r["all_scores"])
        print("Classification report (holdout):\n", r["classification_report"])

    print(f"\n{'=' * 60}\nFINAL SUMMARY\n{'=' * 60}")
    for r in results:
        print(f"  {r['disaster_key']:<12}  model={r['best_model']:<8}  accuracy={r['test_accuracy']:.4f}")

    best = max(results, key=lambda x: x["test_accuracy"])
    print(
        f"\nBest holdout accuracy (among these runs): {best['disaster_key']} "
        f"({best['test_accuracy']:.4f}) using {best['best_model']}."
    )
    print("\nModels are saved under ./models as *.pkl bundles (model + StandardScaler + features list).")
    print("Load with joblib.load(); scale feature rows with the saved scaler, then call model.predict / predict_proba.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
