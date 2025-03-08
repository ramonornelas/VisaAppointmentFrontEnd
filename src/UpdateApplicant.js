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
    const [showStartDate, setShowStartDate] = useState(true);
    const [showStartDays, setShowStartDays] = useState(false);
    const disabledFields = ['fastVisa_username', 'fastVisa_userid', 'ais_username', 'ais_password', 'creation_datetime', 'id', 'container_start_datetime', 'container_id', 'search_status'];

    useEffect(() => {
        if (formData.target_start_mode) {
          const startDateDisabled = formData.target_start_mode === 'days';
          setShowStartDate(!startDateDisabled);
          setShowStartDays(startDateDisabled);
        }
    }, [formData.target_start_mode]);

    const handleChange = (e) => {
        const { name, type, checked, value } = e.target;
    
        // If target_start_mode is changed, update formData and disable the corresponding field
        if (name === 'target_start_mode') {
            const startDateDisabled = value === 'days';
            setShowStartDate(!startDateDisabled);
            setShowStartDays(startDateDisabled);
            setFormData(prevState => {
                const updatedState = {
                    ...prevState,
                    [name]: value,
                };
                return updatedState;
            });
        } else {
            const newValue = type === 'checkbox' ? checked : value;
            const updatedFormData = {
                ...formData,
                [name]: newValue,
            };
            setFormData(updatedFormData);
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

    return (
        <div className="update-applicant-form">
            <h2>Edit Applicant</h2>
            <form onSubmit={handleSubmit}>
                <button type="submit">Save Changes</button>
                &nbsp;
                <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
                <div style={{ marginBottom: '20px' }}></div>
                <div className="form-field" key={"applicantActive"}>
                    <label htmlFor={"applicant_active"}>Applicant Active</label>
                    &nbsp;
                    <input
                        type="checkbox"
                        id={"applicant_active"}
                        name={"applicant_active"}
                        checked={formData["applicant_active"]}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-field" key={"ais_username"}>
                    <label htmlFor={"ais_username"}>AIS Username</label>
                    &nbsp;
                    <input
                        type="text"
                        id={"ais_username"}
                        name={"ais_username"}
                        value={formData["ais_username"]}
                        onChange={handleChange}
                        style={{ width: '250px'}}
                    />
                </div>
                <div className="form-field" key="ais_schedule_id">
                    <label htmlFor={"ais_schedule_id"}>AIS Schedule ID</label>
                    &nbsp;
                    <input
                        type="text"
                        id={"ais_schedule_id"}
                        name={"ais_schedule_id"}
                        value={formData["ais_schedule_id"]}
                        onChange={handleChange}
                        style={{ width: '70px'}}
                    />
                </div>
                <div className="form-field" key={"name"}>
                    <label htmlFor={"name"}>Name</label>
                    &nbsp;
                    <input
                        type="text"
                        id={"name"}
                        name={"name"}
                        value={formData["name"]}
                        onChange={handleChange}
                        style={{ width: '350px'}}
                    />
                </div>
                <div className="form-field" key={"number_of_applicants"}>
                    <label htmlFor={"number_of_applicants"}>Number of Applicants</label>
                    &nbsp;
                    <input
                        type="number"
                        id={"number_of_applicants"}
                        name={"number_of_applicants"}
                        value={formData["number_of_applicants"]}
                        onChange={handleChange}
                        style={{ width: '50px'}}
                    />
                </div>
                <div className="form-field" key={"target_start_mode"}>
                    <label htmlFor={"target_start_mode"}>Target Start Mode</label>
                    &nbsp;
                    <select
                        id={"target_start_mode"}
                        name={"target_start_mode"}
                        value={formData["target_start_mode"]?.toLowerCase()}
                        onChange={handleChange}
                    >
                        <option value="date">Date</option>
                        <option value="days">Days</option>
                    </select>
                </div>
                {showStartDays && (
                    <>
                        <div className="form-field" key={"target_start_days"}>
                            <label htmlFor={"target_start_days"}>Target Start Days</label>
                            &nbsp;
                            <input
                                type="number"
                                id={"target_start_days"}
                                name={"target_start_days"}
                                value={formData["target_start_days"]}
                                onChange={handleChange}
                                disabled={formData.target_start_mode === 'date'}
                                style={{ width: '50px'}}
                            />
                        </div>
                        </>
                )}
                {showStartDate && (
                    <>
                        <div className="form-field" key={"target_start_date"}>
                            <label htmlFor={"target_start_date"}>Target Start Date</label>
                            &nbsp;
                            <input
                                type="date"
                                id={"target_start_date"}
                                name={"target_start_date"}
                                value={formData["target_start_date"]}
                                onChange={handleChange}
                                disabled={formData.target_start_mode === 'days'}
                            />
                        </div>
                        </>
                )}
                <div className="form-field" key={"target_end_date"}>
                    <label htmlFor={"target_end_date"}>Target End Date</label>
                    &nbsp;
                    <input
                        type="date"
                        id={"target_end_date"}
                        name={"target_end_date"}
                        value={formData["target_end_date"]}
                        onChange={handleChange}
                    />
                </div>
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
                &nbsp;
                <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
            </form>
        </div>
    );
};

export default UpdateApplicant;
