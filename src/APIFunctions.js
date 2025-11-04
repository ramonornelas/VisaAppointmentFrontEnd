import { BASE_URL } from "./config.js";

// Delete user by ID
const deleteUser = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/users/${userId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    if (response.status === 204) {
      // 204 No Content: deletion successful, no body
      return { success: true };
    } else if (response.status === 200) {
      return await response.json();
    } else {
      throw new Error("Failed to delete user");
    }
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error };
  }
};

// Get all users
const getUsers = async () => {
  try {
    const response = await fetch(`${BASE_URL}/users`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    if (response.status === 200) {
      return await response.json();
    } else {
      throw new Error("Failed to fetch users");
    }
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
};

// Get all roles
const getRoles = async () => {
  try {
    const response = await fetch(`${BASE_URL}/roles`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    if (response.status === 200) {
      return await response.json();
    } else {
      throw new Error("Failed to fetch roles");
    }
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
};

// Update user fields
const updateUser = async (id, userData) => {
  try {
    const body = JSON.stringify(userData);
    const response = await fetch(`${BASE_URL}/users/${id}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body,
    });
    if (response.status === 200) {
      return await response.json();
    } else {
      throw new Error("Failed to update user");
    }
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};

const UserDetails = async (fastVisa_userid) => {
  try {
    const response = await fetch(`${BASE_URL}/users/${fastVisa_userid}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (response.status === 200) {
      return await response.json();
    } else {
      throw new Error("Failed to fetch user data");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

const ApplicantSearch = async (fastVisa_userid) => {
  const requestBody = { fastVisa_userid };
  try {
    const response = await fetch(`${BASE_URL}/applicants/search`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 200) {
      return await response.json();
    } else {
      throw new Error("Failed to fetch applicant data");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

const ApplicantDetails = async (applicant_userid) => {
  try {
    const response = await fetch(`${BASE_URL}/applicants/${applicant_userid}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (response.status === 200) {
      return await response.json();
    } else {
      throw new Error("Failed to fetch applicant data");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

const ApplicantUpdate = async (applicant_userid, requestBody) => {
  try {
    const response = await fetch(`${BASE_URL}/applicants/${applicant_userid}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 200) {
      return await response.json();
    } else {
      throw new Error("Failed to update applicant data");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

const ApplicantDelete = async (applicant_userid) => {
  try {
    const response = await fetch(`${BASE_URL}/applicants/${applicant_userid}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (response.status === 204) {
      // 204 No Content: deletion successful, no body
      return { success: true };
    } else if (response.status === 200) {
      return await response.json();
    } else {
      throw new Error("Failed to delete applicant");
    }
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error };
  }
};

const StartApplicantContainer = async (applicant_userid) => {
  const requestBody = { applicant_id: applicant_userid };
  try {
    const response = await fetch(`${BASE_URL}/applicants/start`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 200) {
      return await response.json();
    } else {
      throw new Error("Failed to start container");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

const StopApplicantContainer = async (applicant_userid) => {
  const requestBody = { applicant_id: applicant_userid };
  try {
    const response = await fetch(`${BASE_URL}/applicants/stop`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 200) {
      return await response.json();
    } else {
      throw new Error("Failed to stop container");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

const GetApplicantPassword = async (applicant_userid) => {
  try {
    const response = await fetch(
      `${BASE_URL}/applicants/${applicant_userid}/password`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200) {
      return await response.json();
    } else {
      throw new Error("Failed to fetch applicant password");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};


// Get PayPal config from API Gateway endpoint
const getPayPalConfig = async () => {
  try {
    const response = await fetch(
      `${BASE_URL}/paypal-config`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );
    if (response.status === 200) {
      return await response.json();
    } else {
      throw new Error("Failed to fetch PayPal config");
    }
  } catch (error) {
    console.error("Error fetching PayPal config:", error);
    return null;
  }
};

// Get current USD to MXN exchange rate from open.er-api.com (no access key required)
const getUSDMXNExchangeRate = async () => {
  try {
    const response = await fetch(
      "https://open.er-api.com/v6/latest/USD",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );
    if (response.status === 200) {
      const data = await response.json();
      // data.rates.MXN contains the exchange rate
      return data.rates.MXN;
    } else {
      throw new Error("Failed to fetch exchange rate");
    }
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    return null;
  }
};
// Authenticate AIS credentials and get user info
const authenticateAIS = async ({ username, password, country_code }) => {
  try {
    const response = await fetch(`${BASE_URL}/ais/auth`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password, country_code }),
    });
    if (response.status === 200) {
      // Expected output: { schedule_id, username, country_code }
      return await response.json();
    } else {
      throw new Error("Failed to authenticate AIS credentials");
    }
  } catch (error) {
    console.error("AIS Auth Error:", error);
    return null;
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
  GetApplicantPassword,
  getUsers,
  updateUser,
  getRoles,
  getPayPalConfig,
  deleteUser,
  getUSDMXNExchangeRate,
  authenticateAIS,
};
