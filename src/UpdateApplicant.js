
import React, { useState, useEffect } from 'react';
import { ApplicantUpdate } from './APIFunctions';
import { ALL_CITIES } from './utils/cities';
import { NameField, EmailField, ScheduleIdField, NumberOfApplicantsField } from './utils/ApplicantFormFields';
import { useMemo } from 'react';


const UpdateApplicant = ({ data, setIsEditing }) => {
  const [formData, setFormData] = useState(data || {});
  const [cityError, setCityError] = useState('');
  const [showStartDate, setShowStartDate] = useState(true);
  const [showStartDays, setShowStartDays] = useState(false);
  const disabledFields = ['fastVisa_username', 'fastVisa_userid', 'ais_username', 'ais_password', 'creation_datetime', 'id', 'container_start_datetime', 'container_id', 'search_status'];

  // Get country code from sessionStorage
  const countryCode = sessionStorage.getItem("country_code");
  const CITIES = useMemo(() => ALL_CITIES[countryCode] || [], [countryCode]);

  useEffect(() => {
    if (formData.target_start_mode) {
      const startDateDisabled = formData.target_start_mode === 'days';
      setShowStartDate(!startDateDisabled);
      setShowStartDays(startDateDisabled);
    }
  }, [formData.target_start_mode]);

  // Auto-select and disable city if only one is available
  useEffect(() => {
    if (CITIES.length === 1) {
      setFormData(prev => ({
        ...prev,
        target_city_codes: CITIES[0].city_code
      }));
    }
  }, [CITIES]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    if (name === 'target_start_mode') {
      const startDateDisabled = value === 'days';
      setShowStartDate(!startDateDisabled);
      setShowStartDays(startDateDisabled);
      setFormData(prevState => ({
        ...prevState,
        [name]: value,
      }));
    } else {
      const newValue = type === 'checkbox' ? checked : value;
      setFormData({
        ...formData,
        [name]: newValue,
      });
    }
  };

  // Updated city code handler to match RegisterApplicant.js
  const handleCityCodeChange = (e) => {
    const value = e.target.value;
    const cityCodes = formData.target_city_codes || '';
    if (cityCodes.split(',').includes(value)) {
      setFormData(prevState => ({
        ...prevState,
        target_city_codes: cityCodes.split(',').filter((code) => code !== value && code !== '').join(',')
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
    setCityError('');
    // Require at least one city if more than one is available
    if (CITIES.length > 1) {
      const selectedCities = (formData.target_city_codes || '').split(',').filter(Boolean);
      if (selectedCities.length === 0) {
        setCityError('Please select at least one city.');
        return;
      }
    }
    const filteredData = Object.keys(formData)
      .filter(key => !disabledFields.includes(key))
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
        <EmailField value={formData["ais_username"] || ''} onChange={e => setFormData({ ...formData, ais_username: e.target.value })} />
        <ScheduleIdField value={formData["ais_schedule_id"] || ''} onChange={e => setFormData({ ...formData, ais_schedule_id: e.target.value })} />
        <NameField value={formData["name"] || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
        <NumberOfApplicantsField value={formData["number_of_applicants"] || ''} onChange={e => setFormData({ ...formData, number_of_applicants: e.target.value })} />
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
        )}
        {showStartDate && (
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
          {CITIES.length === 1 ? (
            <div className="form-field">
              <input
                type="checkbox"
                id={CITIES[0].city_code}
                value={CITIES[0].city_code}
                checked={true}
                disabled
              />
              <label htmlFor={CITIES[0].city_code}>{CITIES[0].city_name}</label>
            </div>
          ) : (
            CITIES.map((city) => (
              <div key={city.city_code} className="form-field">
                <input
                  type="checkbox"
                  id={city.city_code}
                  value={city.city_code}
                  checked={(formData.target_city_codes || '').split(',').includes(city.city_code)}
                  onChange={handleCityCodeChange}
                />
                <label htmlFor={city.city_code}>{city.city_name}</label>
              </div>
            ))
          )}
          {cityError && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{cityError}</div>}
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
