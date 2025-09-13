// src/JobApplicationPosting.jsx
import {useState} from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea'; // <-- Import the Textarea component
import { Input } from '@/components/ui/input'; // Assuming you also want to use shadcn input

const JobApplicationPosting = () => {
    const [company, setCompany] = useState('');
    const [role, setRole] = useState('');
    const [status, setStatus] = useState('');
    const [job_description, setJobDescription] = useState('');
    const [link, setLink] = useState(''); // <-- New state for link
    const [notes, setNotes] = useState(''); // <-- New state for notes

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8000/api/applications', {
                company,
                role,
                status,
                job_description,
                link, // <-- Added new field
                notes  // <-- Added new field
            });
            setCompany('');
            setRole('');
            setStatus('');
            setJobDescription('');
            setLink(''); // <-- Reset state
            setNotes(''); // <-- Reset state
            alert('Application posted successfully!');
        } catch (err) {
            alert('Error posting application: ' + err.message);
        }
    };
    return (
        <div>
            <h2>Post a New Job Application</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Company:</label>
                    <Input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                    />
                </div>
                <div>
                    <label>Role:</label>
                    <Input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    />
                </div>
                <div>
                    <label>Status:</label>
                    <Input
                        type="text"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    />
                </div>
                <div>
                    <label>Job Description:</label>
                    <Textarea // <-- Use the Textarea component here
                        value={job_description}
                        onChange={(e) => setJobDescription(e.target.value)}
                    />
                </div>
                <div>
                    <label>Link:</label>
                    <Input // <-- New input for link
                        type="text"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                    />
                </div>
                <div>
                    <label>Notes:</label>
                    <Textarea // <-- New textarea for notes
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
                <Button type="submit">Submit</Button>
            </form>
        </div>
    );
};

export default JobApplicationPosting;