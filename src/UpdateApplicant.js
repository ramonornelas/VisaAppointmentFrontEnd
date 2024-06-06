import React, { useState } from 'react';
import { ApplicantUpdate } from './APIFunctions';
import './index.css';

const ApplicantUserId = sessionStorage.getItem("applicant_userid");

const UpdateApplicant = ({ data, setIsEditing }) => {
    const [formData, setFormData] = useState(data || {});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const excludedFields = ['fastVisa_username', 'fastVisa_userid', 'ais_username', 'ais_password', 'creation_datetime', 'id', 'container_start_datetime', 'container_id', 'search_status'];
        const filteredData = Object.keys(formData)
            .filter(key => !excludedFields.includes(key))
            .reduce((obj, key) => {
                obj[key] = formData[key];
                return obj;
            }, {});
        try {
            await ApplicantUpdate(ApplicantUserId, filteredData);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating applicant details:', error);
        }
    };

    return (
        <div className="update-applicant-form">
            <h2>Edit Applicant</h2>
            <form onSubmit={handleSubmit}>
                {Object.keys(formData).map((field) => (
                    <div key={field} className="form-group">
                        <label htmlFor={field}>{field}</label>
                        <input
                            type="text"
                            id={field}
                            name={field}
                            value={formData[field]}
                            onChange={handleChange}
                            disabled={['fastVisa_username', 'fastVisa_userid', 'ais_username', 'ais_password', 'creation_datetime', 'id', 'container_start_datetime', 'container_id', 'search_status' ].includes(field)} // Disable editing of excluded fields
                        />
                    </div>
                ))}
                <button type="submit">Save Changes</button>
                <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
            </form>
        </div>
    );
};

export default UpdateApplicant;
