import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Banner from "./Banner";
import HamburgerMenu from "./HamburgerMenu";
import Footer from "./Footer";
import {
  ApplicantDetails,
  ApplicantSearch,
  GetApplicantEmail,
  StartApplicantContainer,
  StopApplicantContainer,
} from "./APIFunctions";
import UpdateApplicant from "./UpdateApplicant";
import "./index.css";
import { useAuth } from "./utils/AuthContext";

const ViewApplicant = () => {
  const [data, setData] = useState(null); // Initialize as null to handle object data
  const fastVisaUsername = sessionStorage.getItem("fastVisa_username");
  const fastVisaUserId = sessionStorage.getItem("fastVisa_userid");
  const ApplicantUserId = sessionStorage.getItem("applicant_userid");
  const [isEditing, setIsEditing] = useState(false);
  const excludeFields = ["fastVisa_userid", "ais_password", "id"];
  const navigate = useNavigate();
  const [showAllFields, setShowAllFields] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(false);

  const toggleFieldsVisibility = () => {
    setShowAllFields(!showAllFields);
  };

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      document.body.classList.remove("menu-open");
      navigate("/");
      return;
    }
    const fetchData = async () => {
      try {
        const response = await ApplicantDetails(ApplicantUserId);
        if (response && typeof response === "object") {
          setData(response);
        } else {
          console.error("Unexpected data format:", response);
          setData(null); // Set to null in case of unexpected format
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setData(null); // Set to null in case of error
      }
    };

    if (ApplicantUserId) {
      fetchData();
    }
  }, [ApplicantUserId, isAuthenticated, navigate, refreshFlag]);

  const handleEditApplicant = () => {
    setIsEditing(true);
  };

  const handleCopyEmail = async (id) => {
    try {
      const response = await GetApplicantEmail(id);
      const email = response.ais_username;
      await navigator.clipboard.writeText(email);
      alert("Email copied to clipboard");
    } catch (error) {
      console.error("Error copying email:", error);
    }
  };

  const handleAction = async (id, isActive) => {
    try {
      if (isActive === "Inactive") {
        // Check concurrent limit
        const concurrentLimit = parseInt(
          sessionStorage.getItem("concurrent_applicants")
        );
        const applicantsResponse = await ApplicantSearch(fastVisaUserId);
        const runningCount = applicantsResponse.filter(
          (a) => a.search_status === "Running"
        ).length;
        if (runningCount >= concurrentLimit) {
          alert(
            `You have reached your concurrent applicants limit (${concurrentLimit}).\nTo start a new applicant, please end one of your currently running applicants first.`
          );
          return;
        }
        // Start search using API function
        await StartApplicantContainer(id);
        alert("Search started successfully.");
      } else {
        // Stop search using API function
        await StopApplicantContainer(id);
        alert("Search stopped successfully.");
      }
      setRefreshFlag((flag) => !flag);
    } catch (error) {
      alert("Error performing action.");
      console.error(error);
    }
  };

  const renderActionButton = (id, isActive) => (
    <td key={`toggle-${id}`} style={{ textAlign: "left" }}>
      <button onClick={() => handleAction(id, isActive)}>
        {isActive === "Inactive" ? "Start Search" : "Stop Search"}
      </button>
    </td>
  );

  const handleDeleteApplicant = async () => {
    if (!window.confirm("Are you sure you want to delete this applicant?")) {
      return;
    }
    const isSearchRunning =
      data && (data.search_status === "Running" || data.search_active === true);
    if (isSearchRunning) {
      const confirmStop = window.confirm(
        "Search is in progress. Do you want to stop the search before deleting?"
      );
      if (confirmStop) {
        try {
          const { StopApplicantContainer, ApplicantDelete } = await import(
            "./APIFunctions"
          );
          await StopApplicantContainer(ApplicantUserId);
          window.alert("Search stopped. The applicant will now be deleted.");
          const response = await ApplicantDelete(ApplicantUserId);
          if (response && response.success) {
            window.alert(`Applicant deleted successfully.`);
            navigate("/Applicants");
          } else {
            window.alert("Unexpected response when deleting applicant.");
          }
        } catch (error) {
          window.alert(
            "Failed to stop search or delete applicant. Please try again."
          );
        }
      }
      // If user cancels stopping search, do nothing
      return;
    }
    // If search is not running, proceed to delete
    try {
      const { ApplicantDelete } = await import("./APIFunctions");
      const response = await ApplicantDelete(ApplicantUserId);
      if (response && response.success) {
        window.alert(`Applicant deleted successfully.`);
        navigate("/Applicants");
      } else {
        window.alert("Unexpected response when deleting applicant.");
      }
    } catch (error) {
      console.error("Error in ApplicantDelete:", error);
      window.alert("Error deleting applicant.");
    }
  };

  const renderBooleanValue = (value) => (
    <span>{value ? "Active" : "Inactive"}</span>
  );

  return (
    <div className="page-container">
      <div className="content-wrap">
        <HamburgerMenu />
        <div style={{ marginBottom: "5px" }}></div>
        <Banner />
        <div style={{ marginBottom: "5px" }}></div>
        <p className="username-right">{fastVisaUsername}</p>
        <h2>Applicant Details</h2>
        {isEditing ? (
          <UpdateApplicant data={data} setIsEditing={setIsEditing} />
        ) : data ? (
          <>
            <div style={{ marginBottom: "5px" }}>
              <button
                className={`toggle-button ${setShowAllFields ? "active" : ""}`}
                onClick={toggleFieldsVisibility}
              >
                {showAllFields ? "Only relevant fields" : "Show all fields"}
              </button>
              &nbsp;
              <button onClick={() => handleEditApplicant()}>
                Edit Applicant
              </button>
              &nbsp;
              <button onClick={handleDeleteApplicant}>Delete Applicant</button>
              &nbsp;
              <button onClick={() => navigate("/Applicants")}>
                Back to Applicants
              </button>
              &nbsp;{" "}
              <button onClick={() => handleCopyEmail(data.id)}>
                Copy Email
              </button>
              &nbsp;
              {renderActionButton(data.id, data.search_status)}
            </div>
            {!showAllFields && (
              <table className="table-content" style={{ textAlign: "left" }}>
                <tbody>
                  <tr key={"id"}>
                    <td style={{ textAlign: "left" }}>{"FastVisa ID"}</td>
                    <td style={{ textAlign: "left" }}>{data["id"]}</td>
                  </tr>
                  <tr key={"applicant_active"}>
                    <td style={{ textAlign: "left" }}>{"Applicant Active"}</td>
                    <td style={{ textAlign: "left" }}>
                      {data["applicant_active"] ? "True" : "False"}
                    </td>
                  </tr>
                  <tr key={"ais_username"}>
                    <td style={{ textAlign: "left" }}>{"AIS Username"}</td>
                    <td style={{ textAlign: "left" }}>
                      {data["ais_username"]}
                    </td>
                  </tr>
                  <tr key={"ais_schedule_id"}>
                    <td style={{ textAlign: "left" }}>{"AIS Schedule ID"}</td>
                    <td style={{ textAlign: "left" }}>
                      {data["ais_schedule_id"]}
                    </td>
                  </tr>
                  <tr key={"name"}>
                    <td style={{ textAlign: "left" }}>{"Name"}</td>
                    <td style={{ textAlign: "left" }}>{data["name"]}</td>
                  </tr>
                  <tr key={"number_of_applicants"}>
                    <td style={{ textAlign: "left" }}>
                      {"Number of Applicants"}
                    </td>
                    <td style={{ textAlign: "left" }}>
                      {data["number_of_applicants"]}
                    </td>
                  </tr>
                  <tr key={"target_start_mode"}>
                    <td style={{ textAlign: "left" }}>{"Target Start Mode"}</td>
                    <td style={{ textAlign: "left" }}>
                      {data["target_start_mode"]}
                    </td>
                  </tr>
                  {data["target_start_mode"] === "days" && (
                    <tr key={"target_start_days"}>
                      <td style={{ textAlign: "left" }}>
                        {"Target Start Days"}
                      </td>
                      <td style={{ textAlign: "left" }}>
                        {data["target_start_days"]}
                      </td>
                    </tr>
                  )}
                  {data["target_start_mode"] === "date" && (
                    <tr key={"target_start_date"}>
                      <td style={{ textAlign: "left" }}>
                        {"Target Start Date"}
                      </td>
                      <td style={{ textAlign: "left" }}>
                        {data["target_start_date"]}
                      </td>
                    </tr>
                  )}
                  <tr key={"target_end_date"}>
                    <td style={{ textAlign: "left" }}>{"Target End Date"}</td>
                    <td style={{ textAlign: "left" }}>
                      {data["target_end_date"]}
                    </td>
                  </tr>
                  <tr key={"search_status"}>
                    <td style={{ textAlign: "left" }}>{"Search Status"}</td>
                    <td style={{ textAlign: "left" }}>
                      {data["search_status"]}
                    </td>
                  </tr>
                  <tr key={"target_city_codes"}>
                    <td style={{ textAlign: "left" }}>{"Target City Codes"}</td>
                    <td style={{ textAlign: "left" }}>
                      {data["target_city_codes"]}
                    </td>
                  </tr>
                  <tr key={"consul_appointment_date"}>
                    <td style={{ textAlign: "left" }}>
                      {"Consulate Appointment Date"}
                    </td>
                    <td style={{ textAlign: "left" }}>
                      {data["consul_appointment_date"]}
                    </td>
                  </tr>
                  <tr key={"asc_appointment_date"}>
                    <td style={{ textAlign: "left" }}>
                      {"ASC Appointment Date"}
                    </td>
                    <td style={{ textAlign: "left" }}>
                      {data["asc_appointment_date"]}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
            {showAllFields && (
              <table className="table-content" style={{ textAlign: "left" }}>
                <tbody>
                  {Object.keys(data)
                    .filter((field) => !excludeFields.includes(field)) // Exclude specified fields
                    .map((field) => (
                      <tr key={field}>
                        <td style={{ textAlign: "left" }}>{field}</td>
                        <td style={{ textAlign: "left" }}>
                          {field === "applicant_active" ||
                          field === "search_active"
                            ? renderBooleanValue(data[field])
                            : data[field]}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </>
        ) : (
          <p>No data available</p>
        )}
        <div style={{ marginBottom: "5px" }}></div>
        <Footer />
      </div>
    </div>
  );
};

export default ViewApplicant;
