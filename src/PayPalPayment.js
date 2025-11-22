import React, { useState, useEffect, useMemo } from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useTranslation } from 'react-i18next';
import { getPayPalConfig } from "./APIFunctions";
import FastVisaMetrics from './utils/FastVisaMetrics';

const PayPalPayment = ({ 
  amount = "1.00", 
  amountMXN = "20.00", // Amount in Mexican Pesos
  defaultCurrency = "USD", 
  description = "FastVisa Service Fee",
  onSuccess, 
  onError, 
  onCancel 
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paypalConfig, setPaypalConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState(defaultCurrency);
  const [currentAmount, setCurrentAmount] = useState(defaultCurrency === "USD" ? amount : amountMXN);

  // Initialize metrics tracker
  const metrics = useMemo(() => new FastVisaMetrics(), []);

  // Set user ID if available
  const fastVisa_userid = sessionStorage.getItem('fastVisa_userid');
  useEffect(() => {
    if (fastVisa_userid) {
      metrics.setUserId(fastVisa_userid);
    }
  }, [fastVisa_userid, metrics]);

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
    currency: selectedCurrency,
    intent: "capture",
    environment: paypalConfig.environment || "sandbox" // sandbox or live
  } : null;

  const handleCurrencyChange = (currency) => {
    // Track currency selection
    metrics.trackCustomEvent('payment_currency_selected', {
      selectedCurrency: currency,
      previousCurrency: selectedCurrency,
      amount: currency === "USD" ? amount : amountMXN,
      timestamp: new Date().toISOString()
    });
    
    setSelectedCurrency(currency);
    setCurrentAmount(currency === "USD" ? amount : amountMXN);
  };

  const handleCreateOrder = (data, actions) => {
    setLoading(true);
    setError(null);
    
    // Track order creation
    metrics.trackCustomEvent('paypal_order_created', {
      currency: selectedCurrency,
      amount: currentAmount,
      description: description,
      timestamp: new Date().toISOString()
    });
    
    return actions.order.create({
      purchase_units: [
        {
          description: description,
          amount: {
            currency_code: selectedCurrency,
            value: currentAmount,
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
      
      // Track successful payment
      metrics.trackCustomEvent('paypal_payment_approved', {
        orderId: data.orderID,
        payerId: data.payerID,
        paymentDetails: details,
        currency: selectedCurrency,
        amount: currentAmount,
        timestamp: new Date().toISOString()
      });
      
      // Call success callback
      if (onSuccess) {
        onSuccess(details);
      }
      
      return details;
    } catch (error) {
      setLoading(false);
      setError("Payment capture failed");
      console.error("Payment capture error:", error);
      
      // Track payment capture error
      metrics.trackCustomEvent('paypal_payment_capture_error', {
        error: error.message,
        currency: selectedCurrency,
        amount: currentAmount,
        timestamp: new Date().toISOString()
      });
      
      if (onError) {
        onError(error);
      }
    }
  };

  const handleError = (error) => {
    setLoading(false);
    setError("Payment failed");
    console.error("PayPal error:", error);
    
    // Track PayPal error
    metrics.trackCustomEvent('paypal_error', {
      error: error.message || 'Unknown PayPal error',
      currency: selectedCurrency,
      amount: currentAmount,
      timestamp: new Date().toISOString()
    });
    
    if (onError) {
      onError(error);
    }
  };

  const handleCancel = (data) => {
    setLoading(false);
    console.log("Payment cancelled:", data);
    
    // Track payment cancellation
    metrics.trackCustomEvent('paypal_payment_cancelled', {
      cancelData: data,
      currency: selectedCurrency,
      amount: currentAmount,
      timestamp: new Date().toISOString()
    });
    
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
      {/* Currency Selector */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '20px', 
        backgroundColor: '#f8fafc', 
        borderRadius: '10px',
        border: '2px solid #e3eaf3'
      }}>
        <h3 style={{ 
          margin: '0 0 15px 0', 
          color: '#2C6BA0', 
          fontSize: '1.1rem',
          fontWeight: '600'
        }}>
          {t('selectPaymentCurrency', 'Select Payment Currency')}
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleCurrencyChange('USD')}
            style={{
              flex: '1',
              minWidth: '140px',
              padding: '12px 20px',
              fontSize: '1rem',
              fontWeight: '600',
              border: selectedCurrency === 'USD' ? '2px solid #2C6BA0' : '2px solid #e3eaf3',
              borderRadius: '8px',
              backgroundColor: selectedCurrency === 'USD' ? '#eaf4fb' : '#ffffff',
              color: selectedCurrency === 'USD' ? '#2C6BA0' : '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
            onMouseOver={(e) => {
              if (selectedCurrency !== 'USD') {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.backgroundColor = '#f8fafc';
              }
            }}
            onMouseOut={(e) => {
              if (selectedCurrency !== 'USD') {
                e.currentTarget.style.borderColor = '#e3eaf3';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }
            }}
          >
            <span style={{ fontSize: '1.4rem' }}>🇺🇸</span>
            <span>{t('usdDollars', 'USD (Dollars)')}</span>
            <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>${amount}</span>
          </button>
          <button
            onClick={() => handleCurrencyChange('MXN')}
            style={{
              flex: '1',
              minWidth: '140px',
              padding: '12px 20px',
              fontSize: '1rem',
              fontWeight: '600',
              border: selectedCurrency === 'MXN' ? '2px solid #2C6BA0' : '2px solid #e3eaf3',
              borderRadius: '8px',
              backgroundColor: selectedCurrency === 'MXN' ? '#eaf4fb' : '#ffffff',
              color: selectedCurrency === 'MXN' ? '#2C6BA0' : '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
            onMouseOver={(e) => {
              if (selectedCurrency !== 'MXN') {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.backgroundColor = '#f8fafc';
              }
            }}
            onMouseOut={(e) => {
              if (selectedCurrency !== 'MXN') {
                e.currentTarget.style.borderColor = '#e3eaf3';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }
            }}
          >
            <span style={{ fontSize: '1.4rem' }}>🇲🇽</span>
            <span>{t('mxnPesos', 'MXN (Pesos)')}</span>
            <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>${amountMXN}</span>
          </button>
        </div>
      </div>

      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        border: '1px solid #e3eaf3'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#333' }}>{t('paymentDetails', 'Payment Details')}</h3>
        <p style={{ margin: '5px 0', color: '#555' }}>
          <strong>{t('amount', 'Amount')}:</strong> {selectedCurrency === 'USD' ? '$' : '$'}{currentAmount} {selectedCurrency}
        </p>
        <p style={{ margin: '5px 0', color: '#555' }}>
          <strong>{t('description', 'Description')}:</strong> {description}
        </p>
      </div>

      {error && (
        <div style={{ 
          color: '#991b1b', 
          padding: '12px', 
          marginBottom: '15px', 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca',
          borderRadius: '8px',
          fontSize: '0.95rem'
        }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '15px',
          color: '#2C6BA0',
          fontWeight: '600'
        }}>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
          {t('processingPayment', 'Processing payment...')}
        </div>
      )}

      {initialOptions && (
        <PayPalScriptProvider options={initialOptions} key={selectedCurrency}>
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