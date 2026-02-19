import api from '../../services/api';

// Client-side fallback (should rarely be used)
export const generateClientSideOrderNumber = () => {
  const today = new Date();
  const day = today.getDate().toString().padStart(2, '0');
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const year = today.getFullYear().toString().slice(-2);

  // Generate a random suffix to prevent collisions
  const randomSuffix = Math.floor(Math.random() * 9000 + 1000);
  return `SQ-${day}-${month}-${year}-${randomSuffix}`;
};

// Fetch order number from server (primary method)
export const fetchOrderNumberFromServer = async () => {
  try {
    const response = await api.get('/orders/next-order-number');
    return {
      orderNumber: response.data.orderNumber,
      success: true,
    };
  } catch (error) {
    console.error('Error fetching order number from server:', error);

    // Fallback to client-side generation
    const fallbackOrderNumber = generateClientSideOrderNumber();
    return {
      orderNumber: fallbackOrderNumber,
      success: false,
      error: error.message,
    };
  }
};

// Format Currency
export const formatCurrency = value => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  })
    .format(value || 0)
    .replace(/^₹/, '₹ ');
};

// Format date to DD-MM-YYYY
export const formatDateToDDMMYYYYSimple = dateStr => {
  if (!dateStr || typeof dateStr !== 'string') return '';

  const cleanedStr = dateStr.trim();

  if (/^\d{2}-\d{2}-\d{4}$/.test(cleanedStr)) {
    return cleanedStr;
  }

  const numbers = cleanedStr.match(/\d+/g);
  if (!numbers || numbers.length < 3) return cleanedStr;

  let day, month, year;

  if (numbers[2].length === 2) {
    const shortYear = parseInt(numbers[2]);
    year = shortYear < 50 ? 2000 + shortYear : 1900 + shortYear;
  } else if (numbers[2].length === 4) {
    year === numbers[2];
  } else {
    return cleanedStr;
  }

  if (parseInt(numbers[0]) <= 31 && parseInt(numbers[1]) <= 12) {
    day = numbers[0];
    month = numbers[1];
  } else if (parseInt(numbers[0]) <= 12 && parseInt(numbers[1]) <= 31) {
    day = numbers[1];
    month = numbers[0];
  } else {
    day = numbers[0];
    month = numbers[1];
  }

  day = day.padStart(2, '0');
  month = month.padStart(2, '0');

  return `${day}-${month}-${year}`;
};

// Validate future date
export const validateFutureDate = dateStr => {
  if (!dateStr) return false;
  const normalizedDate = formatDateToDDMMYYYYSimple(dateStr);
  if (!normalizedDate) return false;

  const parts = normalizedDate.split('-');
  if (parts.length !== 3) return false;

  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const year = parseInt(parts[2]);

  const inputDate = new Date(year, month, day);
  const today = new Date();

  const inputDateStart = new Date(
    inputDate.getFullYear(),
    inputDate.getMonth(),
    inputDate.getDate(),
  );
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return inputDateStart >= todayStart;
};

// Add this missing function for date conversion
export const convertToMySQLDate = (dateStr) => {
  if (!dateStr || dateStr === '') return null;

  try {
    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const [dd, mm, yyyy] = dateStr.split('-');
      return `${yyyy}-${mm}-${dd}`;
    }

    // DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [dd, mm, yyyy] = dateStr.split('/');
      return `${yyyy}-${mm}-${dd}`;
    }

    // ISO string
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0];
    }

    // Fallback
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }

    return null;
  } catch (err) {
    console.error('Date conversion error:', err);
    return null;
  }
};

export const formatDateForInput = dateString => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

export const transformOrderData = apiData => {
  // Get the first item to extract total fields (same for all rows in an order)
  const firstItem = apiData[0] || {};

  return apiData.map(item => ({
    id: item.ID,
    item: {
      item_code: item.ITEM_CODE,
      stock_item_name: item.ITEM_NAME,
      hsn_code: item.HSN,
      gst: item.GST,
      uom: item.UOM,
      rate: item.RATE,
    },
    itemCode: item.ITEM_CODE,
    itemName: item.ITEM_NAME,
    hsn: item.HSN,
    gst: item.GST,
    sgst: item.SGST || 0,
    cgst: item.CGST || 0,
    igst: item.IGST || 0,
    delivery_date: formatOracleDate(item.DELIVERY_DATE) || '',
    delivery_mode: item.DELIVERY_MODE || '',
    itemQty: item.QUANTITY,
    uom: item.UOM,
    rate: item.RATE,
    amount: item.AMOUNT,
    disc: item.DISC_PERCENTAGE || 0,
    discAmt: item.DISC_AMOUNT || 0,
    splDisc: item.SPL_DISC_PERCENTAGE || 0,
    splDiscAmt: item.SPL_DISC_AMOUNT || 0,
    netRate: item.NET_RATE || item.RATE,
    grossAmount: item.GROSS_AMOUNT || item.AMOUNT,

    // NEW: Add total fields from database
    total_sgst_amount: firstItem.TOTAL_SGST_AMOUNT || 0,
    total_cgst_amount: firstItem.TOTAL_CGST_AMOUNT || 0,
    total_igst_amount: firstItem.TOTAL_IGST_AMOUNT || 0,
    total_quantity: firstItem.TOTAL_QUANTITY || 0,
    total_amount_without_tax: firstItem.TOTAL_AMOUNT_WITHOUT_TAX || 0,
    total_amount: firstItem.TOTAL_AMOUNT || 0,
  }));
};

// Custom styles for table selects
export const tableSelectStyles = {
  control: base => ({
    ...base,
    minHeight: '24px',
    height: '24px',
    lineHeight: '1',
    padding: '0 1px',
    width: '100%',
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#932F67',
    },
  }),
  menu: base => ({
    ...base,
    width: '445px',
    height: '68vh',
    fontSize: '12px',
    zIndex: 9999,
    position: 'absolute',
  }),
  menuList: base => ({
    ...base,
    maxHeight: '68vh',
    padding: 0,
  }),
  menuPortal: base => ({
    ...base,
    zIndex: 9999,
  }),
  option: base => ({
    ...base,
    padding: '3px 20px',
    fontSize: '11.5px',
    fontFamily: 'font-amasis',
    fontWeight: '600',
  }),
  valueContainer: base => ({
    ...base,
    padding: '0px 4px',
    height: '20px',
  }),
  input: base => ({
    ...base,
    margin: 0,
    padding: 0,
    fontSize: '11.5px',
  }),
  singleValue: base => ({
    ...base,
    fontSize: '11.5px', // Add this for the selected value
    lineHeight: '1.2',
  }),
};

export const formatDate = dateString => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};


export const formatOracleDate = (dateValue) => {
  if (!dateValue) return '';

  // Oracle DATE comes as ISO string: YYYY-MM-DDTHH:mm:ss.sssZ
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateValue);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}-${month}-${year}`; // DD-MM-YYYY
  }

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [year, month, day] = dateValue.split('-');
    return `${day}-${month}-${year}`;
  }

  return dateValue;
};

export const convertToOracleDateString = (dateStr) => {
  if (!dateStr) return null;

  // DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [dd, mm, yyyy] = dateStr.split('-');
    return `${yyyy}-${mm}-${dd}`;
  }

  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [dd, mm, yyyy] = dateStr.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  return null;
};

