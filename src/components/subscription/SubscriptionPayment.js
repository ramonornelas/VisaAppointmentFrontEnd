import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Card,
  Button,
  Alert,
  Spin,
  Typography,
  Space,
  Row,
  Col,
  Divider,
  Tag,
  Result,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  BankOutlined,
  WhatsAppOutlined,
  TeamOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import HamburgerMenu from "../common/HamburgerMenu";
import Banner from "../common/Banner";
import Footer from "../common/Footer";
import PayPalPayment from "../premium/PayPalPayment";
import {
  UserDetails,
  updateUser,
  getUSDMXNExchangeRate,
  sendEmail,
} from "../../services/APIFunctions";
import { useAuth } from "../../utils/AuthContext";
import "./SubscriptionPayment.css";

const { Title, Text, Paragraph } = Typography;

const FALLBACK_USD_MXN_RATE = 17;
const WHATSAPP_NUMBER = "5215645451289";

const SUBSCRIPTION_PLANS = [
  {
    id: "plan_2",
    labelKey: "subscriptionPlan2Label",
    priceMXN: 1450,
    concurrentApplicants: 2,
  },
  {
    id: "plan_5",
    labelKey: "subscriptionPlan5Label",
    priceMXN: 2500,
    concurrentApplicants: 5,
  },
  {
    id: "plan_10",
    labelKey: "subscriptionPlan10Label",
    priceMXN: 3800,
    concurrentApplicants: 10,
  },
];

const MainContainer = ({ children }) => (
  <div className="main-centered-container">
    <HamburgerMenu />
    <Banner />
    {children}
  </div>
);

const SubscriptionPayment = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { refreshUserStatus } = useAuth();

  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState(false);
  const [submittingTransfer, setSubmittingTransfer] = useState(false);
  const [error, setError] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [transferSubmitted, setTransferSubmitted] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);

  const fastVisaUserId = sessionStorage.getItem("fastVisa_userid");
  const selectedLanguage = i18n.language;

  const selectedPlan = useMemo(
    () => SUBSCRIPTION_PLANS.find((plan) => plan.id === selectedPlanId) || null,
    [selectedPlanId],
  );

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        if (!fastVisaUserId) {
          navigate("/");
          return;
        }

        const [userData, rate] = await Promise.all([
          UserDetails(fastVisaUserId),
          getUSDMXNExchangeRate(),
        ]);

        console.log("[SubscriptionPayment] User data received:", {
          concurrent_applicants: userData?.concurrent_applicants,
          subscription_expires_at: userData?.subscription_expires_at,
          trial_active: userData?.trial_active,
        });

        setUserDetails(userData || null);
        setExchangeRate(rate || null);

        // If the user already has a pending payment, pre-select their requested plan
        // and lock the UI to bank_transfer so everything is visible but not editable
        if (userData?.payment_pending === true && userData?.requested_concurrent_applicants) {
          const matchingPlan = SUBSCRIPTION_PLANS.find(
            (p) => p.concurrentApplicants === Number(userData.requested_concurrent_applicants),
          );
          if (matchingPlan) setSelectedPlanId(matchingPlan.id);
          setSelectedPaymentMethod("bank_transfer");
        }
      } catch (err) {
        console.error("[SubscriptionPayment] Error fetching initial data:", err);
        setError(
          t(
            "subscriptionLoadError",
            "Could not load subscription information. Please try again.",
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [fastVisaUserId, navigate, t]);

  const getPlanPriceUSD = (priceMXN) => {
    const rate = exchangeRate || FALLBACK_USD_MXN_RATE;
    return priceMXN / rate;
  };

  const formatAmount = (value) => {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      return "0,000.00";
    }

    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  };

  const formatDate = (isoDate) => {
    try {
      return new Date(isoDate).toLocaleDateString(selectedLanguage === "es" ? "es-MX" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (err) {
      return isoDate;
    }
  };

  const handleSelectPlan = (planId) => {
    setSelectedPlanId(planId);
    setSelectedPaymentMethod(null);
    setTransferSubmitted(false);
    setError(null);
  };

  const handleSelectPaymentMethod = (method) => {
    setSelectedPaymentMethod(method);
    setTransferSubmitted(false);
    setError(null);
  };

  /**
   * Returns renewal info shown to the user when they already have an active subscription.
   * Rules:
   * - Charge is always the full price of the selected plan (no partial credits).
   * - The new expiry always extends 30 days from the current expiry date (not from today),
   *   so the user never loses the days they already paid for.
   * - isUpgrade / isDowngrade only affect the banner message, not the charge.
   */
  const getRenewalInfo = () => {
    if (!userDetails?.subscription_expires_at || !selectedPlan) return null;

    const now = new Date();
    const currentExpiry = new Date(userDetails.subscription_expires_at);
    if (currentExpiry <= now) return null; // already expired — normal renewal

    const msRemaining = currentExpiry - now;
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

    // New expiry always extends from the current expiry date
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + 30);

    const currentPlan = SUBSCRIPTION_PLANS.find(
      (p) => p.concurrentApplicants === Number(userDetails.concurrent_applicants),
    );

    const isUpgrade = currentPlan && selectedPlan.priceMXN > currentPlan.priceMXN;
    const isDowngrade = currentPlan && selectedPlan.priceMXN < currentPlan.priceMXN;

    return {
      daysRemaining,
      currentExpiry,
      newExpiry,
      isUpgrade,
      isDowngrade,
      currentPlan,
    };
  };

  const buildSubscriptionUpdatePayload = () => {
    const now = new Date();
    const nowIso = now.toISOString();

    // If the subscription is still active, extend from the current expiry date.
    // Otherwise start a fresh 30-day period from today.
    const currentExpiry = userDetails?.subscription_expires_at
      ? new Date(userDetails.subscription_expires_at)
      : null;
    const baseDate = currentExpiry && currentExpiry > now ? currentExpiry : now;

    const expiration = new Date(baseDate);
    expiration.setDate(expiration.getDate() + 30);

    const payload = {
      subscription_expires_at: expiration.toISOString(),
      concurrent_applicants: selectedPlan.concurrentApplicants,
    };

    if (userDetails?.trial_active === true) {
      payload.trial_active = false;
      payload.trial_ended_at = nowIso;
    }

    return payload;
  };

  const buildPaymentConfirmationEmail = ({ name, email, planLabel, concurrentApplicants, expiresAt, paymentId, language }) => {
    const formattedExpiry = formatDate(expiresAt);
    const isEs = language === "es";

    const subject = isEs
      ? "FastVisa - Suscripción activada exitosamente"
      : "FastVisa - Subscription Activated Successfully";

    const bodyText = isEs
      ? `Hola ${name},\n\nTu pago fue procesado exitosamente y tu suscripción ya está activa.\n\nPlan: ${planLabel}\nBúsquedas activas: ${concurrentApplicants}\nFecha de vencimiento: ${formattedExpiry}${paymentId ? `\nID de pago: ${paymentId}` : ""}\n\nYa puedes iniciar sesión y comenzar a buscar citas.\n\nGracias por elegir FastVisa.\n`
      : `Hello ${name},\n\nYour payment was processed successfully and your subscription is now active.\n\nPlan: ${planLabel}\nActive searches: ${concurrentApplicants}\nExpires on: ${formattedExpiry}${paymentId ? `\nPayment ID: ${paymentId}` : ""}\n\nYou can now log in and start searching for appointments.\n\nThank you for choosing FastVisa.\n`;

    const htmlBody = isEs ? `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
    .header { background-color: #4caf50; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 26px; }
    .content { background-color: #f9f9f9; padding: 30px 20px; border: 1px solid #ddd; border-top: none; }
    .info-box { background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .detail-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .detail-table td { padding: 8px 12px; border-bottom: 1px solid #e0e0e0; }
    .detail-table td:first-child { font-weight: bold; color: #555; width: 40%; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>🎉 ¡Suscripción Activada!</h1></div>
    <div class="content">
      <p>Hola <strong>${name}</strong>,</p>
      <div class="info-box">
        <strong>✅ Tu pago fue procesado exitosamente y tu suscripción ya está activa.</strong>
      </div>
      <table class="detail-table">
        <tr><td>Plan:</td><td>${planLabel}</td></tr>
        <tr><td>Búsquedas activas:</td><td>${concurrentApplicants}</td></tr>
        <tr><td>Vence el:</td><td>${formattedExpiry}</td></tr>
        ${paymentId ? `<tr><td>ID de pago:</td><td><code>${paymentId}</code></td></tr>` : ""}
      </table>
      <p>Ya puedes iniciar sesión y comenzar a buscar citas de visa.</p>
      <p>Si tienes alguna pregunta, contáctanos en <a href="mailto:admin@orionscaled.com">admin@orionscaled.com</a></p>
      <p><strong>¡Gracias por elegir FastVisa!</strong></p>
    </div>
    <div class="footer"><p>&copy; 2026 FastVisa. Todos los derechos reservados.</p></div>
  </div>
</body>
</html>` : `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
    .header { background-color: #4caf50; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 26px; }
    .content { background-color: #f9f9f9; padding: 30px 20px; border: 1px solid #ddd; border-top: none; }
    .info-box { background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .detail-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .detail-table td { padding: 8px 12px; border-bottom: 1px solid #e0e0e0; }
    .detail-table td:first-child { font-weight: bold; color: #555; width: 40%; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>🎉 Subscription Activated!</h1></div>
    <div class="content">
      <p>Hello <strong>${name}</strong>,</p>
      <div class="info-box">
        <strong>✅ Your payment was processed successfully and your subscription is now active.</strong>
      </div>
      <table class="detail-table">
        <tr><td>Plan:</td><td>${planLabel}</td></tr>
        <tr><td>Active searches:</td><td>${concurrentApplicants}</td></tr>
        <tr><td>Expires on:</td><td>${formattedExpiry}</td></tr>
        ${paymentId ? `<tr><td>Payment ID:</td><td><code>${paymentId}</code></td></tr>` : ""}
      </table>
      <p>You can now log in and start searching for visa appointments.</p>
      <p>If you have any questions, contact us at <a href="mailto:admin@orionscaled.com">admin@orionscaled.com</a></p>
      <p><strong>Thank you for choosing FastVisa!</strong></p>
    </div>
    <div class="footer"><p>&copy; 2026 FastVisa. All rights reserved.</p></div>
  </div>
</body>
</html>`;

    return { subject, bodyText, htmlBody };
  };

  const handlePaymentSuccess = async (paymentDetails) => {
    if (!selectedPlan || !fastVisaUserId) {
      setError(
        t(
          "subscriptionMissingPlanError",
          "Please choose a subscription plan before completing payment.",
        ),
      );
      return;
    }

    setUpdatingUser(true);
    setError(null);

    try {
      const updatePayload = buildSubscriptionUpdatePayload();
      const updateResult = await updateUser(fastVisaUserId, updatePayload);

      if (updateResult === null) {
        throw new Error("Failed to update subscription fields after payment");
      }

      const refreshedUser = await UserDetails(fastVisaUserId);
      const resolvedUser = refreshedUser || updateResult || {};

      setUserDetails(resolvedUser);
      await refreshUserStatus();

      const planLabel = t(selectedPlan.labelKey, {
        defaultValue: `${selectedPlan.concurrentApplicants} active searches`,
      });
      const expiresAt = resolvedUser.subscription_expires_at || updatePayload.subscription_expires_at;

      setPaymentSuccessData({
        paymentId: paymentDetails?.id,
        planLabel,
        concurrentApplicants: selectedPlan.concurrentApplicants,
        subscriptionExpiresAt: expiresAt,
      });

      // Send confirmation email to user (BCC admin)
      try {
        const userEmail = resolvedUser.email || userDetails?.email;
        const userName = resolvedUser.name || resolvedUser.username || userDetails?.name || userDetails?.username || userEmail;
        if (userEmail) {
          const { subject, bodyText, htmlBody } = buildPaymentConfirmationEmail({
            name: userName,
            email: userEmail,
            planLabel,
            concurrentApplicants: selectedPlan.concurrentApplicants,
            expiresAt,
            paymentId: paymentDetails?.id,
            language: selectedLanguage,
          });
          await sendEmail({
            recipient: userEmail,
            subject,
            message: bodyText,
            html_body: htmlBody,
            bcc: ["admin@orionscaled.com"],
          });
          console.log("[SubscriptionPayment] Payment confirmation email sent to", userEmail);
        }
      } catch (emailErr) {
        // Non-blocking — log but don't surface to user
        console.error("[SubscriptionPayment] Failed to send confirmation email:", emailErr);
      }
    } catch (err) {
      console.error("[SubscriptionPayment] Failed to apply subscription update:", err);
      setError(
        t(
          "subscriptionActivationError",
          "Payment succeeded, but we could not activate your subscription. Please contact support.",
        ),
      );
    } finally {
      setUpdatingUser(false);
    }
  };

  const handlePaymentError = (paymentError) => {
    console.error("[SubscriptionPayment] PayPal payment error:", paymentError);
    setError(
      t("subscriptionPaymentFailed", "Payment failed. Please try again."),
    );
    setUpdatingUser(false);
  };

  const handlePaymentCancel = () => {
    setSelectedPaymentMethod(null);
    setUpdatingUser(false);
  };

  const handleTransferSubmitted = async () => {
    if (!selectedPlan || !fastVisaUserId) return;

    setSubmittingTransfer(true);
    setError(null);

    try {
      // Mark the user's payment as pending validation and record the requested plan
      await updateUser(fastVisaUserId, {
        payment_pending: true,
        requested_concurrent_applicants: selectedPlan.concurrentApplicants,
        requested_subscription_expires_at: buildSubscriptionUpdatePayload().subscription_expires_at,
      });

      // Refresh local user details so UI reflects the new state
      const refreshed = await UserDetails(fastVisaUserId);
      if (refreshed) setUserDetails(refreshed);

      // Refresh global auth context so HamburgerMenu reflects payment_pending
      await refreshUserStatus();

      // Notify admin via email
      const username = sessionStorage.getItem("fastVisa_username") || fastVisaUserId;
      const planLabel = t(selectedPlan.labelKey, {
        defaultValue: `${selectedPlan.concurrentApplicants} active searches`,
      });
      const amountFormatted = formatAmount(selectedPlan.priceMXN);

      await sendEmail({
        recipient: "admin@orionscaled.com",
        subject: `FastVisa - Pago pendiente de validación - ${username}`,
        message: `El usuario ${username} ha enviado el comprobante de pago por transferencia bancaria.\n\nPlan: ${planLabel}\nMonto: $${amountFormatted} MXN\n\nPor favor valida el pago y activa su suscripción manualmente.`,
        html_body: `
          <h2>Pago pendiente de validación</h2>
          <p>El usuario <strong>${username}</strong> ha indicado que envió el comprobante de pago por transferencia bancaria.</p>
          <table cellpadding="8" style="border-collapse:collapse;">
            <tr><td><strong>Plan:</strong></td><td>${planLabel}</td></tr>
            <tr><td><strong>Monto:</strong></td><td>$${amountFormatted} MXN</td></tr>
            <tr><td><strong>Usuario ID:</strong></td><td>${fastVisaUserId}</td></tr>
          </table>
          <p>Por favor valida el comprobante de pago vía WhatsApp y activa la suscripción manualmente en el panel de usuarios.</p>
        `,
      });

      setTransferSubmitted(true);
    } catch (err) {
      console.error("[SubscriptionPayment] Error submitting transfer proof:", err);
      setError(
        t(
          "transferSubmitError",
          "There was an error registering your payment. Please try again.",
        ),
      );
    } finally {
      setSubmittingTransfer(false);
    }
  };

  const whatsappMessage = selectedPlan
    ? t("subscriptionWhatsAppMessage", {
        plan: t(selectedPlan.labelKey, {
          defaultValue: `${selectedPlan.concurrentApplicants} active searches`,
        }),
        amount: formatAmount(selectedPlan.priceMXN),
        username: sessionStorage.getItem("fastVisa_username") || "N/A",
      })
    : t(
        "subscriptionWhatsAppMessageNoPlan",
        "Hola, necesito apoyo con mi pago de suscripción de FastVisa.",
      );

  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    whatsappMessage,
  )}`;

  if (loading) {
    return (
      <div className="page-container">
        <MainContainer>
          <div className="subscription-page-container">
            <Card style={{ textAlign: "center", marginTop: 40 }}>
              <Spin size="large" />
              <Paragraph style={{ marginTop: 16 }}>
                {t("loading", "Loading...")}
              </Paragraph>
            </Card>
          </div>
        </MainContainer>
        <Footer />
      </div>
    );
  }

  if (paymentSuccessData) {
    return (
      <div className="page-container">
        <MainContainer>
          <div className="subscription-page-container">
            <Card style={{ marginTop: 40 }}>
              <Result
                status="success"
                title={t("subscriptionActivatedTitle", "Subscription Activated")}
                subTitle={t(
                  "subscriptionActivatedMessage",
                  "Your subscription is now active and ready to use.",
                )}
                extra={[
                  <Button
                    type="primary"
                    size="large"
                    key="continue"
                    onClick={() => navigate("/applicants")}
                  >
                    {t("continueToApplicants", "Continue")}
                  </Button>,
                ]}
              >
                <Card
                  type="inner"
                  style={{
                    backgroundColor: "#f6ffed",
                    borderColor: "#b7eb8f",
                  }}
                >
                  <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    <div>
                      <Text strong>{t("selectedPlan", "Selected plan")}:</Text>
                      <br />
                      <Text>{paymentSuccessData.planLabel}</Text>
                    </div>
                    <div>
                      <TeamOutlined style={{ marginRight: 8, color: "#52c41a" }} />
                      <Text strong>
                        {t("concurrentApplicants", "Concurrent applicants")}:
                      </Text>
                      <br />
                      <Tag color="green">{paymentSuccessData.concurrentApplicants}</Tag>
                    </div>
                    <div>
                      <CalendarOutlined style={{ marginRight: 8, color: "#52c41a" }} />
                      <Text strong>
                        {t("subscriptionExpiresOn", "Subscription expires on")}:
                      </Text>
                      <br />
                      <Text>{formatDate(paymentSuccessData.subscriptionExpiresAt)}</Text>
                    </div>
                    {paymentSuccessData.paymentId && (
                      <div>
                        <Text strong>{t("paymentId", "Payment ID")}:</Text>
                        <br />
                        <Text code>{paymentSuccessData.paymentId}</Text>
                      </div>
                    )}
                  </Space>
                </Card>
              </Result>
            </Card>
          </div>
        </MainContainer>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-container">
      <MainContainer>
        <div className="subscription-page-container">
          <Space direction="vertical" size="large" style={{ width: "100%", marginTop: 20 }}>
            {/* Header with Cancel Button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <Title level={2} style={{ margin: 0 }}>
                  {t("subscriptionPageTitle", "Activate or Renew Subscription")}
                </Title>
                <Paragraph type="secondary">
                  {t(
                    "subscriptionPageSubtitle",
                    "Choose a plan and complete your payment method.",
                  )}
                </Paragraph>
              </div>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/applicants")}
                size="large"
              >
                {t("cancel", "Cancel")}
              </Button>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert
                message={error}
                type="error"
                closable
                onClose={() => setError(null)}
                showIcon
              />
            )}

            {/* Step 1: Select Plan */}
            <Card>
              <Title level={3}>
                {t("subscriptionStep1", "Step 1: Select your plan")}
              </Title>
              {userDetails?.payment_pending === true && (
                <Alert
                  message={t(
                    "paymentPendingLockNotice",
                    "Your payment is pending validation. Plan and payment method are locked until your payment is confirmed.",
                  )}
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
              <Row gutter={[16, 16]} style={{ alignItems: "stretch" }}>
                {SUBSCRIPTION_PLANS.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  const isCurrentPlan = Number(userDetails?.concurrent_applicants) === plan.concurrentApplicants;
                  const isSubscriptionActive = userDetails?.subscription_expires_at && 
                    new Date(userDetails.subscription_expires_at) > new Date();
                  const isPendingLocked = userDetails?.payment_pending === true;
                  
                  console.log(`[SubscriptionPayment] Plan ${plan.id} evaluation:`, {
                    planApplicants: plan.concurrentApplicants,
                    userApplicants: userDetails?.concurrent_applicants,
                    userApplicantsNumber: Number(userDetails?.concurrent_applicants),
                    isCurrentPlan,
                    expiresAt: userDetails?.subscription_expires_at,
                    isActive: isSubscriptionActive,
                  });
                  
                  return (
                    <Col xs={24} sm={12} md={8} key={plan.id} style={{ display: "flex" }}>
                      <Card
                        hoverable={!isPendingLocked}
                        className={`subscription-plan-card ${isSelected ? "selected" : ""}`}
                        onClick={() => !isPendingLocked && handleSelectPlan(plan.id)}
                        style={{
                          borderColor: isSelected ? "#1890ff" : "#d9d9d9",
                          borderWidth: isSelected ? 2 : 1,
                          backgroundColor: isSelected ? "#e6f7ff" : "#fff",
                          width: "100%",
                          display: "flex",
                          flexDirection: "column",
                          cursor: isPendingLocked ? "not-allowed" : "pointer",
                          opacity: isPendingLocked && !isSelected ? 0.45 : 1,
                        }}
                      >
                        <Space direction="vertical" size="small" style={{ width: "100%", flex: 1 }}>
                          <Title level={4} style={{ margin: 0 }}>
                            <TeamOutlined style={{ marginRight: 8 }} />
                            {plan.concurrentApplicants} {t("activeSearchesLabel", "Active searches")}
                          </Title>
                          <Divider style={{ margin: "8px 0" }} />
                          <Text strong style={{ fontSize: 24, color: "#1890ff" }}>
                            ${formatAmount(plan.priceMXN)}
                          </Text>
                          <Text type="secondary">MXN / {t("perMonth", "month")}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            ~${formatAmount(getPlanPriceUSD(plan.priceMXN))} USD
                          </Text>
                          <div style={{ marginTop: "auto", paddingTop: 8 }}>
                            {isSelected && (
                              <Tag color="blue" icon={<CheckCircleOutlined />}>
                                {t("selected", "Selected")}
                              </Tag>
                            )}
                            {isCurrentPlan && (
                              <Tag 
                                color={isSubscriptionActive ? "green" : "red"} 
                                icon={isSubscriptionActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                              >
                                {isSubscriptionActive 
                                  ? t("currentPlanActive", "Current plan")
                                  : t("currentPlanExpired", "Current plan (expired)")
                                }
                              </Tag>
                            )}
                          </div>
                        </Space>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
              {exchangeRate === null && (
                <Alert
                  message={t(
                    "subscriptionExchangeRateWarning",
                    "USD amount is estimated because exchange rate is temporarily unavailable.",
                  )}
                  type="warning"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}
            </Card>

            {/* Early-renewal info banner */}
            {selectedPlan && (() => {
              const renewal = getRenewalInfo();
              if (!renewal) return null;

              const { daysRemaining, newExpiry, isUpgrade, isDowngrade } = renewal;

              let bannerType = "info";
              let bannerTitle = t("earlyRenewalTitle");
              let bannerBody;

              if (isUpgrade) {
                bannerType = "success";
                bannerTitle = t("earlyRenewalUpgradeTitle");
                bannerBody = (
                  <Paragraph style={{ margin: 0 }}>
                    {t("earlyRenewalUpgradeBody", {
                      days: daysRemaining,
                      fullPrice: formatAmount(selectedPlan.priceMXN),
                      newExpiry: formatDate(newExpiry.toISOString()),
                    })}
                  </Paragraph>
                );
              } else if (isDowngrade) {
                bannerType = "warning";
                bannerTitle = t("earlyRenewalDowngradeTitle");
                bannerBody = (
                  <Paragraph style={{ margin: 0 }}>
                    {t("earlyRenewalDowngradeBody", {
                      days: daysRemaining,
                      fullPrice: formatAmount(selectedPlan.priceMXN),
                      newApplicants: selectedPlan.concurrentApplicants,
                      newExpiry: formatDate(newExpiry.toISOString()),
                    })}
                  </Paragraph>
                );
              } else {
                // Same plan, early renewal
                bannerBody = (
                  <Paragraph style={{ margin: 0 }}>
                    {t("earlyRenewalSamePlanBody", {
                      days: daysRemaining,
                      fullPrice: formatAmount(selectedPlan.priceMXN),
                      newExpiry: formatDate(newExpiry.toISOString()),
                    })}
                  </Paragraph>
                );
              }

              return (
                <Alert
                  type={bannerType}
                  showIcon
                  message={<Text strong>{bannerTitle}</Text>}
                  description={bannerBody}
                />
              );
            })()}

            {/* Step 2: Payment Method */}
            {selectedPlan && (
              <Card>
                <Title level={3}>
                  {t("subscriptionStep2", "Step 2: Choose payment method")}
                </Title>
                <Space size="middle">
                  <Button
                    type={selectedPaymentMethod === "paypal" ? "primary" : "default"}
                    icon={<CreditCardOutlined />}
                    size="large"
                    disabled={userDetails?.payment_pending === true}
                    onClick={() => handleSelectPaymentMethod("paypal")}
                  >
                    {t("payWithPaypal", "Pay with PayPal")}
                  </Button>
                  <Button
                    type={selectedPaymentMethod === "bank_transfer" ? "primary" : "default"}
                    icon={<BankOutlined />}
                    size="large"
                    disabled={userDetails?.payment_pending === true}
                    onClick={() => handleSelectPaymentMethod("bank_transfer")}
                  >
                    {t("payWithBankTransfer", "Bank transfer")}
                  </Button>
                </Space>
              </Card>
            )}

            {/* PayPal Payment Section */}
            {selectedPaymentMethod === "paypal" && selectedPlan && (
              <Card>
                <Title level={4}>
                  {t("completePaypalPayment", "Complete your PayPal payment")}
                </Title>
                <Paragraph>
                  <Text strong>{t("selectedPlanSummary", "Selected plan")}:</Text>{" "}
                  {t(selectedPlan.labelKey, {
                    defaultValue: `${selectedPlan.concurrentApplicants} active searches`,
                  })} — <Text strong>${formatAmount(selectedPlan.priceMXN)} MXN</Text>
                </Paragraph>
                <PayPalPayment
                  amount={getPlanPriceUSD(selectedPlan.priceMXN).toFixed(2)}
                  amountMXN={selectedPlan.priceMXN.toString()}
                  defaultCurrency={selectedLanguage === "es" ? "MXN" : "USD"}
                  description={t(
                    "subscriptionPaypalDescription",
                    {
                      plan: t(selectedPlan.labelKey, {
                        defaultValue: `${selectedPlan.concurrentApplicants} active searches`,
                      }),
                    },
                  )}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={handlePaymentCancel}
                />
                {updatingUser && (
                  <Alert
                    message={t(
                      "subscriptionActivating",
                      "Activating your subscription. Please wait...",
                    )}
                    type="info"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}
              </Card>
            )}

            {/* Bank Transfer Section */}
            {selectedPaymentMethod === "bank_transfer" && selectedPlan && (
              <Card>
                <Title level={4}>
                  {t("bankTransferInstructions", "Bank transfer instructions")}
                </Title>
                <Card
                  type="inner"
                  style={{
                    backgroundColor: "#f0f5ff",
                    borderColor: "#adc6ff",
                  }}
                >
                  <Space direction="vertical" size="small" style={{ width: "100%" }}>
                    <div>
                      <Text strong>{t("bankLabel", "Bank")}:</Text>
                      <br />
                      <Text>Banamex</Text>
                    </div>
                    <Divider style={{ margin: "8px 0" }} />
                    <div>
                      <Text strong>
                        {t("accountHolderLabel", "Account holder")}:
                      </Text>
                      <br />
                      <Text code copyable>Carlos Javier Ornelas Espinosa</Text>
                    </div>
                    <Divider style={{ margin: "8px 0" }} />
                    <div>
                      <Text strong>CLABE:</Text>
                      <br />
                      <Text code copyable>002180901238585482</Text>
                    </div>
                    <Divider style={{ margin: "8px 0" }} />
                    <div>
                      <Text strong>{t("amountToTransfer", "Amount")}:</Text>
                      <br />
                      <Text strong style={{ fontSize: 18, color: "#1890ff" }}>
                        ${formatAmount(selectedPlan.priceMXN)} MXN
                      </Text>
                    </div>
                  </Space>
                </Card>

                <Alert
                  message={t(
                    "transferSendProofInstruction",
                    "After transfer, send your payment proof via WhatsApp.",
                  )}
                  type="info"
                  showIcon
                  style={{ marginTop: 16 }}
                />

                <Space style={{ marginTop: 16 }} size="middle">
                  <Button
                    type="primary"
                    icon={<WhatsAppOutlined />}
                    size="large"
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("openWhatsapp", "Open WhatsApp")}
                  </Button>
                  <Button
                    size="large"
                    loading={submittingTransfer}
                    disabled={submittingTransfer || transferSubmitted || userDetails?.payment_pending === true}
                    onClick={handleTransferSubmitted}
                  >
                    {userDetails?.payment_pending === true && !transferSubmitted
                      ? t("pendingValidation", "Pending validation")
                      : t("alreadySentProof", "I already sent proof")}
                  </Button>
                </Space>

                {(transferSubmitted || userDetails?.payment_pending === true) && (
                  <Alert
                    message={t(
                      "transferPendingValidation",
                      "Thanks! Your transfer is pending manual validation. We will activate your subscription once payment is confirmed.",
                    )}
                    type="success"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}

                {(transferSubmitted || userDetails?.payment_pending === true) && (
                  <Button
                    type="primary"
                    icon={<ArrowLeftOutlined />}
                    size="large"
                    style={{ marginTop: 16 }}
                    onClick={() => navigate("/applicants")}
                  >
                    {t("backToApplicants", "Back to Applicants")}
                  </Button>
                )}
              </Card>
            )}
          </Space>
        </div>
      </MainContainer>
      <Footer />
    </div>
  );
};

export default SubscriptionPayment;
