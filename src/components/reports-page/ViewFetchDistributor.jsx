import { useEffect, useState, useCallback, useRef } from 'react';
import Title from '../Title';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authConstants';

const ViewFetchDistributor = ({ onBack }) => {
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [selectedRow, setSelectedRow] = useState(0);
  const [selectedCol, setSelectedCol] = useState(0);
  const searchInputRef = useRef(null);
  const listContainerRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentDistributorUsername = String(user?.username || user?.displayName || '').toLowerCase() || '';

  // Column configuration matching your existing structure
  const columns = [
    { key: 'date', label: 'Date', width: '80px', align: 'center' },
    { key: 'voucher_type', label: 'Vch Type', width: '180px', align: 'left' },
    { key: 'order_no', label: 'Vch No.', width: '120px', align: 'center' },
    { key: 'customer_code', label: 'Code', width: '100px', align: 'center' },
    { key: 'customer_name', label: 'Customer', width: '300px', align: 'left' },
    { key: 'executive', label: 'Executive', width: '300px', align: 'left' },
    { key: 'delivery_date', label: 'Dely. Date', width: '100px', align: 'left' },
    { key: 'delivery_mode', label: 'Dely. Mode', width: '80px', align: 'left' },
    { key: 'status', label: 'Status', width: '100px', align: 'left' },
    { key: 'amount', label: 'Amount', width: '150px', align: 'right' }
  ];

  // Filter orders based on search term
  const filterOrders = useCallback((orders, searchValue) => {
    if (!orders || !Array.isArray(orders)) return [];

    const trimmedValue = searchValue.trim().toLowerCase();
    if (trimmedValue === '') return orders;

    return orders.filter(order => {
      const voucherType = order.voucher_type?.toLowerCase() || '';
      const orderNo = order.order_no?.toString().toLowerCase() || '';
      const customerCode = order.customer_code?.toLowerCase() || '';
      const customer = order.customer_name?.toLowerCase() || '';
      const executive = order.executive?.toLowerCase() || '';
      const deliveryDate = formatDate(order.delivery_date)?.toLowerCase() || '';
      const deliveryMode = order.delivery_mode?.toLowerCase() || '';
      const amount = order.total_amount?.toString().toLowerCase() || '';
      const status = order.status?.toLowerCase() || '';
      const createdAt = formatDate(order.created_at)?.toLowerCase() || '';

      return (
        voucherType.includes(trimmedValue) ||
        orderNo.includes(trimmedValue) ||
        customerCode.includes(trimmedValue) ||
        customer.includes(trimmedValue) ||
        executive.includes(trimmedValue) ||
        deliveryDate.includes(trimmedValue) ||
        deliveryMode.includes(trimmedValue) ||
        amount.includes(trimmedValue) ||
        status.includes(trimmedValue) ||
        createdAt.includes(trimmedValue)
      );
    });
  }, []);

  // Handle order click
  const handleOrderClick = useCallback(
     order => {
    if (order.order_no) {
      navigate(`/order-report-distributor/${order.order_no}`);
    }
  },
  [navigate]
  );

  useEffect(() => {
    const handleKeyDown = e => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedRow(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedRow(prev => Math.min(filteredOrders.length - 1, prev + 1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setSelectedCol(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setSelectedCol(prev => Math.min(columns.length - 1, prev + 1));
          break;
        case 'Escape':
          e.preventDefault();
          if (onBack) {
            onBack();
          } else {
            navigate(-1);
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredOrders[selectedRow]) {
            handleOrderClick(filteredOrders[selectedRow]);
          }
          break;
        case 'Home':
          e.preventDefault();
          if (e.ctrlKey) {
            setSelectedRow(0);
          } else {
            setSelectedCol(0);
          }
          break;
        case 'End':
          e.preventDefault();
          if (e.ctrlKey) {
            setSelectedRow(filteredOrders.length - 1);
          } else {
            setSelectedCol(columns.length - 1);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [filteredOrders, selectedRow, selectedCol, navigate, onBack, columns.length, handleOrderClick]);

  // Scroll to selected row
  useEffect(() => {
    if (listContainerRef.current && selectedRow >= 0) {
      const items = listContainerRef.current.querySelectorAll('[data-order-item]');
      if (items[selectedRow]) {
        items[selectedRow].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [selectedRow]);

  // Reset selected index when filter orders change
  useEffect(() => {
    setSelectedRow(0);
    setSelectedCol(0);
  }, [filteredOrders]);

  // Fetch orders
  useEffect(() => {
    if (hasFetched || !currentDistributorUsername) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get('/orders');

        const list = Array.isArray(response.data?.data) ? response.data.data : [];

        const formattedOrders = list.map(order => ({
          voucher_type: order.VOUCHER_TYPE || '',
          order_no: order.ORDER_NO || '',
          customer_code: order.CUSTOMER_CODE || '',
          customer_name: order.CUSTOMER_NAME || '',
          executive: order.EXECUTIVE || '',
          role: order.ROLE || '',
          item_code: order.ITEM_CODE || '',
          item_name: order.ITEM_NAME || '',
          hsn: order.HSN || '',
          gst: order.GST || '',
          sgst: order.SGST || '',
          cgst: order.CGST || '',
          igst: order.IGST || '',
          quantity: order.QUANTITY || 0,
          uom: order.UOM || '',
          rate: order.RATE || 0,
          amount: order.AMOUNT || 0,
          disc_percentage: order.DISC_PERCENTAGE || 0,
          disc_amount: order.DISC_AMOUNT || 0,
          spl_disc_percentage: order.SPL_DISC_PERCENTAGE || 0,
          delivery_date: order.DELIVERY_DATE || '',
          delivery_mode: order.DELIVERY_MODE || '',
          total_quantity: order.TOTAL_QUANTITY || 0,
          total_amount: order.TOTAL_AMOUNT || 0,
          total_sgst_amount: order.TOTAL_SGST_AMOUNT || 0,
          total_cgst_amount: order.TOTAL_CGST_AMOUNT || 0,
          total_igst_amount: order.TOTAL_IGST_AMOUNT || 0,
          status: order.STATUS || '',
          remarks: order.REMARKS || '',
          created_at: order.CREATED_AT || '',
        }));

        // Get unique pending orders by order_no
        const pendingUniqueOrders = formattedOrders
          .filter(
            order => {
              const hasDistributorRole = order.role && order.role === 'distributor';
              const matchesCurrentUser = order.executive && order.executive.toLowerCase() === currentDistributorUsername;

              return hasDistributorRole && matchesCurrentUser;
            }
          )
          .reduce((acc, current) => {
            const existingOrder = acc.find(order => order.order_no === current.order_no);
            if (!existingOrder) {
              acc.push(current);
            }
          return acc;
        }, []);

        setAllOrders(pendingUniqueOrders);
        setFilteredOrders(pendingUniqueOrders);
        setHasFetched(true);
        console.log('Pending orders:', pendingUniqueOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('Failed to fetch orders');
        setAllOrders([]);
        setFilteredOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [hasFetched, currentDistributorUsername]);

  // Apply search filter when search term changes
  useEffect(() => {
    if (allOrders.length > 0) {
      const filtered = filterOrders(allOrders, searchTerm);
      setFilteredOrders(filtered);
    }
  }, [searchTerm, allOrders, filterOrders]);

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleSearchChange = e => {
    setSearchTerm(e.target.value);
  };

  const formatDate = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-IN', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  };

  // Handle cell click
  const handleCellClick = (rowIndex, colIndex) => {
    setSelectedRow(rowIndex);
    setSelectedCol(colIndex);
  };

  // Get cell value based on column key
  const getCellValue = (order, columnKey) => {
    switch (columnKey) {
      case 'date':
        return formatDate(order.created_at);
      case 'delivery_date':
        return formatDate(order.delivery_date);
      case 'amount':
        return `₹ ${Number(order.total_amount || 0).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
        })}`;
      case 'executive':
        return order.executive?.toUpperCase();
      case 'status':
        return order.status?.toUpperCase();
      default:
        return order[columnKey] || '';
    }
  };

  // Calculate total amount of filtered orders
  const totalFilteredAmount = filteredOrders.reduce((total, order) => {
    return total + (Number(order.total_amount) || 0);
  }, 0);

  // Render content based on state
  const renderContent = () => {
    if (loading && !hasFetched) {
      return (
        <div className="h-[70vh] flex items-center justify-center">
          <div className="text-gray-500">Loading sales quotations...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="h-[70vh] flex items-center justify-center">
          <div className="text-red-600 text-center">
            <p>Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        className="overflow-auto max-h-[79vh] text-xs font-amasis scrollbar-hide"
        ref={listContainerRef}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {filteredOrders.length > 0 ? (
          <div className="min-w-[1400px]">
            {filteredOrders.map((order, rowIndex) => {
              const isRowSelected = rowIndex === selectedRow;
              return (
                <div
                  key={order.id || order.order_no || rowIndex}
                  data-order-item
                  className={`flex items-center border-b border-gray-200 hover:bg-blue-300 transition cursor-pointer ${
                    isRowSelected
                      ? 'bg-yellow-100 border-yellow-300'
                      : rowIndex % 2 === 0
                      ? 'bg-white hover:bg-blue-50'
                      : 'bg-gray-100 hover:bg-blue-50'
                  }`}
                  onClick={() => {
                    setSelectedRow(rowIndex);
                    handleOrderClick(order);
                  }}
                >
                  {/* Single row with all elements */}
                  <div className="flex items-center w-[1370px] px-1 py-0.5">
                    {columns.map((column, colIndex) => {
                      const isCellSelected = isRowSelected && colIndex === selectedCol;
                      return (
                        <div
                          key={column.key}
                          className={`border-r border-gray-200 last:border-r-0 ${
                            isCellSelected ? 'bg-blue-200 ring-2 ring-blue-500' : ''
                          }`}
                          style={{ width: column.width }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCellClick(rowIndex, colIndex);
                          }}
                        >
                          <div className={`${column.key === 'customer_name' || column.key === 'executive' ? 'px-1' : ''} ${
                            column.align === 'left' ? 'text-left' : 
                            column.align === 'center' ? 'text-center' : 'text-right'
                          }`} title={getCellValue(order, column.key)}>
                            {getCellValue(order, column.key)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8 min-w-[1400px]">
            {searchTerm ? 'No orders match your search.' : 'No sales quotations found.'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex">
      <div className="w-full h-[100vh] flex">
        <div className="w-full overflow-hidden">
          <Title title="Sales Quotation" nav={onBack} />

          {/* Header Row: Title + Date Range + Search */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-gray-300 bg-white px-4 py-3">
            {/* Left section - title */}
            <div className="text-sm font-amasis text-gray-700 whitespace-nowrap">
              List of All Sales Quotations
            </div>

            {/* Middle section - search box */}
            <div className="flex-1 min-w-[300px] max-w-[500px]">
              <input
                type="text"
                placeholder="Search by order no, customer, executive, amount, or date..."
                value={searchTerm}
                ref={searchInputRef}
                onChange={handleSearchChange}
                className="w-full h-8 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-amasis"
                autoComplete="off"
              />
            </div>

            {/* Right section - date range */}
            <div className="text-sm font-amasis text-gray-600 whitespace-nowrap">
              1-Apr-25 to 31-May-26
            </div>
          </div>

          {/* Column Headers - Single Row */}
          <div
            className="overflow-auto scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="w-[1365px]">
              <div className="flex items-center border-b border-gray-300 bg-gray-100 py-1 text-sm font-amasis text-gray-700">
                {columns.map((column, colIndex) => (
                  <div
                    key={column.key}
                    className={`border-r border-gray-300 last:border-r-0 ${
                      selectedCol === colIndex && selectedRow === -1 ? 'bg-blue-200 ring-2 ring-blue-500' : ''
                    }`}
                    style={{ width: column.width }}
                  >
                    <div className={column.align === 'left' ? 'text-left' : column.align === 'center' ? 'text-center' : 'text-right'}>
                      {column.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Orders List */}
          {renderContent()}

          {/* Results Summary */}
          {filteredOrders.length > 0 && (
            <div
              className="overflow-auto scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div className="min-w-[1400px] border-t border-gray-300 bg-gray-50 py-1 px-4 font-amasis">
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <div>
                    Showing {filteredOrders.length} of {allOrders.length} sales quotations
                    {searchTerm && ` for "${searchTerm}"`}
                  </div>
                  <div className="font-medium text-gray-800 pr-9">
                    Total: ₹{' '}
                    {totalFilteredAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewFetchDistributor;