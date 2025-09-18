// src/JobApplicationForm.jsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const JobApplicationForm = ({ initialData, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
        company: '',
        role: '',
        status: 'Applied',
        job_description: '',
        link: '',
        notes: ''
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                date_applied: initialData.date_applied.split('T')[0] // Format date for input
            });
        }
    }, [initialData]);

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
        await onSubmit(formData);
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" type="text" name="company" value={formData.company} onChange={handleChange} required />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" type="text" name="role" value={formData.role} onChange={handleChange} required />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Input id="status" type="text" name="status" value={formData.status} onChange={handleChange} />
            </div>
            {initialData && (
                <div className="grid gap-2">
                    <Label htmlFor="date_applied">Date Applied</Label>
                    <Input id="date_applied" type="date" name="date_applied" value={formData.date_applied} onChange={handleChange} />
                </div>
            )}
            <div className="grid gap-2">
                <Label htmlFor="job_description">Job Description</Label>
                <Textarea id="job_description" name="job_description" value={formData.job_description} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="link">Link</Label>
                <Input id="link" type="text" name="link" value={formData.link} onChange={handleChange} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} />
            </div>
            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                    {initialData ? (loading ? 'Updating...' : 'Update') : (loading ? 'Creating...' : 'Create')}
                </Button>
            </div>
        </form>
    );
};

export default JobApplicationForm;