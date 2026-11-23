import os
import json
import joblib
import pandas as pd
import numpy as np

# Base paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODELS_DIR, "best_model.joblib")
THRESHOLD_CONFIG_PATH = os.path.join(MODELS_DIR, "threshold_config.json")
MODEL_CARD_PATH = os.path.join(MODELS_DIR, "model_card.json")

# Expected 21 features in exact order
EXPECTED_FEATURES = [
    "HighBP", "HighChol", "CholCheck", "BMI", "Smoker", "Stroke",
    "HeartDiseaseorAttack", "PhysActivity", "Fruits", "Veggies",
    "HvyAlcoholConsump", "AnyHealthcare", "NoDocbcCost", "GenHlth",
    "MentHlth", "PhysHlth", "DiffWalk", "Sex", "Age", "Education", "Income"
]

# Human readable Age mapping
AGE_MAP = {
    1: "18–24", 2: "25–29", 3: "30–34", 4: "35–39",
    5: "40–44", 6: "45–49", 7: "50–54", 8: "55–59",
    9: "60–64", 10: "65–69", 11: "70–74", 12: "75–79", 13: "80 or older"
}

# Human readable General Health mapping
GEN_HLTH_MAP = {
    1: "Excellent", 2: "Very Good", 3: "Good", 4: "Fair", 5: "Poor"
}

class DiabetesPredictor:
    def __init__(self):
        self.model = None
        self.threshold = 0.43  # Default based on inner-validation F2 tuning
        self.model_card = {}
        self.load_artifacts()

    def load_artifacts(self):
        """Loads serialized model, threshold config, and model card."""
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")

        self.model = joblib.load(MODEL_PATH)
        print(f"[Predictor] Loaded model: {type(self.model).__name__}")

        if os.path.exists(THRESHOLD_CONFIG_PATH):
            with open(THRESHOLD_CONFIG_PATH, "r") as f:
                cfg = json.load(f)
                self.threshold = cfg.get("optimal_threshold_f2", 0.43)
                print(f"[Predictor] Loaded optimal decision threshold: {self.threshold:.2f}")

        if os.path.exists(MODEL_CARD_PATH):
            with open(MODEL_CARD_PATH, "r") as f:
                self.model_card = json.load(f)

    def validate_and_parse_input(self, data: dict) -> pd.DataFrame:
        """Validates all 21 input values, enforces boundaries, and orders features."""
        parsed = {}

        # 1. Binary validation (0 or 1)
        binary_fields = [
            "HighBP", "HighChol", "CholCheck", "Smoker", "Stroke",
            "HeartDiseaseorAttack", "PhysActivity", "Fruits", "Veggies",
            "HvyAlcoholConsump", "AnyHealthcare", "NoDocbcCost", "DiffWalk", "Sex"
        ]
        for field in binary_fields:
            if field not in data or data[field] is None or data[field] == "":
                raise ValueError(f"Missing required field: {field}")
            try:
                val = float(data[field])
                if val not in [0.0, 1.0]:
                    raise ValueError(f"Field {field} must be 0 or 1, got {val}")
                parsed[field] = val
            except (ValueError, TypeError):
                raise ValueError(f"Invalid numeric value for field: {field}")

        # 2. BMI validation (range 10.0 to 98.0)
        if "BMI" not in data or data["BMI"] is None or data["BMI"] == "":
            raise ValueError("Missing required field: BMI")
        try:
            bmi_val = float(data["BMI"])
            if bmi_val < 10.0 or bmi_val > 98.0:
                raise ValueError(f"BMI must be between 10.0 and 98.0 kg/m², got {bmi_val}")
            parsed["BMI"] = round(bmi_val, 1)
        except (ValueError, TypeError):
            raise ValueError("Invalid numeric value for BMI")

        # 3. GenHlth validation (1 to 5)
        if "GenHlth" not in data:
            raise ValueError("Missing required field: GenHlth")
        try:
            gh_val = int(float(data["GenHlth"]))
            if gh_val < 1 or gh_val > 5:
                raise ValueError(f"GenHlth must be between 1 and 5, got {gh_val}")
            parsed["GenHlth"] = float(gh_val)
        except (ValueError, TypeError):
            raise ValueError("Invalid value for GenHlth")

        # 4. MentHlth & PhysHlth (0 to 30 days)
        for field in ["MentHlth", "PhysHlth"]:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")
            try:
                days = float(data[field])
                if days < 0.0 or days > 30.0:
                    raise ValueError(f"{field} must be between 0 and 30 days, got {days}")
                parsed[field] = days
            except (ValueError, TypeError):
                raise ValueError(f"Invalid numeric value for {field}")

        # 5. Age category (1 to 13)
        if "Age" not in data:
            raise ValueError("Missing required field: Age")
        try:
            age_cat = int(float(data["Age"]))
            if age_cat < 1 or age_cat > 13:
                raise ValueError(f"Age category must be between 1 and 13, got {age_cat}")
            parsed["Age"] = float(age_cat)
        except (ValueError, TypeError):
            raise ValueError("Invalid value for Age")

        # 6. Education (1 to 6)
        if "Education" not in data:
            raise ValueError("Missing required field: Education")
        try:
            edu = int(float(data["Education"]))
            if edu < 1 or edu > 6:
                raise ValueError(f"Education category must be between 1 and 6, got {edu}")
            parsed["Education"] = float(edu)
        except (ValueError, TypeError):
            raise ValueError("Invalid value for Education")

        # 7. Income (1 to 8)
        if "Income" not in data:
            raise ValueError("Missing required field: Income")
        try:
            inc = int(float(data["Income"]))
            if inc < 1 or inc > 8:
                raise ValueError(f"Income category must be between 1 and 8, got {inc}")
            parsed["Income"] = float(inc)
        except (ValueError, TypeError):
            raise ValueError("Invalid value for Income")

        # Return DataFrame with EXACT column names and order expected by HistGradientBoostingClassifier
        df_input = pd.DataFrame([parsed])[EXPECTED_FEATURES]
        return df_input

    def identify_contributing_factors(self, data: dict, prob: float) -> list:
        """Analyzes which specific patient factors contributed towards elevated risk."""
        factors = []

        bmi = float(data.get("BMI", 25))
        if bmi >= 30.0:
            factors.append({
                "factor": "Obesity (BMI ≥ 30)",
                "detail": f"Patient BMI is {bmi:.1f} kg/m² (clinical obesity threshold is 30.0). Excess adipose tissue is strongly linked to insulin resistance.",
                "severity": "high",
                "action": "Consider structured lifestyle intervention aimed at gradual 5–10% body weight reduction."
            })
        elif bmi >= 25.0:
            factors.append({
                "factor": "Overweight (BMI 25–29.9)",
                "detail": f"Patient BMI is {bmi:.1f} kg/m² (overweight range).",
                "severity": "moderate",
                "action": "Maintain caloric balance and engage in routine aerobic exercise."
            })

        if float(data.get("HighBP", 0)) == 1.0:
            factors.append({
                "factor": "Hypertension (High Blood Pressure)",
                "detail": "Hypertension is a primary metabolic comorbidity that doubles cardiovascular and diabetic complications.",
                "severity": "high",
                "action": "Monitor blood pressure regularly and limit dietary sodium intake."
            })

        if float(data.get("HighChol", 0)) == 1.0:
            factors.append({
                "factor": "High Cholesterol",
                "detail": "Elevated lipids impair vascular endothelia and compound metabolic syndrome risks.",
                "severity": "high",
                "action": "Consult a physician for a lipid panel screening and consider heart-healthy dietary changes."
            })

        gen_hlth = int(float(data.get("GenHlth", 2)))
        if gen_hlth >= 4:
            factors.append({
                "factor": f"Self-Reported Health: {GEN_HLTH_MAP.get(gen_hlth, 'Fair/Poor')}",
                "detail": "Fair or poor subjective health strongly correlates with metabolic and chronic conditions in population studies.",
                "severity": "moderate",
                "action": "Schedule a comprehensive preventive health checkup."
            })

        age = int(float(data.get("Age", 5)))
        if age >= 8:  # 55+
            factors.append({
                "factor": f"Age Demographic ({AGE_MAP.get(age, '55+')})",
                "detail": "Insulin sensitivity naturally declines with advancing age.",
                "severity": "info",
                "action": "Annual fasting plasma glucose or HbA1c screening is strongly recommended for adults over 45."
            })

        if float(data.get("PhysActivity", 1)) == 0.0:
            factors.append({
                "factor": "Sedentary Lifestyle (No Physical Activity)",
                "detail": "No reported physical activity outside work over the past 30 days.",
                "severity": "moderate",
                "action": "Incorporate at least 150 minutes of moderate aerobic activity (e.g., brisk walking) per week."
            })

        if float(data.get("HeartDiseaseorAttack", 0)) == 1.0:
            factors.append({
                "factor": "Cardiovascular Disease History",
                "detail": "Previous coronary disease significantly raises diabetic vascular complication risks.",
                "severity": "high",
                "action": "Ensure coordinated cardiometabolic care with your healthcare provider."
            })

        if float(data.get("DiffWalk", 0)) == 1.0:
            factors.append({
                "factor": "Mobility Limitations (Difficulty Walking)",
                "detail": "Mobility challenges often restrict regular caloric expenditure.",
                "severity": "moderate",
                "action": "Explore low-impact exercises such as swimming or seated resistance routines."
            })

        if float(data.get("Smoker", 0)) == 1.0:
            factors.append({
                "factor": "Tobacco Smoking History",
                "detail": "Smoking increases systemic inflammation and worsens insulin receptor sensitivity.",
                "severity": "moderate",
                "action": "Explore evidence-based smoking cessation programs."
            })

        # If low risk and few factors
        if len(factors) == 0:
            factors.append({
                "factor": "Positive Health Indicators",
                "detail": "Normal blood pressure, regular physical activity, and healthy weight profiles support metabolic stability.",
                "severity": "positive",
                "action": "Continue maintaining current balanced nutrition and exercise routines."
            })

        return factors

    def predict(self, raw_input: dict) -> dict:
        """Runs validated inference through the trained HistGradientBoosting model."""
        df_features = self.validate_and_parse_input(raw_input)

        # HistGradientBoostingClassifier was trained directly on raw unscaled features
        prob = float(self.model.predict_proba(df_features)[0, 1])

        # Classification based on validated threshold (0.43)
        is_high_risk = prob >= self.threshold

        # Determine clinical risk tier
        if prob < 0.20:
            risk_tier = "Low Risk"
            risk_color = "#10b981"  # Emerald green
            risk_badge = "success"
            summary = "Your responses indicate a low statistical likelihood of diabetes based on population health indicators."
        elif prob < self.threshold:
            risk_tier = "Moderate / Borderline Risk"
            risk_color = "#f59e0b"  # Amber
            risk_badge = "warning"
            summary = "Your risk score is below the screening alert cutoff, but several metabolic or lifestyle indicators warrant preventive attention."
        elif prob < 0.65:
            risk_tier = "Elevated Risk"
            risk_color = "#f97316"  # Orange
            risk_badge = "orange"
            summary = "Your profile shows notable risk factors associated with pre-diabetes or diabetes. A clinical screening test is recommended."
        else:
            risk_tier = "High Risk"
            risk_color = "#ef4444"  # Red
            risk_badge = "danger"
            summary = "Multiple significant metabolic risk factors detected. We strongly suggest consulting a healthcare professional for an HbA1c test."

        contributing_factors = self.identify_contributing_factors(raw_input, prob)

        result = {
            "prediction": int(is_high_risk),
            "probability": round(prob * 100, 1),
            "probability_raw": prob,
            "threshold_used": self.threshold,
            "risk_tier": risk_tier,
            "risk_color": risk_color,
            "risk_badge": risk_badge,
            "summary": summary,
            "contributing_factors": contributing_factors,
            "input_features": raw_input
        }
        return result

# Singleton instance for easy import
predictor = DiabetesPredictor()
