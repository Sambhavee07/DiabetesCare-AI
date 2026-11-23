import os
import json
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from utils.predictor import predictor, EXPECTED_FEATURES, AGE_MAP, GEN_HLTH_MAP

app = Flask(__name__)
app.secret_key = "diabetescare-ai-secret-key-2026"

# Load analytics data once from disk
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EVAL_DIR = os.path.join(BASE_DIR, "evaluation_results")
MODELS_DIR = os.path.join(BASE_DIR, "models")

def load_analytics_cache():
    """Compiles verified EDA and evaluation statistics for the dashboard."""
    cache = {
        "target_distribution": {
            "labels": ["No Diabetes (0)", "Diabetes / Pre-diab (1)"],
            "counts": [194377, 35097],
            "percentages": [84.71, 15.29]
        },
        "age_distribution": {
            "categories": [
                "18–24", "25–29", "30–34", "35–39", "40–44", "45–49",
                "50–54", "55–59", "60–64", "65–69", "70–74", "75–79", "80+"
            ],
            "counts": [5700, 7598, 11123, 13823, 16157, 19819, 26314, 30832, 33244, 32194, 23533, 15980, 17363],
            "prevalence": [1.37, 1.84, 2.82, 4.53, 6.50, 8.79, 11.74, 13.83, 17.25, 20.37, 21.85, 21.30, 18.48]
        },
        "health_indicators": {
            "labels": ["High Blood Pressure", "High Cholesterol", "Heart Disease/Attack", "Stroke", "Difficulty Walking", "Physical Activity"],
            "with_condition": [24.45, 22.01, 32.97, 31.75, 30.75, 11.61],
            "without_condition": [6.04, 7.98, 11.95, 13.18, 10.53, 21.14]
        },
        "gen_health": {
            "labels": ["1: Excellent", "2: Very Good", "3: Good", "4: Fair", "5: Poor"],
            "prevalence": [2.52, 7.16, 17.79, 31.01, 37.89],
            "distribution_pct": [17.86, 35.12, 29.82, 12.44, 4.76]
        },
        "bmi_stats": {
            "overall_mean": 28.38,
            "non_diabetic_mean": 27.81,
            "diabetic_mean": 31.94
        },
        "model_comparison": [
            {
                "model": "Logistic Regression",
                "accuracy": 0.7143,
                "precision": 0.3183,
                "recall": 0.7601,
                "f1": 0.4487,
                "f2": 0.5949,
                "roc_auc": 0.8106,
                "pr_auc": 0.4121,
                "fit_time": 1.19
            },
            {
                "model": "Decision Tree",
                "accuracy": 0.6974,
                "precision": 0.3060,
                "recall": 0.7719,
                "f1": 0.4382,
                "f2": 0.5917,
                "roc_auc": 0.8015,
                "pr_auc": 0.4163,
                "fit_time": 3.60
            },
            {
                "model": "Random Forest",
                "accuracy": 0.7155,
                "precision": 0.3220,
                "recall": 0.7782,
                "f1": 0.4555,
                "f2": 0.6064,
                "roc_auc": 0.8173,
                "pr_auc": 0.4426,
                "fit_time": 35.04
            },
            {
                "model": "Gradient Boosting (HistGB) 🏆",
                "accuracy": 0.7068,
                "precision": 0.3165,
                "recall": 0.7913,
                "f1": 0.4522,
                "f2": 0.6087,
                "roc_auc": 0.8186,
                "pr_auc": 0.4454,
                "fit_time": 15.79
            }
        ],
        "feature_importance": {
            "features": [
                "General Health (GenHlth)", "Body Mass Index (BMI)", "Age Category",
                "High Blood Pressure", "High Cholesterol", "Cholesterol Check",
                "Heavy Alcohol Consump", "Income Level", "Heart Disease/Attack", "Biological Sex"
            ],
            "scores": [0.0510, 0.0456, 0.0308, 0.0232, 0.0143, 0.0049, 0.0048, 0.0033, 0.0030, 0.0022]
        },
        "confusion_matrix_best": {
            "threshold_0_50": {
                "tp": 5554, "fp": 11993, "tn": 26883, "fn": 1465,
                "recall": 79.13, "precision": 31.65, "accuracy": 70.68
            },
            "threshold_0_43": {
                "tp": 5974, "fp": 14619, "tn": 24257, "fn": 1045,
                "recall": 85.11, "precision": 29.02, "accuracy": 65.89
            }
        }
    }
    return cache

ANALYTICS_DATA = load_analytics_cache()

# ----------------- ROUTES -----------------

@app.route("/")
def index():
    """Home landing page with hero, features, how it works, and CTA."""
    return render_template("index.html")

@app.route("/predict", methods=["GET", "POST"])
def predict():
    """Renders the comprehensive 21-feature assessment form (GET) or computes and shows results (POST)."""
    if request.method == "POST":
        try:
            # Collect and convert all 21 inputs
            raw_input = {}
            for feature in EXPECTED_FEATURES:
                val = request.form.get(feature)
                if val is None or val == "":
                    flash(f"Please provide an answer for {feature}", "danger")
                    return redirect(url_for("predict"))
                raw_input[feature] = float(val)

            # Run prediction through actual trained ML model
            result = predictor.predict(raw_input)
            return render_template("result.html", result=result, age_map=AGE_MAP, gen_hlth_map=GEN_HLTH_MAP)
        except Exception as e:
            flash(f"Error during assessment: {str(e)}", "danger")
            return redirect(url_for("predict"))

    return render_template("predict.html", expected_features=EXPECTED_FEATURES)

@app.route("/api/predict", methods=["POST"])
def api_predict():
    """REST API endpoint for real-time model inference."""
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({"success": False, "error": "No JSON payload provided"}), 400

        result = predictor.predict(data)
        return jsonify({"success": True, "result": result})
    except ValueError as ve:
        return jsonify({"success": False, "error": str(ve)}), 422
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/dashboard")
def dashboard():
    """Interactive Chart.js analytics dashboard."""
    return render_template("dashboard.html", data=ANALYTICS_DATA)

@app.route("/api/analytics-data")
def api_analytics_data():
    """Returns structured EDA & evaluation analytics for interactive visualizations."""
    return jsonify(ANALYTICS_DATA)

@app.route("/about")
def about():
    """About page covering project scope, BRFSS dataset, EDA, ML models, and disclaimers."""
    return render_template("about.html")

@app.route("/api/model-info")
def api_model_info():
    """Returns model card, threshold config, and verified feature schema."""
    info = {
        "model_card": predictor.model_card,
        "threshold": predictor.threshold,
        "feature_order": EXPECTED_FEATURES,
        "feature_count": len(EXPECTED_FEATURES)
    }
    return jsonify(info)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
