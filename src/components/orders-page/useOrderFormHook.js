import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/authConstants';
import { useLocation, useNavigate } from 'react-router-dom';

export const useOrderFormHook = onBack => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState(null);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderData, setOrderData] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showRowValueRows, setShowRowValueRows] = useState(true);
  const [formResetKey, setFormResetKey] = useState(0);
  const [editingRow, setEditingRow] = useState({
    item: null,
    delivery_date: '',
    delivery_mode: '',
    quantity: '',
    rate: '',
    amount: '',
    disc: '',
    discAmt: 0,
    splDisc: '',
    splDiscAmt: 0,
    hsn: '',
    gst: '',
    sgst: '',
    cgst: '',
    igst: '',
  });
  const [voucherType, setVoucherType] = useState('Sales Order');
  const [dbTotals, setDbTotals] = useState(null);
  const [executiveName, setExecutiveName] = useState(null);
  const [status, setStatus] = useState('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get user role properly - prioritize logged-in user over distributor user
  const getUserRole = () => {
    if (user?.role) {
      return user.role.toLowerCase();
    } else if (user?.role) {
      return user.role.toLowerCase();
    }
    return '';
  };

  const userRole = getUserRole();

  const isDistributorRoute = location.pathname.includes('/distributor');
  const isDirectRoute = location.pathname.includes('/corporate');
  const isCorporateReport = location.pathname.includes('/order-report-corporate');
  const isDistributorReport = location.pathname.includes('/order-report-distributor');
  const isReportRoute = isCorporateReport || isDistributorReport;
  const isViewOnlyReport = isCorporateReport || isDistributorReport;

  // Escape key navigation
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onBack ? onBack() : navigate(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, navigate]);

  // Create a memoized version of isTamilNaduState that includes selectedCustomer
const isTamilNaduState = useCallback(() => {
  // First check user role
  const role = userRole.toLowerCase();

  // If user is admin, we need to check the actual state but allow override
  // Admin can see both SGST/CGST and IGST based on customer state
  if (role === 'admin') {
    console.log('Admin user - checking customer state for GST calculation');

    let customerState = '';

    if (isDistributorRoute) {
      customerState = user?.state || '';
    } else {
      customerState = selectedCustomer?.state || '';
    }

    // If no customer state is available, check if we're viewing an existing order
    // that already has SGST/CGST values
    if (!customerState && orderData.length > 0) {
      // Check the first item in orderData to see if it has SGST/CGST
      const firstRow = orderData[0];
      const hasSGST = parseFloat(firstRow.sgst || 0) > 0;
      const hasCGST = parseFloat(firstRow.cgst || 0) > 0;
      
      if (hasSGST || hasCGST) {
        console.log('Admin - No customer state, but existing rows have SGST/CGST. Using SGST/CGST.');
        return true;
      }
    }

    const normalizedState = customerState.toLowerCase().trim();
    const isTamilNadu =
      normalizedState === 'tamil nadu' ||
      normalizedState === 'tn' ||
      normalizedState === 'tamilnadu';

    console.log(`Admin GST check:`, {
      customerState,
      normalizedState,
      isTamilNadu,
      orderDataLength: orderData.length,
      firstRowSGST: orderData[0]?.sgst,
      firstRowCGST: orderData[0]?.cgst
    });

    return isTamilNadu;
  }

  // Only check state for 'direct' and 'distributor' roles
  if (role !== 'direct' && role !== 'distributor') {
    console.log(`User role ${role} - state-based GST disabled`);
    return false;
  }

  let customerState = '';

  if (isDistributorRoute) {
    customerState = user?.state || '';
  } else {
    customerState = selectedCustomer?.state || '';
  }

  const normalizedState = customerState.toLowerCase().trim();
  const isTamilNadu =
    normalizedState === 'tamil nadu' ||
    normalizedState === 'tn' ||
    normalizedState === 'tamilnadu';

  console.log(`Non-admin GST check:`, {
    role,
    customerState,
    normalizedState,
    isTamilNadu,
  });

  return isTamilNadu;
}, [userRole, isDistributorRoute, user, selectedCustomer, orderData]);

  return {
    // State variables
    date,
    setDate,
    customerName,
    setCustomerName,
    orderNumber,
    setOrderNumber,
    orderData,
    setOrderData,
    remarks,
    setRemarks,
    selectedCustomer,
    setSelectedCustomer,
    showRowValueRows,
    setShowRowValueRows,
    editingRow,
    setEditingRow,
    voucherType,
    setVoucherType,
    executiveName,
    setExecutiveName,
    status,
    setStatus,
    isSubmitting,
    setIsSubmitting,
    formResetKey,
    setFormResetKey,

    // Computed values
    user,
    isDistributorRoute,
    isDirectRoute,
    isCorporateReport,
    isDistributorReport,
    isReportRoute,
    isViewOnlyReport,
    dbTotals,
    setDbTotals,

    // Navigation
    location,
    navigate,
    // User role
    userRole,
    isTamilNaduState,
  };
};
