import { useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  convertToMySQLDate,
  convertToOracleDateString,
  formatCurrency,
  formatDateForInput,
  generateClientSideOrderNumber,
  transformOrderData,
} from './orderUtils';
import { toast } from 'react-toastify';
import OrderHeader from './OrderHeader';
import OrderTable from './OrderTable';
import OrderFooter from './OrderFooter';
import api from '../../services/api';
import { useOrderFormHook } from './useOrderFormHook';

const NewOrder = ({ onBack }) => {
  const { orderNumberFetch } = useParams();
  // Use the custom hook
  const {
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
    user,
    isDistributorRoute,
    isDirectRoute,
    isCorporateReport,
    isDistributorReport,
    isReportRoute,
    isViewOnlyReport,
    location,
    navigate,
    dbTotals,
    setDbTotals,
    userRole,
    isTamilNaduState,
  } = useOrderFormHook(onBack);

  const isDistributorOrder = location.pathname.includes('/distributor');
  const isDirectOrder = location.pathname.includes('/corporate');
  const isOrderReportApproved = location.pathname.includes('/order-report-approved');
  const mode = isReportRoute || orderNumberFetch ? 'update' : 'create';

  const editingRowSelectRef = useRef(null);
  const customerSelectRef = useRef(null);
  const addButtonRef = useRef(null);

  console.log('User Details here:', user);

  const handleBackClick = () => {
    const confirmLeave = window.confirm(
      mode === 'update'
        ? 'Do you want to leave without saving changes?'
        : 'Do you want to leave this order?',
    );

    if (!confirmLeave) return;

    if (typeof onBack === 'function') {
      onBack();
    } else {
      navigate(-1);
    }
  };

  useEffect(() => {
    // Show rows only when we have data or are in create mode
    const shouldShowRows = orderData.length > 0 || mode === 'create';
    setShowRowValueRows(shouldShowRows);
  }, [orderData.length, mode]);

  // Fetch order details
useEffect(() => {
  if (mode !== 'update') return;

  const fetchOrderDetails = async () => {
    try {
      const response = await api.get(`orders-by-number/${orderNumberFetch}`);
      const fetchedOrderData = response.data;

      // Check if data exists in the expected format
      if (fetchedOrderData?.data?.length) {
        const apiData = fetchedOrderData.data;
        const transformedData = transformOrderData(apiData);
        setOrderData(transformedData);

        // Log to check what GST type the fetched data has
        transformedData.forEach((row, index) => {
          console.log(`Row ${index} GST type:`, {
            sgst: row.sgst,
            cgst: row.cgst,
            igst: row.igst,
            gst: row.gst,
          });
        });

        // IMPORTANT: Use apiData instead of fetchedOrderData
        const firstItem = apiData[0];
        
        console.log('First item from API:', firstItem); // Debug log
        
        setVoucherType(firstItem.VOUCHER_TYPE || 'Sales Order');
        setCustomerName({
          customer_code: firstItem.CUSTOMER_CODE,
          customer_name: firstItem.CUSTOMER_NAME,
        });
        setExecutiveName({ customer_name: firstItem.EXECUTIVE });
        setDate(formatDateForInput(firstItem.ORDER_DATE || firstItem.CREATED_AT));
        setStatus(firstItem.STATUS || 'pending');
        setRemarks(firstItem.REMARKS || '');

        // Extract totals from the first item
        const dbTotals = {
          qty: firstItem.TOTAL_QUANTITY || 0,
          amount: firstItem.TOTAL_AMOUNT_WITHOUT_TAX || 0,
          sgstAmt: firstItem.TOTAL_SGST_AMOUNT || 0,
          cgstAmt: firstItem.TOTAL_CGST_AMOUNT || 0,
          igstAmt: firstItem.TOTAL_IGST_AMOUNT || 0,
          totalAmount: firstItem.TOTAL_AMOUNT || 0,
        };

        console.log('Database totals extracted:', dbTotals); // Debug log
        
        // Set the totals directly instead of calculating
        setDbTotals(dbTotals);
      } else {
        console.log('No data found or empty array:', fetchedOrderData);
        toast.error('No data found for this order.');
      }
    } catch (error) {
      console.error('Error in fetchOrderDetails:', error);
      console.error('Error response:', error.response?.data);
      toast.error(`Failed to load order details: ${error.message}`);
    }
  };

  fetchOrderDetails();
}, [mode, orderNumberFetch]);

  // Rest of your useEffect hooks remain the same
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Focus management running');

      if (isDistributorRoute) {
        if (editingRowSelectRef.current) {
          editingRowSelectRef.current.focus();
          console.log('Focused editing row for distributor');
        }
      } else if (isDirectRoute) {
        if (!customerName) {
          if (customerSelectRef.current) {
            customerSelectRef.current.focus();
            console.log('Focused customer select (no customer yet)');
          }
        } else {
          if (editingRowSelectRef.current) {
            editingRowSelectRef.current.focus();
            console.log('Focused editing row (customer selected)');
          }
        }
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [isDistributorRoute, isDirectRoute, customerName, location.pathname, formResetKey]);

  // Initialize order number
  useEffect(() => {
    if (mode === 'create') {
      const newOrderNumber = generateClientSideOrderNumber();
      setOrderNumber(newOrderNumber);
    } else {
      setOrderNumber(orderNumberFetch);
    }
  }, [mode, date, orderNumberFetch]);

  // Handle customer selection
  const handleCustomerSelect = selected => {
    setCustomerName(selected);
    setSelectedCustomer(selected);
  };

  // Handle remarks textarea key events
  const handleRemarksKeyDown = e => {
    const key = e.key;

    if (key === 'ArrowUp') {
      e.preventDefault();
      addButtonRef.current?.focus();
    } else if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowDown') {
      // Allow normal text navigation
    } else if (key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const statusSelect = document.querySelector('select[disabled]');
      if (statusSelect) {
        statusSelect.focus();
      }
    } else if (key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      addButtonRef.current?.focus();
    }
  };

  // Debug log to check values
  useEffect(() => {
    console.log('Debug - Current values:', {
      userRole,
      isDistributorRoute,
      selectedCustomer: selectedCustomer?.state,
      user: user?.state,
      isTamilNadu: isTamilNaduState(),
    });
  }, [userRole, isDistributorRoute, selectedCustomer, user, isTamilNaduState]);

  // calculate totals - ALWAYS calculate dynamically, even in update mode
  const totals = useMemo(() => {
    if (mode === 'update' && dbTotals && orderData.length === 0) {
      console.log('Initial load - Using database totals:', dbTotals);
      return {
        qty: parseFloat(dbTotals.qty) || 0,
        amount: parseFloat(dbTotals.amount) || 0,
        discAmt: parseFloat(dbTotals.discAmt) || 0,
        splDiscAmt: parseFloat(dbTotals.splDiscAmt) || 0,
        sgstAmt: parseFloat(dbTotals.sgstAmt) || 0,
        cgstAmt: parseFloat(dbTotals.cgstAmt) || 0,
        igstAmt: parseFloat(dbTotals.igstAmt) || 0,
        totalAmount: parseFloat(dbTotals.totalAmount) || 0,
        baseAmount: parseFloat(dbTotals.amount) || 0, // Add baseAmount for consistency
      };
    }

    // Calculate totals including discounts - DYNAMIC CALCULATION
    console.log(
      'Calculating dynamic totals for mode:',
      mode,
      'Order data length:',
      orderData.length,
    );

    let totalQty = 0;
    let totalBaseAmount = 0; // Amount before discounts(qty * rate)
    let totalDiscAmt = 0;
    let totalSplDiscAmt = 0;
    let totalSgstAmt = 0;
    let totalCgstAmt = 0;
    let totalIgstAmt = 0;
    let totalAmount = 0; // Final amount after discounts and GST

    // Calculate for existing rows
    orderData.forEach(row => {
      const qty = parseFloat(row.itemQty) || 0;
      const rate = parseFloat(row.rate) || 0;
      totalQty += qty;

      const baseAmount = qty * rate;
      totalBaseAmount += baseAmount;

      const discAmt = parseFloat(row.discAmt) || 0;
      const splDiscAmt = parseFloat(row.splDiscAmt) || 0;

      totalDiscAmt += discAmt;
      totalSplDiscAmt += splDiscAmt;

      // const discountedAmount = baseAmount - discAmt - splDiscAmt;

      // Add GST amounts
      totalSgstAmt += parseFloat(row.sgst) || 0;
      totalCgstAmt += parseFloat(row.cgst) || 0;
      totalIgstAmt += parseFloat(row.igst) || 0;

      // Add final amount (should match row.amount)
      totalAmount += parseFloat(row.amount) || 0;
    });

    // Calculate for editing row if it has data
    let editingRowQty = 0;
    let editingRowBaseAmount = 0;
    let editingRowDiscAmt = 0;
    let editingRowSplDiscAmt = 0;
    let editingRowSgst = 0;
    let editingRowCgst = 0;
    let editingRowIgst = 0;
    let editingRowAmount = 0;

    const hasEditingRowData = editingRow.item && editingRow.quantity;
    if (hasEditingRowData) {
      editingRowQty = parseFloat(editingRow.quantity) || 0;
      const editingRowRate = parseFloat(editingRow.rate) || 0;
      editingRowBaseAmount = editingRowQty * editingRowRate;

      editingRowDiscAmt = parseFloat(editingRow.discAmt) || 0;
      editingRowSplDiscAmt = parseFloat(editingRow.splDiscAmt) || 0;

      editingRowSgst = parseFloat(editingRow.sgst) || 0;
      editingRowCgst = parseFloat(editingRow.cgst) || 0;
      editingRowIgst = parseFloat(editingRow.igst) || 0;

      editingRowAmount = parseFloat(editingRow.amount) || 0;
    }

    // Combine totals including editing row
    const finalTotalQty = totalQty + editingRowQty;
    const finalTotalBaseAmount = totalBaseAmount + editingRowBaseAmount;
    const finalTotalDiscAmt = totalDiscAmt + editingRowDiscAmt;
    const finalTotalSplDiscAmt = totalSplDiscAmt + editingRowSplDiscAmt;
    const finalTotalSgstAmt = totalSgstAmt + editingRowSgst;
    const finalTotalCgstAmt = totalCgstAmt + editingRowCgst;
    const finalTotalIgstAmt = totalIgstAmt + editingRowIgst;
    const finalTotalAmount = totalAmount + editingRowAmount;

    // Calculate amount without tax (after discounts, before GST)
    const amountWithoutTax = finalTotalBaseAmount - finalTotalDiscAmt - finalTotalSplDiscAmt;

    // Verify calculation: amountWithoutTax + GST should equal totalAmount
    const calculatedTotalAmount =
      amountWithoutTax + finalTotalSgstAmt + finalTotalCgstAmt + finalTotalIgstAmt;

    console.log('Dynamic Totals Calculation for mode', mode, ':', {
      finalTotalQty,
      finalTotalBaseAmount,
      finalTotalDiscAmt,
      finalTotalSplDiscAmt,
      amountWithoutTax,
      finalTotalSgstAmt,
      finalTotalCgstAmt,
      finalTotalIgstAmt,
      finalTotalAmount,
      calculatedTotalAmount,
      difference: Math.abs(finalTotalAmount - calculatedTotalAmount),
      orderDataLength: orderData.length,
      hasEditingRowData,
    });

    return {
      qty: finalTotalQty,
      amount: amountWithoutTax, // Amount after discounts, before GST
      baseAmount: finalTotalBaseAmount, // Amount before any discounts
      discAmt: finalTotalDiscAmt,
      splDiscAmt: finalTotalSplDiscAmt,
      sgstAmt: finalTotalSgstAmt,
      cgstAmt: finalTotalCgstAmt,
      igstAmt: finalTotalIgstAmt,
      totalAmount: finalTotalAmount, // Final amount after discounts and GST
      calculatedTotalAmount, // For debugging
    };
  }, [orderData, editingRow, isTamilNaduState, mode, dbTotals]);

  // Add this useEffect to debug totals changes
  useEffect(() => {
    console.log('=== TOTALS DEBUG ===');
    console.log(
      'Order Data:',
      orderData.map(row => ({
        item: row.itemName,
        qty: row.itemQty,
        rate: row.rate,
        baseAmount: (parseFloat(row.itemQty) || 0) * (parseFloat(row.rate) || 0),
        disc: row.disc,
        discAmt: row.discAmt,
        splDisc: row.splDisc,
        splDiscAmt: row.splDiscAmt,
        sgst: row.sgst,
        cgst: row.cgst,
        igst: row.igst,
        amount: row.amount,
        netRate: row.netRate,
        grossAmount: row.grossAmount,
      })),
    );
    console.log('Editing Row:', editingRow);
    console.log('Calculated Totals:', totals);
  }, [orderData, editingRow, totals]);

  const handlePrimaryAction = e => {
    if (mode === 'update') {
      handleUpdate(e);
    } else {
      handleSubmit(e);
    }
  };

  const handleUpdate = async e => {
    e.preventDefault();
    const confirmation = window.confirm(`Are you sure you want to update Order ${orderNumber}?`);

    if (!confirmation) return;

    setIsSubmitting(true);
    try {
      console.log('Update - Current totals:', totals);
      console.log('Update - Order data:', orderData);

      // Prepare the payload array
      const updates = [];

      // Process orderData to create payload
      orderData.forEach(item => {
        const rowData = {
          // For existing rows, include id; for new rows, don't include id
          ...(item.id && { id: item.id }),

          // Row-specific data
          status: status,
          disc_percentage: Number(item.disc) || 0,
          disc_amount: Number(item.discAmt) || 0,
          spl_disc_percentage: Number(item.splDisc) || 0,
          spl_disc_amount: Number(item.splDiscAmt) || 0,
          net_rate: Number(item.netRate) || 0,
          gross_amount: Number(item.grossAmount) || 0,
          quantity: Number(item.itemQty) || 0,
          gst: Number(item.gst || 0),
          sgst: Number(item.sgst || 0),
          cgst: Number(item.cgst || 0),
          igst: Number(item.igst || 0),
          hsn: item.hsn || '',
          rate: Number(item.rate || 0),
          amount: Number(item.amount || 0),
          uom: item.uom || '',
          delivery_date: convertToOracleDateString(item.delivery_date),
          delivery_mode: item.delivery_mode || '',
          transporter_name: item.transporter_name || '',
          item_code: item.itemCode || '',
          item_name: item.itemName || '',

          // Common order details
          voucher_type: voucherType,
          order_date: date, // Changed from 'date' to 'order_date' to match backend
          customer_code: customerName?.customer_code || user?.customer_code || '',
          customer_name: customerName?.customer_name || user?.customer_name || '',
          executive: executiveName?.customer_name || user?.username || '',
          role: user?.role || '',

          // Totals
          total_quantity: totals.qty,
          total_amount_without_tax: totals.amount,
          total_amount: totals.totalAmount,
          total_sgst_amount: totals.sgstAmt,
          total_cgst_amount: totals.cgstAmt,
          total_igst_amount: totals.igstAmt,
          remarks: remarks || '',
        };

        // If this is a deleted row (marked for deletion), add _deleted flag
        if (item._deleted && item.id) {
          rowData._deleted = true;
        }

        updates.push(rowData);
      });

      // IMPORTANT: Also include the editing row if it has data (for new item addition)
      const hasEditingRowData = editingRow.item && editingRow.quantity;
      if (hasEditingRowData) {
        // Create new row without id
        const newRow = {
          // No id field - this signals it's a new row
          status: status,
          disc_percentage: Number(editingRow.disc) || 0,
          disc_amount: Number(editingRow.discAmt) || 0,
          spl_disc_percentage: Number(editingRow.splDisc) || 0,
          spl_disc_amount: Number(editingRow.splDiscAmt) || 0,
          net_rate: Number(editingRow.netRate) || 0,
          gross_amount: Number(editingRow.grossAmount) || 0,
          quantity: Number(editingRow.quantity) || 0,
          gst: Number(editingRow.gst || 0),
          sgst: Number(editingRow.sgst || 0),
          cgst: Number(editingRow.cgst || 0),
          igst: Number(editingRow.igst || 0),
          hsn: editingRow.hsn || editingRow.item?.hsn_code || '',
          rate: Number(editingRow.rate || 0),
          amount: Number(editingRow.amount || 0),
          uom: editingRow.item?.uom || 'Nos',
          delivery_date: convertToOracleDateString(editingRow.delivery_date),
          delivery_mode: editingRow.delivery_mode || '',
          transporter_name: editingRow.transporter_name || '',
          item_code: editingRow.item?.item_code || '',
          item_name: editingRow.item?.stock_item_name || '',

          // Common order details
          voucher_type: voucherType,
          order_date: date,
          customer_code: customerName?.customer_code || user?.customer_code || '',
          customer_name: customerName?.customer_name || user?.customer_name || '',
          executive: executiveName?.customer_name || user?.username || '',
          role: user?.role || '',

          // Totals
          total_quantity: totals.qty,
          total_amount_without_tax: totals.amount,
          total_amount: totals.totalAmount,
          total_sgst_amount: totals.sgstAmt,
          total_cgst_amount: totals.cgstAmt,
          total_igst_amount: totals.igstAmt,
          remarks: remarks || '',
        };

        updates.push(newRow);
      }

      console.log('Sending update for order:', orderNumber);
      console.log('Update payload breakdown:', {
        totalItems: updates.length,
        existingWithId: updates.filter(item => item.id).length,
        newWithoutId: updates.filter(item => !item.id).length,
        deleted: updates.filter(item => item._deleted).length,
      });

      // Log a sample payload to see structure
      console.log('Sample payload item:', updates[0]);

      const response = await api.put(`/orders-by-number/${orderNumber}`, updates);
      console.log('Update response:', response.data);

      if (response.data.success) {
        toast.success(`Order ${orderNumber} updated successfully!`);
        // Option 1: Refresh the page to get new IDs
        window.location.reload();
        // Option 2: Navigate back
        // navigate(-1);
      } else {
        toast.error(`Update failed: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      console.error('Error response:', error.response?.data);

      if (error.response?.data?.message) {
        toast.error(`Update failed: ${error.response.data.message}`);
      } else {
        toast.error('Failed to update order. Please check console for details.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const postOrder = async payload => {
    try {
      console.log('Sending order payload:', payload);
      const response = await api.post('/orders', payload);
      console.log('Order response:', response);
      return response.data;
    } catch (error) {
      console.error('Error placing order:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  };

  // Handle form submission
  const handleSubmit = async e => {
    e.preventDefault();

    const confirmation = window.confirm('Are you sure you want to submit this order?');
    if (!confirmation) return;

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Validation
      if (!isDistributorRoute && !customerName) {
        toast.error('Please select a customer name.');
        setIsSubmitting(false);
        return;
      }

      const hasEditingRowData = editingRow.item && editingRow.quantity;
      if (!orderData.length && !hasEditingRowData) {
        toast.error('No items in the order.');
        setIsSubmitting(false);
        return;
      }

      // Additional validation for editing row
      if (hasEditingRowData) {
        if (!editingRow.delivery_date || editingRow.delivery_date.trim() === '') {
          toast.error('Please enter delivery date for the current item!');
          setIsSubmitting(false);
          return;
        }
        if (!editingRow.delivery_mode || editingRow.delivery_mode.trim() === '') {
          toast.error('Please enter delivery mode for the current item!');
          setIsSubmitting(false);
          return;
        }
      }

      // Validate existing rows
      for (const row of orderData) {
        if (!row.delivery_date || row.delivery_date.trim() === '') {
          toast.error(`Please enter delivery date for item: ${row.itemName}`);
          setIsSubmitting(false);
          return;
        }
        if (!row.delivery_mode || row.delivery_mode.trim() === '') {
          toast.error(`Please enter delivery mode for item: ${row.itemName}`);
          setIsSubmitting(false);
          return;
        }
      }

      const voucherType = isDirectRoute
        ? 'Direct Order Management'
        : isDistributorRoute
        ? 'Distributor Order-Web Based'
        : 'Sales Order';

      const customer = isDistributorRoute
        ? {
            customer_code: user?._userData?.customer_code || 'DISTRIBUTOR',
            customer_name: user?._userData?.customer_name || 'Distributor User',
          }
        : {
            customer_code: customerName?.customer_code || '',
            customer_name: customerName?.customer_name || '',
          };

      // Prepare rows array
      const rows = [...orderData];

      // Add editing row if it has data
      if (hasEditingRowData) {
        // Validate editing row rate and amount
        const rate = Number(editingRow.rate) || 0;
        const quantity = Number(editingRow.quantity) || 0;
        const amount = rate * quantity;

        // Ensure GST values are properly set
        const gstPercentage = Number(editingRow.gst) || 18;
        const gstAmount = amount * (gstPercentage / 100);

        let sgst = 0;
        let cgst = 0;
        let igst = 0;

        if (isTamilNaduState()) {
          const halfGST = gstAmount / 2;
          sgst = halfGST;
          cgst = halfGST;
          igst = 0;
        } else {
          sgst = 0;
          cgst = 0;
          igst = gstAmount;
        }

        rows.push({
          item: editingRow.item,
          itemCode: editingRow.item.item_code,
          itemName: editingRow.item.stock_item_name,
          hsn: editingRow.hsn || editingRow.item.hsn_code || '',
          gst: gstPercentage,
          sgst: sgst.toFixed(2),
          cgst: cgst.toFixed(2),
          igst: igst.toFixed(2),
          delivery_date: editingRow.delivery_date,
          delivery_mode: editingRow.delivery_mode,
          itemQty: quantity,
          uom: editingRow.item.uom || 'Nos',
          rate: rate,
          amount: amount,
          netRate: rate,
          grossAmount: amount,
        });
      }

      // Log rows for debugging
      console.log('Rows to submit:', rows);

      // Prepare payload
      const payload = rows.map((item) => ({
        voucher_type: voucherType,
        order_no: orderNumber,
        date: date,
        status: 'pending',
        executiveCode: user?.customer_code || '',
        executive: user?.customer_name || user?.username || '',
        role: user?.role || '',
        ...customer,
        item_code: item.itemCode,
        item_name: item.itemName,
        hsn: item.hsn,
        gst: Number(item.gst || 0),
        sgst: Number(item.sgst || 0),
        cgst: Number(item.cgst || 0),
        igst: Number(item.igst || 0),
        delivery_date: convertToMySQLDate(item.delivery_date),
        delivery_mode: item.delivery_mode,
        quantity: Number(item.itemQty || 0),
        uom: item.uom,
        rate: Number(item.rate || 0),
        amount: Number(item.amount || 0),
        net_rate: Number(item.netRate || 0),
        gross_amount: Number(item.grossAmount || 0),
        disc_percentage: Number(item.disc || 0),
        disc_amount: Number(item.discAmt || 0),
        spl_disc_percentage: Number(item.splDisc || 0),
        spl_disc_amount: Number(item.splDiscAmt || 0),
        total_quantity: totals.qty,
        total_disc_amount: totals.discAmt || 0,
        total_spl_disc_amount: totals.splDiscAmt || 0,
        total_amount_without_tax: totals.amount,
        total_cgst_amount: totals.cgstAmt,
        total_sgst_amount: totals.sgstAmt,
        total_igst_amount: totals.igstAmt,
        total_amount: totals.totalAmount,
        remarks: remarks || '',
      }));

      // Log final payload
      console.log('Final payload:', payload);

      // Check if payload is empty
      if (payload.length === 0) {
        toast.error('No items to submit!');
        setIsSubmitting(false);
        return;
      }

      // Submit order
      await postOrder(payload);

      toast.success(`Order ${orderNumber} placed successfully!`);

      // Reset form after successful submission
      resetForm();
    } catch (error) {
      console.error('Submission error:', error);

      // More specific error messages
      if (error.response) {
        // Server responded with error status
        const serverError = error.response.data;
        console.error('Server error response:', serverError);

        if (serverError.message) {
          toast.error(`Server Error: ${serverError.message}`);
        } else if (serverError.error) {
          toast.error(`Server Error: ${serverError.error}`);
        } else {
          toast.error('Error placing order. Please check console for details.');
        }
      } else if (error.request) {
        // Request was made but no response
        console.error('No response received:', error.request);
        toast.error('No response from server. Please check your connection.');
      } else {
        // Something else happened
        console.error('Error setting up request:', error.message);
        toast.error(`Error: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setOrderData([]);
    setEditingRow({
      item: null,
      delivery_date: '',
      delivery_mode: '',
      quantity: '',
      rate: '',
      amount: '',
      hsn: '',
      gst: '',
      sgst: '',
      cgst: '',
      igst: '',
    });

    setRemarks('');
    setDate(new Date().toISOString().split('T')[0]);
    setCustomerName(null);
    setSelectedCustomer(null);
    setFormResetKey(prev => prev + 1);
    // Generate new order number
    const newOrderNumber = generateClientSideOrderNumber();
    setOrderNumber(newOrderNumber);
  };

  // Clear dbTotals when orderData changes in update mode
  useEffect(() => {
    if (mode === 'update' && orderData.length > 0) {
      // When we modify orderData in update mode, clear dbTotals to force dynamic calculation
      setDbTotals(null);
      console.log('Cleared dbTotals for dynamic calculation');
    }
  }, [orderData, mode]);

  // Debug log to check values
  useEffect(() => {
    console.log('Debug - Current values:', {
      userRole,
      isDistributorRoute,
      selectedCustomer: selectedCustomer?.state,
      user: user?.state,
      isTamilNadu: isTamilNaduState(), // Using hook's function
    });
  }, [userRole, isDistributorRoute, selectedCustomer, user, isTamilNaduState]);

  return (
    <div className="p-3 bg-amber-50 border-2 h-screen font-amasis">

      <OrderHeader
        onBack={handleBackClick}
        location={location}
        orderNumber={orderNumber}
        customerName={customerName}
        setCustomerName={setCustomerName}
        handleCustomerSelect={handleCustomerSelect}
        user={user}
        isDistributorRoute={isDistributorRoute}
        date={date}
        setDate={setDate}
        customerSelectRef={customerSelectRef}
        voucherType={voucherType}
        executiveName={executiveName}
        readOnly={isViewOnlyReport}
        isDistributorReport={isDistributorReport}
        isCorporateReport={isCorporateReport}
      />

      <OrderTable
        orderData={orderData}
        setOrderData={setOrderData}
        editingRow={editingRow}
        setEditingRow={setEditingRow}
        showRowValueRows={showRowValueRows}
        formResetKey={formResetKey}
        editingRowSelectRef={editingRowSelectRef}
        isTamilNaduState={isTamilNaduState}
        isViewOnlyReport={isViewOnlyReport}
        isDistributorOrder={isDistributorOrder}
        isDirectOrder={isDirectOrder}
        isDistributorReport={isDistributorReport}
        isCorporateReport={isCorporateReport}
        isOrderReportApproved={isOrderReportApproved}
      />

      <OrderFooter
        remarks={remarks}
        setRemarks={setRemarks}
        status={status}
        setStatus={setStatus}
        totals={totals}
        handleSubmit={handlePrimaryAction}
        isSubmitting={isSubmitting}
        formatCurrency={formatCurrency}
        handleRemarksKeyDown={handleRemarksKeyDown}
        isDistributorOrder={isDistributorOrder}
        isDirectOrder={isDirectOrder}
        isViewOnlyReport={isViewOnlyReport}
        isDistributorReport={isDistributorReport}
        isCorporateReport={isCorporateReport}
      />
    </div>
  );
};

export default NewOrder;
