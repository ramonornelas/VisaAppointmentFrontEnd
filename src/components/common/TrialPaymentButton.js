import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Tooltip } from "antd";
import { CreditCardOutlined } from "@ant-design/icons";
import "./TrialPaymentButton.css";

const TrialPaymentButton = ({ trialActive, subscriptionExpired }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Don't show button if neither trial nor expired
  if (!trialActive && !subscriptionExpired) {
    return null;
  }

  const getMessage = () => {
    if (trialActive) {
      return t(
        "trialEndsMessage",
        "Your trial ends when you find and book an appointment"
      );
    }
    if (subscriptionExpired) {
      return t(
        "subscriptionExpiredMessage",
        "Your subscription has ended and must be renewed"
      );
    }
    return "";
  };

  const handleClick = () => {
    navigate("/subscription");
  };

  return (
    <div className="trial-payment-button-container">
      <Tooltip title={getMessage()} placement="bottom">
        <Button
          type="primary"
          icon={<CreditCardOutlined />}
          onClick={handleClick}
          className="trial-payment-button"
          size="middle"
        >
          {trialActive
            ? t("subscribeNow", "Subscribe Now")
            : t("renewSubscription", "Renew Subscription")}
        </Button>
      </Tooltip>
    </div>
  );
};

export default TrialPaymentButton;
