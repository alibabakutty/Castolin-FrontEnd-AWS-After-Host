import { useEffect, useState } from 'react';
import api from '../../services/api';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import Select from 'react-select';

const OrderHeader = ({
  onBack,
  location,
  orderNumber,
  customerName,
  handleCustomerSelect,
  isDistributorRoute,
  date,
  setDate,
  customerSelectRef,
  voucherType,
  executiveName,
  isDistributorReport,
  isCorporateReport,
  user
}) => {
  const [customerOptions, setCustomerOptions] = useState([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await api.get('/customer');

        const list = Array.isArray(response.data?.data) ? response.data.data : [];

        const formattedCustomers = list.map(customer => ({
          customer_code: customer.CUSTOMER_CODE || '',
          customer_name: customer.CUSTOMER_NAME || '',
          state: customer.STATE || '',
          email: customer.EMAIL || '',
          customer_type: customer.CUSTOMER_TYPE || '',
          label: `${customer.CUSTOMER_CODE} - ${customer.CUSTOMER_NAME}`,
          value: customer.CUSTOMER_CODE || '',
        }))

        const customerWithState = formattedCustomers.map(customer => ({
          ...customer,
          state: customer.STATE || '',
        }));
        setCustomerOptions(customerWithState);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    fetchCustomers();
  }, []);

  const getVoucherType = () => {
    if (location.pathname.includes('/corporate')) return 'Direct Order Management';
    if (location.pathname.includes('/distributor')) return 'Distributor Order-Web Based';
    return voucherType || 'Sales Quote';
  };

  return (
    <div className="px-1 py-2 grid grid-cols-[auto_1fr_1fr_0.8fr_2fr_1.2fr_1.2fr] gap-2 items-center border transition-all">
      <button
        onClick={onBack}
        className="p-1 rounded hover:bg-gray-200 transition justify-self-start"
      >
        <AiOutlineArrowLeft className="text-[#932F67]" size={22} />
      </button>
      {/* Voucher Type */}
      <FormField label="Voucher Type *" value={getVoucherType()} readOnly />
      {/* Order No */}
      <FormField label="Order No *" value={orderNumber} readOnly />

      {!isDistributorRoute && (
        <div className="relative w-[116px]">
          <Select
            ref={customerSelectRef}
            className="text-sm peer"
            value={customerName}
            options={customerOptions}
            getOptionValue={e => e.customer_code}
            onChange={handleCustomerSelect}
            placeholder=""
            components={{ DropdownIndicator: () => null, IndicatorSeparator: () => null }}
            formatOptionLabel={(option, { context }) =>
              context === 'menu'
                ? `${option.customer_code} - ${option.customer_name}`
                : option.customer_code
            }
            isDisabled={isDistributorReport || isCorporateReport}
            styles={{
              control: base => ({
                ...base,
                minHeight: '30px',
                height: '30px',
                lineHeight: '1',
                padding: '0px 1px',
                width: '110%',
                backgroundColor: '#F8F4EC',
                borderColor: '#932F67',
                boxShadow: 'none',
              }),
              singleValue: base => ({
                ...base,
                lineHeight: '1',
                '& > div': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                },
              }),
              option: (base, state) => ({
                ...base,
                fontFamily: 'font-amasis',
                fontWeight: '600',
                padding: '3px 20px',
                lineHeight: '1.2',
                backgroundColor: state.isFocused ? '#f0f0f0' : 'white',
                color: '#555',
                cursor: 'pointer',
                fontSize: '14px',
              }),
              menuPortal: base => ({
                ...base,
                zIndex: 999999, // 🔥 THIS IS THE KEY
              }),
              menu: base => ({
                ...base,
                width: '500px',
                minWidth: '500px',
                left: '0px',
                right: 'auto',
                position: 'absolute',
                zIndex: 9999,
              }),
              menuList: base => ({
                ...base,
                padding: 0,
                width: '100%',
              }),
            }}
            menuPortalTarget={document.body}
          />
          <span className="absolute left-2.5 top-[12px] transition-all pointer-events-none -translate-y-[17px] text-[#932F67] px-1.5 font-semibold text-[12px] bg-[#E9EFEC] peer-valid:text-[#932F67] leading-2 rounded">
            Customer Code *
          </span>
        </div>
      )}

      {!isDistributorRoute && (
        <div className="relative ml-7 w-80">
          <input
            type="text"
            readOnly
            value={customerName ? customerName.customer_name : ''}
            className="outline-none border rounded-[5px] border-[#932F67] p-[3.5px] text-sm bg-gray-100 font-medium w-full"
          />
          <span className="absolute left-2.5 top-[12px] transition-all pointer-events-none -translate-y-[17px] text-[#932F67] px-1.5 font-semibold text-[12px] bg-[#E9EFEC] leading-2 rounded">
            Customer Name *
          </span>
        </div>
      )}

      {isDistributorRoute && (
        <div className={`relative ${isDistributorRoute ? 'w-[150px]' : ''}`}>
          <div className="border p-[3.5px] rounded-[5px] border-[#932F67] text-sm font-medium text-gray-700 text-center">
            {user._userData.customer_code || '0000'}
          </div>
          <span className="absolute left-2.5 top-[12px] transition-all pointer-events-none -translate-y-[17px] text-[#932F67] px-1.5 font-semibold text-[12px] bg-[#E9EFEC] peer-valid:text-[#932F67] leading-2 rounded">
            Customer Code *
          </span>
        </div>
      )}

      {!isDistributorReport && (
        <div className={`relative ${isDistributorRoute ? 'w-[450px]' : 'w-[280px]'}`}>
        <div className="border p-[3.5px] rounded-[5px] border-[#932F67] text-sm font-medium text-gray-700 text-center truncate">
          {user?.username || executiveName?.customer_name || 'executive'}
        </div>
        <span className="absolute left-2.5 top-[12px] transition-all pointer-events-none -translate-y-[17px] text-[#932F67] px-1.5 font-semibold text-[12px] bg-[#E9EFEC] peer-valid:text-[#932F67] leading-2 rounded">
          {isDistributorRoute ? 'Customer Name' : 'Executive Name'}
        </span>
      </div>
      )}

      {/* Order Date */}
      <FormField
        label="Order Date *"
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        readOnly
        className="w-28"
      />
    </div>
  );
};

// Reusable form field component
const FormField = ({ label, value, onChange, type = 'text', readOnly, className = '' }) => (
  <div className={`relative ${className}`}>
    {type === 'date' ? (
      <input
        type="date"
        readOnly={readOnly}
        value={value}
        onChange={onChange}
        className="peer w-full border border-[#932F67] rounded p-[3.5px] focus:outline-none focus:border-[#932F67] text-sm font-medium"
      />
    ) : (
      <input
        type="text"
        readOnly={readOnly}
        value={value}
        onChange={onChange}
        className="outline-none border rounded-[5px] border-[#932F67] p-[3.5px] text-sm bg-gray-100 font-medium w-[195px] text-center"
      />
    )}
    <span className="absolute left-2.5 top-[12px] transition-all pointer-events-none -translate-y-[17px] text-[#932F67] px-1.5 font-semibold text-[12px] bg-[#E9EFEC] peer-valid:text-[#932F67] leading-2 rounded">
      {label}
    </span>
  </div>
);
export default OrderHeader;
