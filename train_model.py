"""
Machine learning model trainer for job application success prediction.

This script trains a scikit-learn model to predict the success likelihood
of job applications based on historical data.
"""

import pickle
import logging
from datetime import datetime, timedelta
from typing import Tuple

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
)
from sqlalchemy.orm import Session

from database import (
    SessionLocal,
    JobApplication,
    ApplicationStatus,
    ApplicationStage,
    ApplicationSource,
)

logger = logging.getLogger(__name__)

MODEL_PATH = "model.pkl"
FEATURE_COLUMNS = [
    "days_since_application",
    "company_encoded",
    "source_encoded",
    "day_of_week",
    "hour_of_application",
]


def get_features_from_application(app: JobApplication, label_encoders: dict) -> list:
    """
    Extract features from a job application record.

    Args:
        app: JobApplication instance
        label_encoders: Dictionary of fitted label encoders

    Returns:
        List of feature values
    """
    # Days since application
    days_since = (datetime.utcnow() - app.application_date).days

    # Encode categorical variables
    company_encoded = label_encoders["company"].transform([app.company])[0]
    source_encoded = label_encoders["source"].transform([app.application_source.value])[
        0
    ]

    # Day of week (0=Monday, 6=Sunday)
    day_of_week = app.application_date.weekday()

    # Hour of application
    hour_of_application = app.application_date.hour

    return [
        days_since,
        company_encoded,
        source_encoded,
        day_of_week,
        hour_of_application,
    ]


def prepare_training_data(db: Session) -> Tuple[np.ndarray, np.ndarray, dict]:
    """
    Prepare training data from database.

    Args:
        db: Database session

    Returns:
        Tuple of (features, labels, label_encoders)
    """
    # Get all applications from last 6 months
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    applications = (
        db.query(JobApplication)
        .filter(JobApplication.application_date >= six_months_ago)
        .all()
    )

    if len(applications) < 10:
        logger.warning(f"Insufficient training data: {len(applications)} applications")
        return None, None, None

    # Prepare label encoders
    companies = [app.company for app in applications]
    sources = [app.application_source.value for app in applications]

    label_encoders = {
        "company": LabelEncoder(),
        "source": LabelEncoder(),
    }
    label_encoders["company"].fit(companies)
    label_encoders["source"].fit(sources)

    # Extract features and labels
    X = []
    y = []

    for app in applications:
        # Only include applications with clear outcomes
        if app.status in [ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED]:
            features = get_features_from_application(app, label_encoders)
            X.append(features)

            # Label: 1 for successful (accepted), 0 for unsuccessful (rejected)
            label = 1 if app.status == ApplicationStatus.ACCEPTED else 0
            y.append(label)

    if len(X) < 10:
        logger.warning(f"Insufficient labeled data: {len(X)} samples")
        return None, None, None

    X = np.array(X)
    y = np.array(y)

    logger.info(f"Training data prepared: {len(X)} samples, {X.shape[1]} features")
    logger.info(f"Class distribution: Accepted={sum(y)}, Rejected={len(y) - sum(y)}")

    return X, y, label_encoders


def train_model(
    X: np.ndarray, y: np.ndarray, label_encoders: dict
) -> RandomForestClassifier:
    """
    Train a Random Forest model for success prediction.

    Args:
        X: Feature matrix
        y: Label vector
        label_encoders: Dictionary of fitted label encoders

    Returns:
        Trained model
    """
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Train model
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )

    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_pred_proba)

    logger.info("Model Performance:")
    logger.info(f"  Accuracy:  {accuracy:.4f}")
    logger.info(f"  Precision: {precision:.4f}")
    logger.info(f"  Recall:    {recall:.4f}")
    logger.info(f"  F1 Score:  {f1:.4f}")
    logger.info(f"  ROC AUC:   {roc_auc:.4f}")

    # Feature importance
    feature_importance = pd.DataFrame(
        {
            "feature": FEATURE_COLUMNS,
            "importance": model.feature_importances_,
        }
    ).sort_values("importance", ascending=False)

    logger.info("Feature Importance:")
    for _, row in feature_importance.iterrows():
        logger.info(f"  {row['feature']}: {row['importance']:.4f}")

    return model


def save_model(model: RandomForestClassifier, label_encoders: dict) -> None:
    """
    Save trained model and encoders to disk.

    Args:
        model: Trained model
        label_encoders: Dictionary of fitted label encoders
    """
    model_data = {
        "model": model,
        "label_encoders": label_encoders,
        "feature_columns": FEATURE_COLUMNS,
        "trained_at": datetime.utcnow().isoformat(),
    }

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model_data, f)

    logger.info(f"Model saved to {MODEL_PATH}")


def train_and_save_model() -> bool:
    """
    Main function to train and save the model.

    Returns:
        True if successful, False otherwise
    """
    db = SessionLocal()

    try:
        logger.info("Starting model training...")

        # Prepare data
        X, y, label_encoders = prepare_training_data(db)

        if X is None:
            logger.warning("Could not prepare training data")
            return False

        # Train model
        model = train_model(X, y, label_encoders)

        # Save model
        save_model(model, label_encoders)

        logger.info("Model training completed successfully")
        return True

    except Exception as e:
        logger.error(f"Error during model training: {str(e)}")
        return False

    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    success = train_and_save_model()
    exit(0 if success else 1)
