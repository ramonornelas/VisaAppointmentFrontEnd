import React from "react";
import { Typography, Progress } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

// ---------------------------------------------------------------------------
// Shared password strength constants & helpers
// ---------------------------------------------------------------------------

export const REQUIREMENTS = [
  { key: "minLength", test: (p) => p.length >= 8 },
  { key: "uppercase", test: (p) => /[A-Z]/.test(p) },
  { key: "lowercase", test: (p) => /[a-z]/.test(p) },
  { key: "number",    test: (p) => /\d/.test(p) },
  { key: "special",   test: (p) => /[^a-zA-Z0-9]/.test(p) },
];

const STRENGTH_COLORS = ["#ff4d4f", "#ff7a45", "#faad14", "#52c41a"];

export function getStrength(password) {
  if (!password) return 0;
  return REQUIREMENTS.filter((r) => r.test(password)).length;
}

/**
 * Renders the password strength bar + requirements checklist.
 * Pass the current password value as `password` prop.
 *
 * Usage:
 *   import PasswordStrengthIndicator, { REQUIREMENTS, getStrength } from "../common/PasswordStrengthIndicator";
 *   <PasswordStrengthIndicator password={passwordValue} />
 */
const PasswordStrengthIndicator = ({ password }) => {
  const { t } = useTranslation();

  if (!password) return null;

  const metCount = getStrength(password);
  const strengthPercent = (metCount / REQUIREMENTS.length) * 100;
  const strengthColor = STRENGTH_COLORS[Math.max(0, metCount - 1)] || STRENGTH_COLORS[0];

  const strengthLabels = [
    t("passwordStrengthWeak",   "Weak"),
    t("passwordStrengthFair",   "Fair"),
    t("passwordStrengthGood",   "Good"),
    t("passwordStrengthGood",   "Good"),
    t("passwordStrengthStrong", "Strong"),
  ];
  const strengthLabel = strengthLabels[metCount] || "";

  return (
    <div style={{ marginTop: -12, marginBottom: 16 }}>
      {/* Progress bar + label */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          <Progress
            percent={strengthPercent}
            showInfo={false}
            strokeColor={strengthColor}
            size="small"
          />
        </div>
        <Text style={{ color: strengthColor, fontSize: 12, whiteSpace: "nowrap" }}>
          {strengthLabel}
        </Text>
      </div>

      {/* Requirements checklist */}
      <div
        style={{
          background: "#fafafa",
          border: "1px solid #f0f0f0",
          borderRadius: 6,
          padding: "8px 12px",
        }}
      >
        {REQUIREMENTS.map((req) => {
          const met = req.test(password);
          const labelKey = `passwordReq${req.key.charAt(0).toUpperCase() + req.key.slice(1)}`;
          return (
            <div
              key={req.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                lineHeight: 1.8,
              }}
            >
              {met ? (
                <CheckCircleOutlined style={{ color: "#52c41a" }} />
              ) : (
                <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
              )}
              <Text style={{ color: met ? "#52c41a" : "#ff4d4f", fontSize: 12 }}>
                {t(labelKey, req.key)}
              </Text>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
