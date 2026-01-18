import React from "react";
import { Tag } from "antd";
import { ENVIRONMENT } from "../../config/config";

/**
 * EnvironmentBadge Component
 * Displays "TEST" badge only in test environment
 * Hidden in production for cleaner UI
 *
 * @param {Object} props - Component props
 * @param {Object} props.style - Optional inline styles for positioning
 * @returns {JSX.Element|null} Environment badge or null in production
 */
const EnvironmentBadge = ({ style = {} }) => {
  const env = ENVIRONMENT.toLowerCase();

  // Only show badge in TEST environment
  // Hide in PROD for cleaner production UI
  if (env === "production" || env === "prod") {
    return null;
  }

  // Show TEST badge (for test/testing/development environments)
  return (
    <Tag
      color="warning"
      style={{
        fontSize: "12px",
        fontWeight: "bold",
        padding: "4px 12px",
        borderRadius: "4px",
        width: "fit-content",
        ...style,
      }}
    >
      TEST
    </Tag>
  );
};

export default EnvironmentBadge;
