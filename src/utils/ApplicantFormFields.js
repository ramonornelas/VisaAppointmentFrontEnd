// src/utils/ApplicantFormFields.js
// Shared form field components for applicant forms
import React from 'react';

export function NameField({ value, onChange, error }) {
  return (
    <div className="form-field">
      <label htmlFor="name">Name: <span style={{ color: 'red' }}>*</span></label>
      <input
        type="text"
        id="name"
        name="name"
        value={value}
        onChange={onChange}
        style={{ borderColor: error ? 'red' : '', width: '350px' }}
        required
      />
      {error && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{error}</div>}
    </div>
  );
}

export function EmailField({ value, onChange, error }) {
  return (
    <div className="form-field">
      <label htmlFor="email">Visa Appointment System Email: <span style={{ color: 'red' }}>*</span></label>
      <input
        type="email"
        id="email"
        name="email"
        value={value}
        onChange={onChange}
        style={{ borderColor: error ? 'red' : '', width: '250px' }}
        required
      />
      {error && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{error}</div>}
    </div>
  );
}

export function PasswordField({ value, onChange, error }) {
  return (
    <div className="form-field">
      <label htmlFor="password">Visa Appointment System Password: <span style={{ color: 'red' }}>*</span></label>
      <input
        type="password"
        id="password"
        name="password"
        value={value}
        onChange={onChange}
        style={{ borderColor: error ? 'red' : '' }}
        required
      />
      {error && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{error}</div>}
    </div>
  );
}

export function ScheduleIdField({ value, onChange, error, disabled, style }) {
  return (
    <div className="form-field">
      <label htmlFor="scheduleId">Schedule ID: <span style={{ color: 'red' }}>*</span></label>
      <input
        type="text"
        id="scheduleId"
        name="scheduleId"
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{ borderColor: error ? 'red' : '', width: '150px', ...style }}
        required
        placeholder={disabled ? "Auto-filled after authentication" : ""}
      />
      {error && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{error}</div>}
      {disabled && (
        <small style={{ color: '#666', fontSize: '12px', marginTop: '2px', display: 'block' }}>
          This field is automatically filled after authenticating with Visa Appointment System
        </small>
      )}
    </div>
  );
}

export function NumberOfApplicantsField({ value, onChange, error, disabled, style }) {
  return (
    <div className="form-field">
      <label htmlFor="numberofapplicants">Number of Applicants: <span style={{ color: 'red' }}>*</span></label>
      <input
        type="number"
        id="numberofapplicants"
        name="numberofapplicants"
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{ borderColor: error ? 'red' : '', width: '80px', ...style }}
        required
      />
      {error && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{error}</div>}
      {disabled && (
        <small style={{ color: '#666', fontSize: '12px', marginTop: '2px', display: 'block' }}>
          This field is automatically filled after authenticating with AIS
        </small>
      )}
    </div>
  );
}
