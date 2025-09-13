// JobApplicationList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import JobApplicationEdit from './JobApplicationEdit';

const JobApplicationList = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingApplication, setEditingApplication] = useState(null);

    const handleDelete = async (id) => {
        const userConfirmed = window.confirm("Are you sure you want to delete this application?");
        if (userConfirmed) {
            try {
                await axios.delete(`http://localhost:8000/api/applications/${id}`);
                setApplications(applications.filter(app => app.id !== id));
            } catch (err) {
                setError(err.message);
            }
        }
    };

    const handleUpdate = () => {
        fetchApplications();
        setEditingApplication(null); // Clear the editing state after update
    };

    const fetchApplications = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/applications');
            setApplications(response.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    if (loading) return <div>Loading applications...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h2>Job Applications</h2>
            <ul>
                {applications.map(app => (
                    <li key={app.id}>
                        <strong>{app.company}</strong> - {app.role} ({app.status})
                        <Button
                            onClick={() => handleDelete(app.id)}
                            variant="destructive"
                            style={{ marginLeft: '1rem' }}
                        >
                            Delete
                        </Button>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    onClick={() => setEditingApplication(app)}
                                    variant="outline"
                                    style={{ marginLeft: '0.5rem' }}
                                >
                                    Edit
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Application</DialogTitle>
                                </DialogHeader>
                                {editingApplication && (
                                    <JobApplicationEdit application={editingApplication} onUpdate={handleUpdate} />
                                )}
                            </DialogContent>
                        </Dialog>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default JobApplicationList;