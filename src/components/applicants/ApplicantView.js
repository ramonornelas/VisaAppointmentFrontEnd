import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { permissions, refreshPermissions } from '../../utils/permissions';
import HamburgerMenu from '../common/HamburgerMenu';
import {
  Card,
  Button,
  Space,
  Tag,
  Typography,
  Spin,
  Empty,
  Tooltip,
  Alert,
  Popover,
  Grid,
  message as antMessage,
  Modal as AntModal,
} from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  KeyOutlined,
  CopyOutlined,
  PlayCircleOutlined,
  StopOutlined,
  EnvironmentOutlined,
  CalendarTwoTone,
  InfoCircleOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import {
  ApplicantDetails,
  ApplicantDelete,
  ApplicantSearch,
  StartApplicantContainer,
  StopApplicantContainer,
  GetApplicantPassword,
} from '../../services/APIFunctions';
import { ALL_CITIES } from '../../utils/cities';
import './ApplicantView.css';
import '../../index.css';

const { useBreakpoint } = Grid;
const { Title, Text } = Typography;

const ApplicantView = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { id } = useParams();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const applicantId = id || sessionStorage.getItem('applicant_userid');
  const fastVisaUserId = sessionStorage.getItem('fastVisa_userid');
  const countryCode = sessionStorage.getItem('country_code');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [searchActionLoading, setSearchActionLoading] = useState(false);

  // Format date for display
  const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(i18n.language, options);
  };

  // Calculate search start date based on days
  const getSearchStartDate = (days) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight to avoid timezone issues
    const startDate = new Date(today);
    const daysToAdd = parseInt(days) || 3;
    startDate.setDate(startDate.getDate() + daysToAdd);
    return startDate;
  };

  // Format end date for display
  const formatEndDate = (dateString) => {
    if (!dateString) return 'N/A';
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day);
    return formatDate(date);
  };

  // Refresh permissions on component mount
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        await refreshPermissions();
      } catch (error) {
        console.error('Error refreshing permissions:', error);
      }
    };

    if (isAuthenticated) {
      loadPermissions();
    }
  }, [isAuthenticated]);

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Auto scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Store applicantId in sessionStorage if received from URL
  useEffect(() => {
    if (id && id !== sessionStorage.getItem('applicant_userid')) {
      sessionStorage.setItem('applicant_userid', id);
    }
  }, [id]);

  // Load cities
  useEffect(() => {
    const availableCities = ALL_CITIES[countryCode] || [];
    setCities(availableCities);
  }, [countryCode]);

  // Load applicant data
  useEffect(() => {
    if (applicantId) {
      setLoading(true);
      ApplicantDetails(applicantId)
        .then(response => {
          if (response && typeof response === 'object') {
            setData(response);
          }
        })
        .catch(error => {
          console.error('Error loading applicant:', error);
        })
        .finally(() => setLoading(false));
    }
  }, [applicantId, refreshFlag]);

  // Check if tooltip should be shown for premium users
  useEffect(() => {
    if (permissions.canSearchUnlimited()) {
      const tooltipShown = localStorage.getItem('premium_tooltip_shown');
      if (!tooltipShown) {
        setShowTooltip(true);
      }
    }
  }, []);

  const handleEdit = () => {
    navigate(`/applicant-form?id=${applicantId}`);
  };

  const handleDelete = () => {
    AntModal.confirm({
      title: t('deleteApplicant', 'Delete Applicant'),
      content: t('deleteApplicantConfirm', 'Are you sure you want to delete this applicant?'),
      okText: t('yes', 'Yes'),
      okType: 'danger',
      cancelText: t('no', 'No'),
      onOk: async () => {
        const isSearchRunning = data && data.search_status === 'Running';
        if (isSearchRunning) {
          return new Promise((resolve) => {
            AntModal.confirm({
              title: t('searchInProgress', 'Search in Progress'),
              content: t('stopSearchBeforeDeleting', 'Search is in progress. Do you want to stop the search before deleting?'),
              okText: t('yes', 'Yes'),
              cancelText: t('no', 'No'),
              onOk: async () => {
                try {
                  await StopApplicantContainer(applicantId);
                  AntModal.info({
                    title: t('searchStopped', 'Search Stopped'),
                    content: t('searchStoppedApplicantDeleted', 'Search stopped. The applicant will now be deleted.'),
                    okText: t('ok', 'OK'),
                    onOk: async () => {
                      try {
                        const response = await ApplicantDelete(applicantId);
                        if (response && response.success) {
                          antMessage.success(t('applicantDeletedSuccessfully', 'Applicant deleted successfully.'));
                          navigate('/applicants');
                        } else {
                          antMessage.error(t('unexpectedResponseDeleting', 'Unexpected response when deleting applicant.'));
                        }
                      } catch (err) {
                        console.error('Error deleting applicant:', err);
                        antMessage.error(t('failedToDeleteApplicant', 'Failed to delete applicant. Please try again.'));
                      }
                      resolve();
                    },
                  });
                } catch (err) {
                  antMessage.error(t('failedToStopSearchOrDelete', 'Failed to stop search or delete applicant. Please try again.'));
                  resolve();
                }
              },
              onCancel: () => resolve(),
            });
          });
        } else {
        try {
          const response = await ApplicantDelete(applicantId);
          if (response && response.success) {
            antMessage.success(t('applicantDeletedSuccessfully', 'Applicant deleted successfully.'));
            navigate('/applicants');
          } else {
            antMessage.error(t('unexpectedResponseDeleting', 'Unexpected response when deleting applicant.'));
          }
        } catch (error) {
          console.error('Error deleting applicant:', error);
          antMessage.error(t('errorDeletingApplicant', 'Error deleting applicant.'));
        }
        }
      },
    });
  };

  const handleToggleSearch = async () => {
    setSearchActionLoading(true);
    try {
      if (data.search_status === 'Stopped') {
        const concurrentLimit = parseInt(sessionStorage.getItem('concurrent_applicants'), 10);
        const applicantsResponse = await ApplicantSearch(fastVisaUserId);
        const runningCount = applicantsResponse.filter((a) => a.search_status === 'Running').length;
        if (runningCount >= concurrentLimit) {
          AntModal.warning({
            title: t('limitReached', 'Limit Reached'),
            content: t(
              'concurrentLimitMessage',
              `You have reached your concurrent applicants limit ({limit}).\nTo start a new applicant, please end one of your currently running applicants first.`
            ).replace('{limit}', concurrentLimit),
          });
          return;
        }
        await StartApplicantContainer(applicantId);
        antMessage.success(t('searchStartedSuccess', 'Search started successfully.'));
      } else {
        await StopApplicantContainer(applicantId);
        antMessage.success(t('searchStoppedSuccess', 'Search stopped successfully.'));
      }
      setRefreshFlag((flag) => !flag);
    } catch (error) {
      antMessage.error(t('errorPerformingAction', 'Error performing action.'));
      console.error(error);
    } finally {
      setSearchActionLoading(false);
    }
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(data.ais_username);
      antMessage.success(t('emailCopied', 'Email copied to clipboard'));
    } catch (error) {
      console.error('Error copying email:', error);
      antMessage.error(t('errorCopyingEmail', 'Error copying email'));
    }
  };

  const handleCopyPassword = async () => {
    try {
      const response = await GetApplicantPassword(applicantId);
      await navigator.clipboard.writeText(response.password);
      antMessage.success(t('passwordCopied', 'Password copied to clipboard'));
    } catch (error) {
      console.error('Error copying password:', error);
      antMessage.error(t('errorCopyingPassword', 'Error copying password'));
    }
  };

  const getSearchStatusColor = (status) => {
    const colors = { Running: '#2196f3', Stopped: '#ff9800', Error: '#f44336', Completed: '#4caf50' };
    return colors[status] || '#9e9e9e';
  };

  const btnSize = isMobile ? 'large' : 'middle';

  /* Desktop: grid of columns; mobile: single column */
  const cardContentStyle = isMobile
    ? { display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }
    : { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, width: '100%' };

  if (loading) {
    return (
      <>
        <HamburgerMenu />
        <div
          className="applicant-view-container"
          style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}
        >
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <Spin size="large" tip={t('loadingApplicantDetails', 'Loading applicant details...')} />
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <HamburgerMenu />
        <div
          className="applicant-view-container"
          style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('applicantNotFound', 'Applicant not found')}
          >
            {permissions.canManageApplicants() && (
              <Button type="primary" size={btnSize} onClick={() => navigate('/applicants')}>
                {t('backToApplicants', 'Back to Applicants')}
              </Button>
            )}
          </Empty>
        </div>
      </>
    );
  }

  const premiumPopoverContent = (
    <div style={{ maxWidth: 320 }}>
      <Text strong>{t('clickEditToStartTomorrow', 'Click here to start searching from tomorrow!')}</Text>
      <Button
        type="link"
        size="small"
        style={{ marginTop: 8, padding: 0 }}
        onClick={() => {
          setShowTooltip(false);
          localStorage.setItem('premium_tooltip_shown', 'true');
        }}
      >
        {t('close', 'Close')}
      </Button>
    </div>
  );

  const editButton = (
    <Button type="primary" icon={<EditOutlined />} onClick={handleEdit} size={btnSize}>
      {t('edit', 'Edit')}
    </Button>
  );

  return (
    <>
      <HamburgerMenu />
      <div
        className="applicant-view-container"
        style={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflowX: 'hidden',
          fontSize: isMobile ? 16 : undefined,
        }}
      >
        <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '2px solid #e3eaf3' }}>
          <Space
            orientation={isMobile ? 'vertical' : 'horizontal'}
            align={isMobile ? 'stretch' : 'start'}
            wrap
            style={{ width: '100%', justifyContent: 'space-between' }}
          >
            <div>
              <Title level={2} style={{ margin: 0, color: '#2C6BA0', display: 'flex', alignItems: 'center', gap: 8 }}>
                {permissions.canManageApplicants() ? <UserOutlined /> : <CalendarOutlined />}
                {permissions.canManageApplicants() ? t('applicantDetails', 'Applicant Details') : t('myAppointment', 'My Appointment')}
              </Title>
              <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                {permissions.canManageApplicants() ? t('viewManageApplicantInfo', 'View and manage applicant information') : t('viewManageAppointment', 'View and manage your appointment search')}
              </Text>
            </div>
            <Space wrap size={8} style={{ width: isMobile ? '100%' : undefined }}>
              {permissions.canManageApplicants() && (
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/applicants')} size={btnSize}>
                  {t('back', 'Back')}
                </Button>
              )}
              {showTooltip ? (
                <Popover
                  content={premiumPopoverContent}
                  trigger="click"
                  open={showTooltip}
                  onOpenChange={(open) => {
                    if (!open) {
                      setShowTooltip(false);
                      localStorage.setItem('premium_tooltip_shown', 'true');
                    }
                  }}
                >
                  {editButton}
                </Popover>
              ) : (
                editButton
              )}
              {permissions.canManageApplicants() && (
                <Button danger icon={<DeleteOutlined />} onClick={handleDelete} size={btnSize}>
                  {t('delete', 'Delete')}
                </Button>
              )}
            </Space>
          </Space>
        </div>

        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {/* Basic Information */}
          <Card
            title={
              <Space>
                <UserOutlined />
                <Typography.Title style={{ margin: 0 }} level={isMobile ? 5 : 4} strong>{t('basicInformation', 'Basic Information')}</Typography.Title>
              </Space>
            }
            style={{ width: '100%', maxWidth: '100%' }}
          >
            <div style={cardContentStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'start' }}>
                <Typography.Title type='secondary' level={5} style={{ margin: 0, display: 'block', marginBottom: 4 }}>{t('fullName', 'Full Name')}</Typography.Title>
                <Typography.Text style={{ margin: 0, fontSize: '0.875rem' }}>{data.name || 'N/A'}</Typography.Text>
              </div>
              {permissions.canManageApplicants() && (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'start' }}>
                  <Typography.Title type='secondary' level={5} style={{ margin: 0, display: 'block', marginBottom: 4 }}>{t('applicantStatus', 'Applicant Status')}</Typography.Title>
                  <Tag style={{ fontSize: '0.875rem', width: 'fit-content' }} color={data.applicant_active ? '#4caf50' : 'default'}>{data.applicant_active ? t('active', 'Active') : t('inactive', 'Inactive')}</Tag>
                </div>
              )}
              <div>
                <Typography.Title type='secondary' level={5} style={{ margin: 0, display: 'block', marginBottom: 4 }}>{t('searchStatus', 'Search Status')}</Typography.Title>
                <Space wrap style={{ justifyContent: 'start' }}>
                  <Tag style={{ fontSize: '0.875rem' }} color={getSearchStatusColor(data.search_status)}>
                    {t(data.search_status ? data.search_status.toLowerCase() : 'unknown', data.search_status || 'Unknown')}
                  </Tag>
                  <Button
                    type={data.search_status === 'Stopped' ? 'primary' : 'default'}
                    icon={data.search_status === 'Stopped' ? <PlayCircleOutlined /> : <StopOutlined />}
                    onClick={handleToggleSearch}
                    loading={searchActionLoading}
                    size={btnSize}
                    style={{ height: 'auto', padding: '4px 8px' }}
                  >
                    {data.search_status === 'Stopped' ? t('startSearch', 'Start Search') : t('stopSearch', 'Stop Search')}
                  </Button>
                </Space>
              </div>
            </div>
          </Card>

          {/* Visa Credentials */}
          <Card
            title={
              <Space>
                <KeyOutlined />
                <Typography.Title style={{ margin: 0, textWrap: 'wrap' }} level={isMobile ? 5 : 4} strong>{t('visaCredentials', 'Visa Appointment System Credentials')}</Typography.Title>
              </Space>
            }
            style={{ width: '100%', maxWidth: '100%' }}
          >
            <div style={cardContentStyle}>
              <div>
                <Typography.Title type='secondary' level={5} style={{ margin: 0, display: 'block', marginBottom: 4 }}>{t('visaEmail', 'Visa Appointment System Email')}</Typography.Title>
                <Space wrap style={{ width: '100%' }}>
                  <Typography.Text code ellipsis style={{  maxWidth: '100%', wordBreak: 'break-all' }}>{data.ais_username || 'N/A'}</Typography.Text>
                  <Space size={4}>
                    <Tooltip title={t('copyEmail', 'Copy Email')}>
                      <Button size='small' type="text" icon={<CopyOutlined />} onClick={handleCopyEmail}  aria-label={t('copyEmail', 'Copy Email')} />
                    </Tooltip>
                    <Tooltip title={t('copyPassword', 'Copy Password')}>
                      <Button size='small' type="text" icon={<KeyOutlined />} onClick={handleCopyPassword}  aria-label={t('copyPassword', 'Copy Password')} />
                    </Tooltip>
                  </Space>
                </Space>
              </div>
              <div>
                <Typography.Title type='secondary' level={5} style={{ margin: 0, display: 'block', marginBottom: 4 }}>{t('scheduleId', 'Schedule ID')}</Typography.Title>
                <Typography.Text code style={{ wordBreak: 'break-all' }}>{data.ais_schedule_id || 'N/A'}</Typography.Text>
              </div>
            </div>
          </Card>

          {/* Target Dates */}
          <Card
            title={
              <Space>
                <CalendarOutlined />
                <Typography.Title style={{ margin: 0, textWrap: 'wrap' }} level={isMobile ? 5 : 4} strong>{t('targetDates', 'Target Dates')}</Typography.Title>
              </Space>
            }
            style={{ width: '100%', maxWidth: '100%' }}
          >
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {!permissions.canSearchUnlimited() && data.target_start_mode === 'days' && data.target_start_days === '120' && (
                <Alert
                  type="info"
                  showIcon
                  icon={<InfoCircleOutlined />}
                  message={
                    <span>
                      <strong>{t('basicUserSearchSettings', 'Basic User Search Settings:')}</strong> {t('searchWillStartIn', 'Your appointment search will start 4 months from today.')}
                      {' '}
                      <strong>{t('premiumUpgradeNote', 'Premium users')}</strong> {t('premiumUsersCanSearchTomorrow', 'can search for appointments starting from tomorrow.')}{' '}
                      <a href="/premium-upgrade" onClick={(e) => { e.preventDefault(); navigate('/premium-upgrade'); window.scrollTo(0, 0); }}>{t('upgradeToPremium', 'Upgrade to Premium')}</a>
                    </span>
                  }
                />
              )}
              <div style={cardContentStyle}>
                {data.target_start_mode === 'date' && (
                  <div style={{ backgroundColor: '#fafafa', padding: 12, border: '1px solid #f0f0f0', borderRadius: 8, display: 'flex', flexDirection: 'column', justifyContent: 'start' }}>
                    <Typography.Title type='secondary' level={5} style={{ margin: 0, display: 'block', marginBottom: 4 }}>{t('targetStartDate', 'Target Start Date')}</Typography.Title>
                    <Typography.Text>{data.target_start_date || 'N/A'}</Typography.Text>
                    <Alert type="info" showIcon icon={<InfoCircleOutlined />} message={t('targetStartDateExplanationView', 'This is the earliest date the system will start searching for available appointments.')} style={{ marginTop: 8 }} />
                  </div>
                )}
                {data.target_start_mode === 'days' && (
                  <div>
                    {permissions.canManageApplicants() || data.target_start_days !== '120' ? (
                      <div style={{ backgroundColor: '#fafafa', padding: 12, border: '1px solid #f0f0f0', borderRadius: 8, display: 'flex', flexDirection: 'column', justifyContent: 'start' }}>
                        <Typography.Title type='secondary' level={5} style={{ margin: 0, display: 'block', marginBottom: 4 }}>{t('targetStartDays', 'Target Start Days')}</Typography.Title>
                        <Space wrap>
                          <Text>{data.target_start_days || 'N/A'} {t('days', 'days')}</Text>
                          {data.target_start_days && (
                            <Tag color="success">
                              <CalendarTwoTone /> {t('startDate', 'Start date')}: {formatDate(getSearchStartDate(data.target_start_days))}
                            </Tag>
                          )}
                        </Space>
                        <Alert type="info" showIcon icon={<InfoCircleOutlined />} message={t('targetStartDateExplanationView', 'This is the earliest date the system will start searching for available appointments.')} style={{ marginTop: 8 }} />
                      </div>
                    ) : (
                      <>
                        <Typography.Title type='secondary' level={5} style={{ margin: 0, display: 'block', marginBottom: 4 }}>{t('searchStartsIn', 'Search Starts In')}</Typography.Title>
                        <div style={{ padding: 12, background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8 }}>
                          <Typography.Text>{t('fourMonthsFromToday', '4 months from today (120 days)')}</Typography.Text>
                          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
                            <Typography.Text strong>{t('startDate', 'Start date')}: {formatDate(getSearchStartDate(data.target_start_days))}</Typography.Text>
                          </div>
                          <Alert type="info" showIcon icon={<InfoCircleOutlined />} message={t('targetStartDateExplanationView', 'This is the earliest date the system will start searching for available appointments.')} style={{ marginTop: 12 }} />
                        </div>
                      </>
                    )}
                  </div>
                )}
                <div style={{ backgroundColor: '#fafafa', padding: 12, border: '1px solid #f0f0f0', borderRadius: 8, display: 'flex', flexDirection: 'column', justifyContent: 'start' }}>
                  <Typography.Title type='secondary' level={5} style={{ margin: 0, display: 'block', marginBottom: 4 }}>{t('targetEndDate', 'Target End Date')}</Typography.Title>
                  {data.target_end_date ? (
                    <>
                      <Typography.Text>{formatEndDate(data.target_end_date)}</Typography.Text>
                      <Alert type="info" showIcon icon={<InfoCircleOutlined />} message={t('targetEndDateExplanation', 'This is the latest date you would accept for an appointment. The search will look for appointments between 4 months from now and this date.')} style={{ marginTop: 8 }} />
                    </>
                  ) : (
                    <Typography.Text>{data.target_end_date || 'N/A'}</Typography.Text>
                  )}
                </div>
              </div>
            </Space>
          </Card>

          {/* Target Cities */}
          {cities.length > 0 && (
            <Card
              title={
                <Space>
                  <EnvironmentOutlined />
                  <Typography.Title style={{ margin: 0, textWrap: 'wrap' }} level={isMobile ? 5 : 4} strong>{t('targetCities', 'Target Cities')}</Typography.Title>
                </Space>
              }
              style={{ width: '100%', maxWidth: '100%' }}
            >
              {data.target_city_codes && data.target_city_codes.split(',').filter(Boolean).length > 0 ? (
                <Space wrap size={[8, 8]}>
                  {data.target_city_codes.split(',').filter(Boolean).map((code) => {
                    const city = cities.find((c) => c.city_code === code);
                    return (
                      <Tag key={code} color="blue">
                        {city ? city.city_name : code} ({code})
                      </Tag>
                    );
                  })}
                </Space>
              ) : (
                <Alert
                  type="info"
                  showIcon
                  icon={<GlobalOutlined />}
                  message={
                    <span>
                      <strong>{t('searchAllCities', 'Search in all cities:')}</strong> {t('searchPerformedAllCities', 'The search will be performed in all available cities for this country.')}
                      {!permissions.canManageApplicants() && (
                        <span style={{ display: 'block', marginTop: 8 }}>
                          <strong>{t('premiumUsers', 'Premium users')}</strong> {t('canSelectSpecificCities', 'can select specific cities for their search.')}
                        </span>
                      )}
                    </span>
                  }
                />
              )}
            </Card>
          )}

          {/* Reserved Appointments */}
          {(data.consul_appointment_date || data.asc_appointment_date) && (
            <Card
              title={
                <Space>
                  <CalendarTwoTone />
                  <Typography.Title style={{ margin: 0, textWrap: 'wrap' }} level={isMobile ? 5 : 4} strong>{t('reservedAppointments', 'Reserved Appointments')}</Typography.Title>
                </Space>
              }
              style={{ width: '100%', maxWidth: '100%' }}
            >
              <div style={cardContentStyle}>
                <div>
                  <Typography.Title type='secondary' level={5} style={{ margin: 0, display: 'block', marginBottom: 4 }}>{t('consulateAppointmentDate', 'Consulate Appointment Date')}</Typography.Title>
                  <Text>{data.consul_appointment_date || t('notSet', 'Not set')}</Text>
                </div>
                <div>
                  <Typography.Title type='secondary' level={5} style={{ margin: 0, display: 'block', marginBottom: 4 }}>{t('ascAppointmentDate', 'ASC Appointment Date')}</Typography.Title>
                  <Text>{data.asc_appointment_date || t('notSet', 'Not set')}</Text>
                </div>
              </div>
            </Card>
          )}
        </Space>
      </div>
    </>
  );
};

export default ApplicantView;
