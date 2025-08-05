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
        style={{ borderColor: error ? 'red' : '' }}
        required
      />
      {error && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{error}</div>}
    </div>
  );
}

export function EmailField({ value, onChange, error }) {
  return (
    <div className="form-field">
      <label htmlFor="email">AIS Email: <span style={{ color: 'red' }}>*</span></label>
      <input
        type="email"
        id="email"
        name="email"
        value={value}
        onChange={onChange}
        style={{ borderColor: error ? 'red' : '' }}
        required
      />
      {error && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{error}</div>}
    </div>
  );
}

export function PasswordField({ value, onChange, error }) {
  return (
    <div className="form-field">
      <label htmlFor="password">AIS Password: <span style={{ color: 'red' }}>*</span></label>
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

export function ScheduleIdField({ value, onChange, error }) {
  return (
    <div className="form-field">
      <label htmlFor="scheduleId">AIS Schedule ID: <span style={{ color: 'red' }}>*</span></label>
      <input
        type="number"
        id="scheduleId"
        name="scheduleId"
        value={value}
        onChange={onChange}
        style={{ borderColor: error ? 'red' : '' }}
        required
      />
      {error && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{error}</div>}
    </div>
  );
}

export function NumberOfApplicantsField({ value, onChange, error }) {
  return (
    <div className="form-field">
      <label htmlFor="numberofapplicants">Number of Applicants: <span style={{ color: 'red' }}>*</span></label>
      <input
        type="number"
        id="numberofapplicants"
        name="numberofapplicants"
        value={value}
        onChange={onChange}
        style={{ borderColor: error ? 'red' : '' }}
        required
      />
      {error && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{error}</div>}
    </div>
  );
}
