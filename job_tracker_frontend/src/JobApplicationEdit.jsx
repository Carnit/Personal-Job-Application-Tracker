/// src/JobApplicationEdit.jsx// src/JobApplicationEdit.jsx
import axios from 'axios';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const JobApplicationEdit = ({ application, onUpdate }) => { 
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Initialize formData with a default empty structure or with application data if available
    const [formData, setFormData] = useState(() => {
        if (!application) {
            return null;
        }
        return {
            company: application.company,
            role: application.role,
            status: application.status,
            date_applied: application.date_applied,
            job_description: application.job_description || '',
            link: application.link || '',
            notes: application.notes || ''
        };
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            // ... your API call
            await axios.put(`http://localhost:8000/api/applications/${application.id}`, {
                ...formData,
                date_applied: formData.date_applied
            });
            onUpdate();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // If application is null, render nothing or a message
    if (!application) {
        return null;
    }

    return (
        <div className="p-4 border rounded-md shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Edit Application</h2>
            {error && <div className="text-red-500 mb-2">Error: {error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="company">Company:</Label>
                    <Input id="company" type="text" name="company" value={formData.company} onChange={handleChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="role">Role:</Label>
                    <Input id="role" type="text" name="role" value={formData.role} onChange={handleChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="status">Status:</Label>
                    <Input id="status" type="text" name="status" value={formData.status} onChange={handleChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="date_applied">Date Applied:</Label>
                    <Input id="date_applied" type="date" name="date_applied" value={formData.date_applied.split('T')[0]} onChange={handleChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="job_description">Job Description:</Label>
                    <Textarea id="job_description" name="job_description" value={formData.job_description} onChange={handleChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="link">Link:</Label>
                    <Input id="link" type="text" name="link" value={formData.link} onChange={handleChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="notes">Notes:</Label>
                    <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} />
                </div>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Application'}
                </Button>
            </form>
        </div>
    );
};

export default JobApplicationEdit;