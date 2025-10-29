import React, { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { getPayPalConfig } from "./APIFunctions";

const PayPalPayment = ({ 
  amount = "1.00", 
  currency = "USD", 
  description = "FastVisa Service Fee",
  onSuccess, 
  onError, 
  onCancel 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paypalConfig, setPaypalConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);

  // Load PayPal configuration on component mount
  useEffect(() => {
    const loadPayPalConfig = async () => {
      try {
        setConfigLoading(true);
        const config = await getPayPalConfig();
        setPaypalConfig(config);
        setError(null);
      } catch (err) {
        console.error('Failed to load PayPal configuration:', err);
        setError('Failed to load payment configuration. Please try again.');
      } finally {
        setConfigLoading(false);
      }
    };
    loadPayPalConfig();
  }, []);

  const initialOptions = paypalConfig ? {
    "client-id": paypalConfig.clientId,
    currency: currency,
    intent: "capture",
    environment: paypalConfig.environment || "sandbox" // sandbox or live
  } : null;

  const handleCreateOrder = (data, actions) => {
    setLoading(true);
    setError(null);
    
    return actions.order.create({
      purchase_units: [
        {
          description: description,
          amount: {
            currency_code: currency,
            value: amount,
          },
        },
      ],
    });
  };

  const handleApprove = async (data, actions) => {
    try {
      const details = await actions.order.capture();
      setLoading(false);
      
      console.log("Payment successful:", details);
      
      // Call success callback
      if (onSuccess) {
        onSuccess(details);
      }
      
      return details;
    } catch (error) {
      setLoading(false);
      setError("Payment capture failed");
      console.error("Payment capture error:", error);
      
      if (onError) {
        onError(error);
      }
    }
  };

  const handleError = (error) => {
    setLoading(false);
    setError("Payment failed");
    console.error("PayPal error:", error);
    
    if (onError) {
      onError(error);
    }
  };

  const handleCancel = (data) => {
    setLoading(false);
    console.log("Payment cancelled:", data);
    
    if (onCancel) {
      onCancel(data);
    }
  };

  if (configLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div>Loading payment configuration...</div>
      </div>
    );
  }

  if (!paypalConfig || !paypalConfig.clientId) {
    return (
      <div style={{ color: 'red', padding: '10px', border: '1px solid red' }}>
        Error: PayPal configuration not available. Please contact support.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>Payment Details</h3>
        <p><strong>Amount:</strong> {currency} ${amount}</p>
        <p><strong>Description:</strong> {description}</p>
      </div>

      {error && (
        <div style={{ color: 'red', padding: '10px', marginBottom: '10px', backgroundColor: '#ffe6e6', borderRadius: '5px' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '10px' }}>
          Processing payment...
        </div>
      )}

      {initialOptions && (
        <PayPalScriptProvider options={initialOptions}>
          <PayPalButtons
            style={{ 
              layout: "vertical",
              color: "blue",
              shape: "rect",
              label: "paypal" 
            }}
            createOrder={handleCreateOrder}
            onApprove={handleApprove}
            onError={handleError}
            onCancel={handleCancel}
            disabled={loading}
          />
        </PayPalScriptProvider>
      )}
    </div>
  );
};

export default PayPalPayment;