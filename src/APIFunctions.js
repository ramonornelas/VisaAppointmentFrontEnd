import { BASE_URL } from './config.js';

const UserDetails = async (fastVisa_userid) => {
  try {
    const response = await fetch(`${BASE_URL}/users/${fastVisa_userid}`, {
      method: 'GET',
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
    });

    if (response.status === 200) {
      return await response.json();
    } else {
      throw new Error('Failed to fetch user data');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

const ApplicantSearch = async (fastVisa_userid) => {
  const requestBody = { fastVisa_userid };
  try {
    const response = await fetch(`${BASE_URL}/applicants/search`, {
      method: 'POST',
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 200) {
      return await response.json();
    } else {
      throw new Error('Failed to fetch applicant data');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

const ApplicantDetails = async (applicant_userid) => {
  try {
    const response = await fetch(`${BASE_URL}/applicants/${applicant_userid}`, {
      method: 'GET',
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
    });

    if (response.status === 200) {
      return await response.json();
    } else {
      throw new Error('Failed to fetch applicant data');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

const ApplicantUpdate = async (applicant_userid, requestBody) => {
  try {
    const response = await fetch(`${BASE_URL}/applicants/${applicant_userid}`, {
      method: 'PUT',
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 200) {
      return await response.json();
    } else {
      throw new Error('Failed to update applicant data');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

const ApplicantDelete = async (applicant_userid) => {
  try {
    const response = await fetch(`${BASE_URL}/applicants/${applicant_userid}`, {
      method: 'DELETE',
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
    });

    if (response.status === 200) {
      return await response.json();
    } else {
      throw new Error('Failed to delete applicant');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

const StartApplicantContainer = async (applicant_userid) => {
  const requestBody = { applicant_id: applicant_userid };
  try {
    const response = await fetch(`${BASE_URL}/applicants/start`, {
      method: 'POST',
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 200) {
      return await response.json();
    } else {
      throw new Error('Failed to start container');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

const StopApplicantContainer = async (applicant_userid) => {
  const requestBody = { applicant_id: applicant_userid };
  try {
    const response = await fetch(`${BASE_URL}/applicants/stop`, {
      method: 'POST',
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 200) {
      return await response.json();
    } else {
      throw new Error('Failed to stop container');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

const GetApplicantPassword = async (applicant_userid) => {
  try {
    const response = await fetch(`${BASE_URL}/applicants/${applicant_userid}/password`, {
      method: 'GET',
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
    });

    if (response.status === 200) {
      return await response.json();
    } else {
      throw new Error('Failed to fetch applicant password');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

export { 
  UserDetails, 
  ApplicantSearch, 
  ApplicantDetails, 
  ApplicantUpdate, 
  StartApplicantContainer, 
  StopApplicantContainer, 
  ApplicantDelete, 
  GetApplicantPassword 
};
