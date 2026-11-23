/**
 * DiabetesCare AI - Health Assessment Form Interactive Script
 */

document.addEventListener("DOMContentLoaded", function () {
    const bmiInput = document.getElementById("BMI");
    const bmiBadge = document.getElementById("bmiBadge");
    const mentSlider = document.getElementById("MentHlth");
    const mentVal = document.getElementById("mentHlthVal");
    const physSlider = document.getElementById("PhysHlth");
    const physVal = document.getElementById("physHlthVal");

    // Slider real-time values
    if (mentSlider && mentVal) {
        mentSlider.addEventListener("input", function () {
            mentVal.textContent = `${this.value} ${this.value === "1" ? "day" : "days"}`;
        });
    }

    if (physSlider && physVal) {
        physSlider.addEventListener("input", function () {
            physVal.textContent = `${this.value} ${this.value === "1" ? "day" : "days"}`;
        });
    }

    // BMI Badge Live Update
    function updateBmiBadge(val) {
        if (!bmiBadge) return;
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0) {
            bmiBadge.textContent = "--";
            bmiBadge.style.color = "var(--navy-600)";
            return;
        }
        if (num < 18.5) {
            bmiBadge.textContent = "Underweight";
            bmiBadge.style.color = "#0284c7";
        } else if (num < 25.0) {
            bmiBadge.textContent = "Normal Weight";
            bmiBadge.style.color = "#059669";
        } else if (num < 30.0) {
            bmiBadge.textContent = "Overweight";
            bmiBadge.style.color = "#d97706";
        } else {
            bmiBadge.textContent = "Obese";
            bmiBadge.style.color = "#dc2626";
        }
    }

    if (bmiInput) {
        bmiInput.addEventListener("input", function () {
            updateBmiBadge(this.value);
        });
    }

    // Interactive BMI Calculator
    const btnCalc = document.getElementById("btnCalculateBmi");
    const calcW = document.getElementById("calcWeight");
    const calcH = document.getElementById("calcHeight");
    const toggleCalc = document.getElementById("toggleBmiCalc");
    const calcBody = document.getElementById("bmiCalcBody");

    if (toggleCalc && calcBody) {
        toggleCalc.addEventListener("click", function () {
            if (calcBody.style.display === "none") {
                calcBody.style.display = "block";
                toggleCalc.textContent = "Hide Calculator";
            } else {
                calcBody.style.display = "none";
                toggleCalc.textContent = "Show Calculator";
            }
        });
    }

    if (btnCalc && calcW && calcH && bmiInput) {
        btnCalc.addEventListener("click", function () {
            const w = parseFloat(calcW.value);
            const h = parseFloat(calcH.value);

            if (isNaN(w) || w <= 20 || w > 300) {
                alert("Please enter a valid weight in kg (e.g. 70).");
                return;
            }
            if (isNaN(h) || h <= 50 || h > 250) {
                alert("Please enter a valid height in cm (e.g. 175).");
                return;
            }

            const heightM = h / 100.0;
            const calculatedBmi = (w / (heightM * heightM)).toFixed(1);
            bmiInput.value = calculatedBmi;
            updateBmiBadge(calculatedBmi);
            bmiInput.focus();
        });
    }

    // Helper to safely set dropdown/slider values
    function setFieldValue(id, val) {
        const el = document.getElementById(id);
        if (el) {
            el.value = val;
            el.dispatchEvent(new Event("change"));
            el.dispatchEvent(new Event("input"));
        }
    }

    // 1. Fill Healthy Profile (Low Risk)
    const btnHealthy = document.getElementById("btnFillHealthy");
    if (btnHealthy) {
        btnHealthy.addEventListener("click", function () {
            setFieldValue("Age", "3");           // 30-34
            setFieldValue("Sex", "0");           // Female
            setFieldValue("Education", "6");     // College Grad
            setFieldValue("Income", "8");        // $75k+
            setFieldValue("BMI", "22.5");        // Normal
            setFieldValue("GenHlth", "1");       // Excellent
            setFieldValue("HighBP", "0");        // No
            setFieldValue("HighChol", "0");      // No
            setFieldValue("CholCheck", "1");     // Yes
            setFieldValue("Stroke", "0");        // No
            setFieldValue("HeartDiseaseorAttack", "0"); // No
            setFieldValue("DiffWalk", "0");      // No
            setFieldValue("Smoker", "0");        // No
            setFieldValue("PhysActivity", "1");  // Yes
            setFieldValue("Fruits", "1");        // Yes
            setFieldValue("Veggies", "1");       // Yes
            setFieldValue("HvyAlcoholConsump", "0"); // No
            setFieldValue("AnyHealthcare", "1"); // Yes
            setFieldValue("NoDocbcCost", "0");   // No
            setFieldValue("MentHlth", "0");      // 0 days
            setFieldValue("PhysHlth", "0");      // 0 days
        });
    }

    // 2. Fill Moderate / Borderline Profile
    const btnElevated = document.getElementById("btnFillElevated");
    if (btnElevated) {
        btnElevated.addEventListener("click", function () {
            setFieldValue("Age", "7");           // 50-54
            setFieldValue("Sex", "1");           // Male
            setFieldValue("Education", "4");     // High school
            setFieldValue("Income", "5");        // $25k-$35k
            setFieldValue("BMI", "28.4");        // Overweight
            setFieldValue("GenHlth", "3");       // Good
            setFieldValue("HighBP", "0");        // No
            setFieldValue("HighChol", "1");      // Yes
            setFieldValue("CholCheck", "1");     // Yes
            setFieldValue("Stroke", "0");        // No
            setFieldValue("HeartDiseaseorAttack", "0"); // No
            setFieldValue("DiffWalk", "0");      // No
            setFieldValue("Smoker", "1");        // Smoker
            setFieldValue("PhysActivity", "1");  // Yes
            setFieldValue("Fruits", "1");        // Yes
            setFieldValue("Veggies", "0");       // No
            setFieldValue("HvyAlcoholConsump", "0"); // No
            setFieldValue("AnyHealthcare", "1"); // Yes
            setFieldValue("NoDocbcCost", "0");   // No
            setFieldValue("MentHlth", "4");      // 4 days
            setFieldValue("PhysHlth", "3");      // 3 days
        });
    }

    // 3. Fill High Risk Profile (Alert)
    const btnHighRisk = document.getElementById("btnFillHighRisk");
    if (btnHighRisk) {
        btnHighRisk.addEventListener("click", function () {
            setFieldValue("Age", "10");          // 65-69
            setFieldValue("Sex", "1");           // Male
            setFieldValue("Education", "3");     // Some high school
            setFieldValue("Income", "3");        // $15k-$20k
            setFieldValue("BMI", "35.2");        // Obese
            setFieldValue("GenHlth", "5");       // Poor
            setFieldValue("HighBP", "1");        // Yes
            setFieldValue("HighChol", "1");      // Yes
            setFieldValue("CholCheck", "1");     // Yes
            setFieldValue("Stroke", "0");        // No
            setFieldValue("HeartDiseaseorAttack", "1"); // Yes
            setFieldValue("DiffWalk", "1");      // Yes
            setFieldValue("Smoker", "1");        // Yes
            setFieldValue("PhysActivity", "0");  // Sedentary
            setFieldValue("Fruits", "0");        // No
            setFieldValue("Veggies", "1");       // Yes
            setFieldValue("HvyAlcoholConsump", "0"); // No
            setFieldValue("AnyHealthcare", "1"); // Yes
            setFieldValue("NoDocbcCost", "1");   // Delayed care
            setFieldValue("MentHlth", "12");     // 12 days
            setFieldValue("PhysHlth", "20");     // 20 days
        });
    }

    // 4. Reset Form
    const btnReset = document.getElementById("btnResetForm");
    const form = document.getElementById("assessmentForm");
    if (btnReset && form) {
        btnReset.addEventListener("click", function () {
            form.reset();
            updateBmiBadge("");
            if (mentVal) mentVal.textContent = "0 days";
            if (physVal) physVal.textContent = "0 days";
        });
    }

    // Form Submission Validation
    if (form) {
        form.addEventListener("submit", function (e) {
            const bmi = parseFloat(bmiInput.value);
            if (isNaN(bmi) || bmi < 10.0 || bmi > 98.0) {
                e.preventDefault();
                alert("Please enter a valid BMI between 10.0 and 98.0 kg/m².");
                bmiInput.focus();
                return;
            }
        });
    }
});
