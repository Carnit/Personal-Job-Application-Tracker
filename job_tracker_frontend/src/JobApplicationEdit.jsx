// src/JobApplicationEdit.jsx
import React, { useState } from 'react';
import axios from 'axios';
import JobApplicationForm from './JobApplicationForm'; // <-- Import the reusable form component

const JobApplicationEdit = ({ application, onUpdate, onClose }) => {
    const [error, setError] = useState(null);
    const [setLoading] = useState(false); // 'loading' is assigned a value but never used.

    // This function handles the PUT request from the form
    const handleSubmit = async (formData) => {
        setLoading(true);
        setError(null);
        try {
            await axios.put(`http://localhost:8000/api/applications/${application.id}`, {
                ...formData,
                date_applied: formData.date_applied // Align the date key for backend
            });
            onUpdate(); // Notify parent to refresh the list
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {error && <div className="text-red-500 mb-2">Error: {error}</div>}
            <JobApplicationForm
                initialData={application} // Pass the application data to the form
                onSubmit={handleSubmit} // Pass the handleSubmit function to the form
                onClose={onClose} // Pass the onClose function to the form
            />
        </div>
    );
};

export default JobApplicationEdit;