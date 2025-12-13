# Machine Learning & Analytics Guide

Comprehensive guide to the ML model and analytics engine in Job Application Tracker.

## Overview

The application uses scikit-learn to build predictive models that help users understand and improve their job search strategy. The ML component analyzes historical application data to:

- **Predict success probability** for new applications
- **Identify success factors** (which attributes correlate with success)
- **Cluster similar applications** to find patterns
- **Forecast optimal timing** for applications

## ML Pipeline Architecture

```
┌──────────────────────────────────────────────────┐
│        Historical Application Data               │
│  (Status, Stage, Company, Source, Timing)       │
└──────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│        Data Preparation & Feature Engineering   │
│  - Filter applications with clear outcomes      │
│  - Extract numerical features                   │
│  - Encode categorical variables                 │
│  - Scale features                               │
└──────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│        Train/Test Split                         │
│  - 80% training, 20% testing                    │
│  - Stratified sampling                          │
└──────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│        Model Training                           │
│  Random Forest Classifier (100 estimators)      │
└──────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│        Evaluation & Metrics                     │
│  - Accuracy, Precision, Recall, F1, ROC-AUC    │
└──────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────┐
│        Model Persistence                        │
│  - Save as model.pkl with encoders              │
│  - Load on startup for predictions              │
└──────────────────────────────────────────────────┘
```

## Feature Engineering

### Input Features

The model uses 5 key features:

| Feature | Type | Range | Description |
|---------|------|-------|-------------|
| **Days Since Application** | Numerical | 0-180 | Days elapsed since applying |
| **Company Encoded** | Categorical | 0-N | Company identifier (label encoded) |
| **Application Source** | Categorical | 0-5 | LinkedIn, referral, etc. |
| **Day of Week** | Categorical | 0-6 | Monday(0) to Sunday(6) |
| **Hour of Application** | Numerical | 0-23 | Hour of day applied |

### Feature Extraction Example

```python
def get_features_from_application(app, encoders):
    """Extract features from a JobApplication record"""
    
    # 1. Days since application
    days_since = (datetime.utcnow() - app.application_date).days
    
    # 2. Encode company name
    company_encoded = encoders["company"].transform([app.company])[0]
    
    # 3. Encode application source
    source_encoded = encoders["source"].transform([
        app.application_source.value
    ])[0]
    
    # 4. Extract day of week
    day_of_week = app.application_date.weekday()  # 0-6
    
    # 5. Extract hour of application
    hour = app.application_date.hour  # 0-23
    
    return [days_since, company_encoded, source_encoded, day_of_week, hour]
```

## Model Architecture

### Random Forest Classifier

```
Random Forest Configuration:
├── n_estimators: 100 trees
├── max_depth: 10 (control overfitting)
├── min_samples_split: 5
├── min_samples_leaf: 2
└── random_state: 42 (reproducibility)

Output: Binary Classification
├── Class 0: Unsuccessful (rejected)
└── Class 1: Successful (accepted)
```

### Why Random Forest?

1. **Interpretability**: Feature importance easily extracted
2. **Robustness**: Handles non-linear relationships
3. **Efficiency**: Fast training and prediction
4. **Ensemble**: Reduces overfitting through voting
5. **Scalability**: Handles 100+ applications easily

## Training the Model

### Automatic Training

The model is trained on all available historical data:

```python
# Get applications from last 6 months
cutoff_date = datetime.utcnow() - timedelta(days=180)
applications = db.query(JobApplication).filter(
    JobApplication.application_date >= cutoff_date
).all()

# Filter to applications with clear outcomes
labeled_apps = [app for app in applications 
                if app.status in [ACCEPTED, REJECTED]]

# Minimum 10 applications needed for training
if len(labeled_apps) >= 10:
    # Proceed with training
```

### Manual Retraining

Retrain the model with fresh data:

```bash
# From project root directory
python train_model.py

# Output:
# Starting model training...
# Training data prepared: 45 samples, 5 features
# Class distribution: Accepted=18, Rejected=27
# Model Performance:
#   Accuracy:  0.8500
#   Precision: 0.8333
#   Recall:    0.8000
#   F1 Score:  0.8163
#   ROC AUC:   0.8750
# Feature Importance:
#   days_since_application: 0.3200
#   company_encoded: 0.2500
#   source_encoded: 0.1800
#   day_of_week: 0.1200
#   hour_of_application: 0.1100
# Model saved to model.pkl
```

### Training Schedule

For production deployments, consider:

```bash
# Retrain weekly (as a cron job)
0 2 * * 0 cd /app && python train_model.py

# Or monthly
0 3 1 * * cd /app && python train_model.py

# Or on-demand via API endpoint (future)
POST /api/ml/retrain
```

## Evaluation Metrics

### Classification Metrics

**Accuracy**: Overall correctness
```
Accuracy = (TP + TN) / (TP + TN + FP + FN)
Perfect: 1.0 (100%)
Poor: 0.5 (random guessing)
Target: > 0.75
```

**Precision**: Predicted successes that were correct
```
Precision = TP / (TP + FP)
Meaning: "When model predicts success, how often is it right?"
Target: > 0.80
```

**Recall**: Actual successes that model found
```
Recall = TP / (TP + FN)
Meaning: "Of all actual successes, how many did model find?"
Target: > 0.80
```

**F1 Score**: Harmonic mean of precision & recall
```
F1 = 2 × (Precision × Recall) / (Precision + Recall)
Balanced metric: > 0.75 is good
```

**ROC-AUC**: Area Under Receiver Operating Characteristic Curve
```
Measures: Trade-off between true positive rate and false positive rate
Range: 0-1 (0.5 = random, 1.0 = perfect)
Target: > 0.80
```

### Interpretation Example

```
Model Trained on 45 applications:
├── Accuracy: 85%
│   └─ 85% of predictions were correct
├── Precision: 83%
│   └─ When model predicted success, 83% actually succeeded
├── Recall: 80%
│   └─ Of applications that succeeded, model found 80%
├── F1 Score: 0.82
│   └─ Good overall performance
└── ROC-AUC: 0.87
    └─ Model well-calibrated across all thresholds
```

## Feature Importance

The model reveals which factors matter most:

```
Feature Importance Analysis:
├── Days Since Application: 32%
│   └─ Time decay is important (older apps less likely to progress)
├── Company Name: 25%
│   └─ Specific companies have different patterns
├── Application Source: 18%
│   └─ Some sources (referral) more successful than others
├── Day of Week: 12%
│   └─ Slight impact on success based on application timing
└── Hour of Application: 11%
    └─ Morning vs evening application time matters slightly
```

## Predictions

### Getting a Prediction

```bash
curl "http://localhost:8000/api/analytics/predict?company=Google&source=linkedin&day_of_week=2"

Response:
{
  "success_probability": 0.68,
  "confidence": 0.82,
  "recommendations": [
    "Google has a 68% historical success rate",
    "Referrals typically have higher success rates - consider seeking referrals",
    "Follow up within 1-2 weeks after applying"
  ]
}
```

### Interpreting Predictions

**Success Probability** (0-1):
- **< 0.3**: Low success rate
  - Consider: Different companies, sources, or strategy changes
- **0.3-0.5**: Below average
  - Consider: Enhance application materials
- **0.5-0.7**: Average to good
  - Proceed with application
- **> 0.7**: High success rate
  - Priority application, high confidence

**Confidence** (0-1):
- **< 0.3**: Limited historical data
  - Few previous applications to this company
  - Use prediction as general guideline only
- **0.3-0.7**: Moderate confidence
  - Some historical data available
  - Prediction reasonably reliable
- **> 0.7**: High confidence
  - Extensive historical data
  - Trust prediction strongly

### Example Predictions

**Example 1: High Confidence Prediction**
```json
{
  "company": "Microsoft",
  "source": "linkedin",
  "success_probability": 0.72,
  "confidence": 0.91,
  "reasoning": "15 previous applications to Microsoft, 11 successful"
}
```

**Example 2: Low Confidence Prediction**
```json
{
  "company": "Acme Corp",
  "source": "referral",
  "success_probability": 0.65,
  "confidence": 0.25,
  "reasoning": "Only 1 previous application to Acme Corp"
}
```

## Advanced Analytics

### Clustering

Future enhancement: Group similar applications:

```python
from sklearn.cluster import KMeans

# Cluster applications by similarity
kmeans = KMeans(n_clusters=5)
cluster_assignments = kmeans.fit_predict(X_features)

# Analyze successful clusters
for cluster_id in range(5):
    cluster_apps = [app for app, cluster in zip(apps, cluster_assignments)
                   if cluster == cluster_id]
    success_rate = sum(app.status == ACCEPTED for app in cluster_apps)
    print(f"Cluster {cluster_id}: {success_rate}% success rate")
```

### Time Series Forecasting

Future enhancement: Predict application velocity:

```python
from sklearn.linear_model import LinearRegression

# Predict future application volume
X = np.array(range(30)).reshape(-1, 1)  # Days
y = np.array(applications_per_day)      # Volume

model = LinearRegression()
model.fit(X, y)

# Forecast next 30 days
future_dates = np.array(range(30, 60)).reshape(-1, 1)
forecast = model.predict(future_dates)
```

## Analytics Endpoints

### Overview Metrics

```json
GET /api/analytics/overview

Returns:
{
  "total_applications": 50,
  "active_applications": 12,
  "rejection_rate": 48.0,
  "interview_conversion_rate": 28.0,
  "average_response_time_days": 7.5,
  "offers_received": 2,
  "applications_by_stage": {...},
  "applications_by_source": {...},
  "top_rejecting_companies": [...]
}
```

### Rejection Analysis

```json
GET /api/analytics/rejections

Filters out successful applications to show:
- Rejections by pipeline stage
- Rejections by company
- Rejection rate and trends
```

### Time Series

```json
GET /api/analytics/time-series?days=90

Shows daily application and rejection counts
for visualization of trends and patterns
```

## Practical Usage Examples

### Example 1: Optimize Application Timing

**Question**: Should I apply on weekdays or weekends?

**Solution**:
```bash
# Check feature importance
# Find "day_of_week" importance: 12%

# Train model and check patterns
# If coefficient positive for weekday: better results

# Recommendation: Apply on Monday-Thursday, 9-11 AM
```

### Example 2: Identify Best Sources

**Question**: Which application source gives best results?

**Solution**:
```bash
# Run analytics:
GET /api/analytics/overview

applications_by_source:
{
  "linkedin": 20,      # 60% acceptance
  "company_site": 15,  # 40% acceptance
  "referral": 10,      # 80% acceptance
  ...
}

# Recommendation: Focus on referrals (80% success)
```

### Example 3: Company-Specific Predictions

**Question**: What's my success rate with Company X?

**Solution**:
```bash
# Get prediction
POST /api/analytics/predict?company=Google&source=linkedin&day_of_week=2

# Response
{
  "success_probability": 0.72,
  "confidence": 0.91,
  "recommendations": [
    "Google has high success rate (72%)",
    "You've applied 15 times, 11 succeeded",
    "Use referral strategy for best results"
  ]
}

# Recommendation: High confidence prediction, prioritize this application
```

## Model Persistence

### Saving the Model

```python
model_data = {
    "model": trained_model,
    "label_encoders": {
        "company": company_encoder,
        "source": source_encoder
    },
    "feature_columns": ["days_since", "company_encoded", ...],
    "trained_at": datetime.utcnow().isoformat(),
    "metrics": {
        "accuracy": 0.85,
        "precision": 0.83,
        ...
    }
}

with open("model.pkl", "wb") as f:
    pickle.dump(model_data, f)
```

### Loading the Model

```python
with open("model.pkl", "rb") as f:
    model_data = pickle.load(f)

model = model_data["model"]
encoders = model_data["label_encoders"]
features = model_data["feature_columns"]
metrics = model_data["metrics"]
```

## Monitoring Model Performance

### Tracking Metrics Over Time

```python
# Log metrics after each training
metrics_history = [
    {"date": "2025-12-01", "accuracy": 0.82, "recall": 0.78},
    {"date": "2025-12-08", "accuracy": 0.85, "recall": 0.80},
    {"date": "2025-12-15", "accuracy": 0.87, "recall": 0.82},
]

# Model improving with more data - good!
```

### Drift Detection

```python
# If performance drops significantly:
# - Retraining might help
# - Data distribution may have changed
# - Model may be overfitting

if current_accuracy < previous_accuracy * 0.90:
    # Significant drop detected
    logger.warning("Model performance degradation detected")
    # Consider retraining or investigating data
```

## Best Practices

1. **Regular Retraining**: Monthly or after 20+ new applications
2. **Monitor Performance**: Track accuracy trends
3. **Validation**: Test on held-out data before deployment
4. **Feature Engineering**: Add new features as needed
5. **Documentation**: Record model versions and changes
6. **Fallback Strategy**: Provide defaults if model unavailable

## Future Enhancements

- [ ] Multi-class classification (predict specific stage)
- [ ] Deep learning models (neural networks)
- [ ] Explainability (SHAP values)
- [ ] A/B testing different models
- [ ] Real-time model updates
- [ ] Confidence intervals
- [ ] Feature interaction analysis

---

**Last Updated**: December 2025
