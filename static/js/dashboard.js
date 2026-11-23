/**
 * DiabetesCare AI - Interactive Dashboard Script (Chart.js)
 */

document.addEventListener("DOMContentLoaded", function () {
    // 1. Tab Switching
    const tabs = document.querySelectorAll(".dash-tab");
    const panes = document.querySelectorAll(".tab-pane");

    tabs.forEach(tab => {
        tab.addEventListener("click", function () {
            const targetId = this.getAttribute("data-tab");
            tabs.forEach(t => t.classList.remove("active"));
            panes.forEach(p => p.classList.remove("active"));

            this.classList.add("active");
            const targetPane = document.getElementById(targetId);
            if (targetPane) {
                targetPane.classList.add("active");
            }
        });
    });

    // 2. Fetch Verified Analytics Data and Render Charts
    fetch("/api/analytics-data")
        .then(response => response.json())
        .then(data => {
            renderTargetDistribution(data.target_distribution);
            renderAgePrevalence(data.age_distribution);
            renderHealthFactors(data.health_indicators);
            renderGenHealth(data.gen_health);
            renderModelComparison(data.model_comparison);
            renderFeatureImportance(data.feature_importance);
            renderConfusionMatrix(data.confusion_matrix_best, "0_43");
            setupMatrixToggle(data.confusion_matrix_best);
        })
        .catch(err => {
            console.error("Failed to load analytics data:", err);
        });

    // ----------------- CHARTS IMPLEMENTATION -----------------

    // Chart 1: Target Distribution (Donut)
    function renderTargetDistribution(targetData) {
        const ctx = document.getElementById("targetDistChart");
        if (!ctx) return;

        new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: targetData.labels,
                datasets: [{
                    data: targetData.counts,
                    backgroundColor: ["#2563eb", "#f97316"],
                    borderWidth: 2,
                    borderColor: "#ffffff"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "bottom" },
                    tooltip: {
                        callbacks: {
                            label: function (ctx) {
                                const total = targetData.counts[0] + targetData.counts[1];
                                const val = ctx.raw;
                                const pct = ((val / total) * 100).toFixed(1);
                                return `${ctx.label}: ${val.toLocaleString()} patients (${pct}%)`;
                            }
                        }
                    }
                },
                cutout: "68%"
            }
        });
    }

    // Chart 2: Age vs Prevalence (Bar + Line)
    function renderAgePrevalence(ageData) {
        const ctx = document.getElementById("agePrevalenceChart");
        if (!ctx) return;

        new Chart(ctx, {
            type: "bar",
            data: {
                labels: ageData.categories,
                datasets: [
                    {
                        type: "line",
                        label: "Diabetes Prevalence (%)",
                        data: ageData.prevalence,
                        borderColor: "#dc2626",
                        backgroundColor: "#dc2626",
                        borderWidth: 2.5,
                        pointRadius: 4,
                        yAxisID: "yRate"
                    },
                    {
                        type: "bar",
                        label: "Surveyed Participant Count",
                        data: ageData.counts,
                        backgroundColor: "rgba(37, 99, 235, 0.2)",
                        borderColor: "#2563eb",
                        borderWidth: 1,
                        borderRadius: 4,
                        yAxisID: "yCount"
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    yRate: {
                        type: "linear",
                        position: "left",
                        title: { display: true, text: "Prevalence (%)" },
                        min: 0,
                        max: 25
                    },
                    yCount: {
                        type: "linear",
                        position: "right",
                        grid: { drawOnChartArea: false },
                        title: { display: true, text: "Participant Count" }
                    }
                },
                plugins: {
                    legend: { position: "bottom" }
                }
            }
        });
    }

    // Chart 3: Key Health Factors Comparison
    function renderHealthFactors(factorsData) {
        const ctx = document.getElementById("healthFactorsChart");
        if (!ctx) return;

        new Chart(ctx, {
            type: "bar",
            data: {
                labels: factorsData.labels,
                datasets: [
                    {
                        label: "With Condition / Indicator",
                        data: factorsData.with_condition,
                        backgroundColor: "#f97316",
                        borderRadius: 4
                    },
                    {
                        label: "Without Condition / Indicator",
                        data: factorsData.without_condition,
                        backgroundColor: "#3b82f6",
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: "Diabetes Rate (%)" }
                    }
                },
                plugins: {
                    legend: { position: "bottom" },
                    tooltip: {
                        callbacks: {
                            label: function (ctx) {
                                return `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Chart 4: General Health vs Prevalence
    function renderGenHealth(genData) {
        const ctx = document.getElementById("genHealthChart");
        if (!ctx) return;

        new Chart(ctx, {
            type: "bar",
            data: {
                labels: genData.labels,
                datasets: [{
                    label: "Diabetes Prevalence (%)",
                    data: genData.prevalence,
                    backgroundColor: [
                        "#10b981", "#34d399", "#f59e0b", "#f97316", "#ef4444"
                    ],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 42,
                        title: { display: true, text: "Diabetes Rate (%)" }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (ctx) {
                                return `Diabetes Rate: ${ctx.raw.toFixed(1)}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Chart 5: Multi-Model Evaluation Comparison
    function renderModelComparison(modelsData) {
        const ctx = document.getElementById("modelComparisonChart");
        if (!ctx) return;

        const labels = modelsData.map(m => m.model);
        const recallData = modelsData.map(m => (m.recall * 100).toFixed(1));
        const f2Data = modelsData.map(m => (m.f2 * 100).toFixed(1));
        const rocAucData = modelsData.map(m => (m.roc_auc * 100).toFixed(1));
        const prAucData = modelsData.map(m => (m.pr_auc * 100).toFixed(1));
        const accData = modelsData.map(m => (m.accuracy * 100).toFixed(1));

        new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [
                    { label: "Recall (Sensitivity %)", data: recallData, backgroundColor: "#dc2626" },
                    { label: "F2-Score (%)", data: f2Data, backgroundColor: "#059669" },
                    { label: "ROC-AUC (%)", data: rocAucData, backgroundColor: "#2563eb" },
                    { label: "PR-AUC (%)", data: prAucData, backgroundColor: "#7c3aed" },
                    { label: "Accuracy (%)", data: accData, backgroundColor: "#94a3b8" }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 30,
                        max: 90,
                        title: { display: true, text: "Score (%)" }
                    }
                },
                plugins: {
                    legend: { position: "bottom" }
                }
            }
        });
    }

    // Chart 6: Feature Importance (Horizontal Bar)
    function renderFeatureImportance(featData) {
        const ctx = document.getElementById("featureImportanceChart");
        if (!ctx) return;

        new Chart(ctx, {
            type: "bar",
            data: {
                labels: featData.features,
                datasets: [{
                    label: "Mean ROC-AUC Drop When Shuffled",
                    data: featData.scores,
                    backgroundColor: "rgba(37, 99, 235, 0.8)",
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true,
                        title: { display: true, text: "Permutation Importance (AUC Drop)" }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // ----------------- CONFUSION MATRIX TOGGLE -----------------
    function renderConfusionMatrix(matrixData, thresholdKey) {
        const grid = document.getElementById("matrixGrid");
        const metricsList = document.getElementById("matrixMetricsList");
        if (!grid || !metricsList) return;

        const d = thresholdKey === "0_43" ? matrixData.threshold_0_43 : matrixData.threshold_0_50;
        const total = d.tp + d.fp + d.tn + d.fn;

        grid.innerHTML = `
            <div class="matrix-cell cell-tp">
                <span class="cell-title">True Positives (Caught)</span>
                <span class="cell-num">${d.tp.toLocaleString()}</span>
                <span class="cell-pct">${((d.tp / total) * 100).toFixed(1)}% of total</span>
            </div>
            <div class="matrix-cell cell-fn">
                <span class="cell-title">False Negatives (Missed)</span>
                <span class="cell-num">${d.fn.toLocaleString()}</span>
                <span class="cell-pct">${((d.fn / total) * 100).toFixed(1)}% of total</span>
            </div>
            <div class="matrix-cell cell-fp">
                <span class="cell-title">False Positives (Alerts)</span>
                <span class="cell-num">${d.fp.toLocaleString()}</span>
                <span class="cell-pct">${((d.fp / total) * 100).toFixed(1)}% of total</span>
            </div>
            <div class="matrix-cell cell-tn">
                <span class="cell-title">True Negatives (Cleared)</span>
                <span class="cell-num">${d.tn.toLocaleString()}</span>
                <span class="cell-pct">${((d.tn / total) * 100).toFixed(1)}% of total</span>
            </div>
        `;

        metricsList.innerHTML = `
            <li><span>Clinical Sensitivity (Recall):</span> <strong>${d.recall.toFixed(2)}%</strong></li>
            <li><span>Positive Predictive Value (Precision):</span> <strong>${d.precision.toFixed(2)}%</strong></li>
            <li><span>Overall Test Accuracy:</span> <strong>${d.accuracy.toFixed(2)}%</strong></li>
            <li><span>Total Diabetic Patients Detected:</span> <strong>${d.tp.toLocaleString()} / ${(d.tp + d.fn).toLocaleString()}</strong></li>
            <li><span>Undetected Diabetic Patients:</span> <strong style="color: #dc2626;">${d.fn.toLocaleString()}</strong></li>
        `;
    }

    function setupMatrixToggle(matrixData) {
        const btnTuned = document.getElementById("btnThreshTuned");
        const btnDefault = document.getElementById("btnThreshDefault");

        if (btnTuned && btnDefault) {
            btnTuned.addEventListener("click", function () {
                btnTuned.classList.add("active");
                btnDefault.classList.remove("active");
                renderConfusionMatrix(matrixData, "0_43");
            });

            btnDefault.addEventListener("click", function () {
                btnDefault.classList.add("active");
                btnTuned.classList.remove("active");
                renderConfusionMatrix(matrixData, "0_50");
            });
        }
    }
});
