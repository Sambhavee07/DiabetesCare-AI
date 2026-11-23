# DiabetesCare AI: Intelligent Diabetes Risk Screening Web Application

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.1-black.svg)](https://flask.palletsprojects.com/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.3%2B-orange.svg)](https://scikit-learn.org/)
[![Status](https://img.shields.io/badge/Status-Complete-brightgreen.svg)]()

> **"Understand Your Health. Take a Step Towards Prevention."**

**DiabetesCare AI** is an end-to-end clinical machine-learning web application that evaluates personal, metabolic, and lifestyle indicators to stratify diabetes and pre-diabetes risk. Powered by the CDC's Behavioral Risk Factor Surveillance System (BRFSS 2015) dataset (253,680 records), the system achieves **85.11% screening sensitivity** using a calibrated `HistGradientBoostingClassifier` model.

---

## Key Highlights & Performance

- **Champion Algorithm:** `HistGradientBoostingClassifier` (Histogram-based Gradient Boosted Decision Trees).
- **Class-Balanced Weighting:** Employs `class_weight='balanced'` to prevent bias toward the majority healthy population (5.54 : 1 imbalance).
- **Calibrated Screening Threshold:** Calibrated to **0.43** on an inner validation split to maximize healthcare utility ($F_2$-Score), cutting missed diabetic diagnoses by **28.7%** (from 1,465 down to 1,045 on 45,895 unseen test patients).
- **Real-Time Inference:** Sub-5 millisecond server-side prediction response.
- **Privacy-Preserving:** 100% in-memory computation; zero patient data stored.

### Model Evaluation Summary (45,895 Unseen Test Patients)

| Model Architecture | Recall (Sensitivity) | F2-Score | ROC-AUC | PR-AUC | Precision | Accuracy |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Logistic Regression** (Standardized) | 76.01% | 0.5949 | 0.8106 | 0.4121 | 31.83% | 71.43% |
| **Decision Tree** (Pruned) | 77.19% | 0.5917 | 0.8015 | 0.4163 | 30.60% | 69.74% |
| **Random Forest** (100 Trees) | 77.82% | 0.6064 | 0.8173 | 0.4426 | 32.20% | 71.55% |
| **HistGradientBoosting** 🏆 *(Default Thresh 0.50)* | **79.13%** | **0.6087** | **0.8186** | **0.4454** | 31.65% | 70.68% |
| **HistGradientBoosting** 🏆 *(Tuned Thresh 0.43)* | **85.11%** | **0.6139** | **0.8186** | **0.4454** | 29.02% | 65.89% |

---

## Project Architecture

```
DiabetesCare-AI/
├── app.py                                            # Main Flask application & routing
├── requirements.txt                                  # Python dependencies
├── README.md                                         # Project documentation
│
├── utils/
│   ├── __init__.py
│   └── predictor.py                                  # Inference engine, schema validator & logic
│
├── templates/
│   ├── base.html                                     # Master layout with nav, footer & disclaimer
│   ├── index.html                                    # Premium landing page
│   ├── predict.html                                  # 21-feature assessment form with presets
│   ├── result.html                                   # Risk gauge, contributing factors & guidance
│   ├── dashboard.html                                # Interactive Chart.js analytics dashboard
│   └── about.html                                    # Methodology, EDA, ML report & disclaimers
│
├── static/
│   ├── css/
│   │   └── style.css                                 # Modern medical UI styling
│   └── js/
│       ├── main.js                                   # General UI & mobile menu handlers
│       ├── predict.js                                # Auto BMI calculator & preset buttons
│       └── dashboard.js                              # Chart.js visualizations
│
├── models/
│   ├── best_model.joblib                             # Serialized HistGradientBoosting model (275 KB)
│   ├── threshold_config.json                         # Tuned & default threshold configurations
│   └── model_card.json                               # Model card with verified feature schemas
│
├── processed_data/                                   # Preprocessed splits (unscaled & scaled)
│   ├── X_train.csv / X_test.csv                      # Clean unscaled features for tree models
│   ├── X_train_scaled.csv / X_test_scaled.csv        # StandardScaler features for linear models
│   ├── y_train.csv / y_test.csv                      # Target labels
│   ├── scaler.joblib                                 # Serialized StandardScaler
│   └── preprocessing_metadata.json                   # Metadata
│
├── evaluation_results/                               # Benchmark outputs & confusion matrices
│   ├── model_comparison.csv                          # Performance metrics table
│   ├── classification_reports.json                   # Precision/recall by class
│   └── *.png                                         # High-resolution evaluation charts
│
└── diabetes_binary_health_indicators_BRFSS2015.csv   # Raw source dataset (Read-Only)
```

---

## Installation & Running Locally

### 1. Clone or Open the Repository
```bash
cd DiabetesCare-AI
```

### 2. Set Up a Python Virtual Environment
```bash
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS / Linux:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Application
```bash
python app.py
```

Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## API Endpoints

### 1. Model Inference (`POST /api/predict`)
Submit a JSON payload containing the 21 health indicator keys.

**Example Request:**
```json
{
  "HighBP": 1.0,
  "HighChol": 1.0,
  "CholCheck": 1.0,
  "BMI": 32.5,
  "Smoker": 0.0,
  "Stroke": 0.0,
  "HeartDiseaseorAttack": 0.0,
  "PhysActivity": 0.0,
  "Fruits": 1.0,
  "Veggies": 1.0,
  "HvyAlcoholConsump": 0.0,
  "AnyHealthcare": 1.0,
  "NoDocbcCost": 0.0,
  "GenHlth": 4.0,
  "MentHlth": 2.0,
  "PhysHlth": 8.0,
  "DiffWalk": 1.0,
  "Sex": 0.0,
  "Age": 9.0,
  "Education": 4.0,
  "Income": 5.0
}
```

**Example Response:**
```json
{
  "success": true,
  "result": {
    "prediction": 1,
    "probability": 81.4,
    "risk_tier": "High Risk",
    "threshold_used": 0.43,
    "contributing_factors": [
      {
        "factor": "Obesity (BMI ≥ 30)",
        "severity": "high",
        "action": "Consider structured lifestyle intervention..."
      }
    ]
  }
}
```

### 2. Analytics Data (`GET /api/analytics-data`)
Returns all EDA distributions, demographic prevalence figures, and multi-model benchmark statistics for dashboard integration.

### 3. Model Information (`GET /api/model-info`)
Returns model card metadata, threshold configurations, and feature lists.

---

## Medical Disclaimer

**IMPORTANT NOTICE:** This application is developed strictly for academic, educational, and computational demonstration purposes. It is not an FDA-approved or clinically certified medical diagnostic device. Predictions represent statistical risk correlations derived from historical survey responses and should **never** replace professional medical consultation, diagnosis, or clinical laboratory testing (such as HbA1c or fasting blood glucose).
