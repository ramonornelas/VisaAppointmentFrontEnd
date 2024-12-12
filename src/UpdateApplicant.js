import React, { useState, useEffect } from 'react';
import { ApplicantUpdate } from './APIFunctions';
import './index.css';

const CITIES = [
    { "city_code": "CJS", "city_name": "Ciudad Juarez" },
    { "city_code": "GDL", "city_name": "Guadalajara" },
    { "city_code": "HMO", "city_name": "Hermosillo" },
    { "city_code": "MAM", "city_name": "Matamoros" },
    { "city_code": "MID", "city_name": "Merida" },
    { "city_code": "MEX", "city_name": "Mexico City" },
    { "city_code": "MTY", "city_name": "Monterrey" },
    { "city_code": "NOG", "city_name": "Nogales" },
    { "city_code": "NLD", "city_name": "Nuevo Laredo" },
    { "city_code": "TIJ", "city_name": "Tijuana" }
];

const UpdateApplicant = ({ data, setIsEditing }) => {
    const [formData, setFormData] = useState(data || {});
    const disabledFields = ['fastVisa_username', 'fastVisa_userid', 'ais_username', 'ais_password', 'creation_datetime', 'id', 'container_start_datetime', 'container_id', 'search_status'];

    useEffect(() => {
        setFormData(data || {});
    }, [data]);

    const handleChange = (e) => {
        const { name, type, checked, value } = e.target;

        // If target_start_mode is changed, update formData and disable the corresponding field
        if (name === 'target_start_mode') {
            const startDateDisabled = value === 'Days';
            setFormData(prevState => ({
                ...prevState,
                [name]: value,
                target_start_date: startDateDisabled ? '' : prevState.target_start_date,
                target_start_days: startDateDisabled ? prevState.target_start_days : ''
            }));
        } else {
            const newValue = type === 'checkbox' ? checked : value;
            setFormData({
                ...formData,
                [name]: newValue,
            });
        }
    };

    const handleCityCodeChange = (e) => {
        const { value } = e.target;
        const cityCodes = formData.target_city_codes || '';
        if (cityCodes.includes(value)) {
            setFormData(prevState => ({
                ...prevState,
                target_city_codes: cityCodes.split(',').filter((code) => code !== value).join(',')
            }));
        } else {
            setFormData(prevState => ({
                ...prevState,
                target_city_codes: cityCodes ? `${cityCodes},${value}` : `${value}`
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const filteredData = Object.keys(formData)
            .filter(key => !disabledFields.includes(key)) // Filter out disabled fields
            .reduce((obj, key) => {
                obj[key] = formData[key];
                return obj;
            }, {});
        try {
            await ApplicantUpdate(formData.id, filteredData);
            setIsEditing(false);
            window.location.reload();
        } catch (error) {
            console.error('Error updating applicant details:', error);
        }
    };

    const renderField = (field) => {
        if (field === 'target_start_mode') {
            return (
                <div className="form-group" key={field}>
                    <label htmlFor={field}>{field}</label>
                    <select
                        id={field}
                        name={field}
                        value={formData[field]?.toLowerCase()}
                        onChange={handleChange}
                    >
                        <option value="date">Date</option>
                        <option value="days">Days</option>
                    </select>
                </div>
            );
        } else if (field === 'target_start_date') {
            return (
                <div className="form-group" key={field}>
                    <label htmlFor={field}>{field}</label>
                    <input
                        type="date"
                        id={field}
                        name={field}
                        value={formData[field]}
                        onChange={handleChange}
                        disabled={formData.target_start_mode === 'Days'}
                    />
                </div>
            );
        } else if (field === 'target_start_days') {
            return (
                <div className="form-group" key={field}>
                    <label htmlFor={field}>{field}</label>
                    <input
                        type="text"
                        id={field}
                        name={field}
                        value={formData[field]}
                        onChange={handleChange}
                        disabled={formData.target_start_mode === 'Date'}
                    />
                </div>
            );
        } else if (disabledFields.includes(field)) {
            return (
                <div className="form-group" key={field}>
                    <label htmlFor={field}>{field}</label>
                    <input
                        type="text"
                        id={field}
                        name={field}
                        value={formData[field]}
                        disabled // Always disabled for permanent disabled fields
                    />
                </div>
            );
        } else if (field.toLowerCase().includes('date')) { // Check if the field contains "date" in its name
            return (
                <div className="form-group" key={field}>
                    <label htmlFor={field}>{field}</label>
                    <input
                        type="date"
                        id={field}
                        name={field}
                        value={formData[field]}
                        onChange={handleChange}
                    />
                </div>
            );
        } else if (typeof formData[field] === 'boolean') {
            return (
                <div className="form-group" key={field}>
                    <label htmlFor={field}>{field}</label>
                    <input
                        type="checkbox"
                        id={field}
                        name={field}
                        checked={formData[field]}
                        onChange={handleChange}
                    />
                </div>
            );
        } else {
            return (
                <div className="form-group" key={field}>
                    <label htmlFor={field}>{field}</label>
                    <input
                        type="text"
                        id={field}
                        name={field}
                        value={formData[field]}
                        onChange={handleChange}
                    />
                </div>
            );
        }
    };

    return (
        <div className="update-applicant-form">
            <h2>Edit Applicant</h2>
            <form onSubmit={handleSubmit}>
                {Object.keys(formData).map(field => renderField(field))}
                <div>
                    <h3>Target Cities</h3>
                    {CITIES.map((city) => (
                        <div key={city.city_code}>
                            <input
                                type="checkbox"
                                id={city.city_code}
                                value={city.city_code}
                                checked={(formData.target_city_codes || '').split(',').includes(city.city_code)}
                                onChange={handleCityCodeChange}
                            />
                            <label htmlFor={city.city_code}>{city.city_name}</label>
                        </div>
                    ))}
                </div>
                <div style={{ marginBottom: '20px' }}></div>
                <button type="submit">Save Changes</button>
                <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
            </form>
        </div>
    );
};

export default UpdateApplicant;
