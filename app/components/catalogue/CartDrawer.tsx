import { CartItem } from './types';

type Props = {
  isOpen: boolean;
  cart: CartItem[];
  totalPrice: number;
  totalCount: number;
  isPaymentLoading: boolean;
  onClose: () => void;
  onChangeQty: (idx: number, delta: number) => void;
  onRemove: (idx: number) => void;
  onPay: () => void;
};

export function CartDrawer({
  isOpen,
  cart,
  totalPrice,
  totalCount,
  isPaymentLoading,
  onClose,
  onChangeQty,
  onRemove,
  onPay,
}: Props) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`cart-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`cart-panel ${isOpen ? 'open' : ''}`}
        aria-label="Shopping cart"
        aria-modal="true"
        role="dialog"
      >
        {/* Header */}
        <div className="cart-header">
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: '20px', margin: 0 }}>🛒 Your Cart</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#2E2A27' }}
            aria-label="Close cart"
          >
            &times;
          </button>
        </div>

        {/* Items */}
        <div className="cart-body">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9a938c', marginTop: '40px' }}>
              <p style={{ fontSize: '32px', marginBottom: '8px' }}>🛍️</p>
              <p>Your cart is empty.</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>Select an age and add items!</p>
            </div>
          ) : (
            cart.map((item, i) => (
              <div key={`${item.id}-${item.year}`} className="cart-item">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: '#7a766f', marginTop: '2px' }}>
                    Age: {item.year} &middot; ₹{item.price.toLocaleString('en-IN')} each
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <button
                      onClick={() => onChangeQty(i, -1)}
                      aria-label="Decrease quantity"
                      style={{ width: '26px', height: '26px', borderRadius: '8px', border: '1px solid #e0ddd9', background: '#fff', cursor: 'pointer', fontSize: '16px' }}
                    >
                      −
                    </button>
                    <span style={{ fontSize: '14px', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                    <button
                      onClick={() => onChangeQty(i, 1)}
                      disabled={item.qty >= item.maxStock}
                      aria-label="Increase quantity"
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '8px',
                        border: '1px solid #e0ddd9',
                        background: '#fff',
                        cursor: item.qty >= item.maxStock ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        opacity: item.qty >= item.maxStock ? 0.4 : 1,
                      }}
                    >
                      +
                    </button>
                    {item.qty >= item.maxStock && (
                      <span style={{ fontSize: '10px', color: '#e57373', fontWeight: 600 }}>Max stock</span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: '#2E2A27' }}>
                    ₹{(item.price * item.qty).toLocaleString('en-IN')}
                  </div>
                  <button
                    onClick={() => onRemove(i)}
                    style={{ background: 'none', border: 'none', color: '#cc4444', fontSize: '11px', cursor: 'pointer', marginTop: '6px' }}
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="cart-footer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#9a938c' }}>Order Total</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#2E2A27', letterSpacing: '-0.5px' }}>
                  ₹{totalPrice.toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#7a766f', textAlign: 'right' }}>
                {totalCount} item{totalCount !== 1 ? 's' : ''}
              </div>
            </div>

            <button
              onClick={onPay}
              disabled={isPaymentLoading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                background: isPaymentLoading
                  ? '#9a938c'
                  : 'linear-gradient(135deg, #5A7A56 0%, #3d5a39 100%)',
                color: 'white',
                padding: '14px',
                borderRadius: '18px',
                fontWeight: 700,
                border: 'none',
                fontSize: '15px',
                cursor: isPaymentLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 24px rgba(90,122,86,0.3)',
              }}
              aria-live="polite"
            >
              {isPaymentLoading ? (
                <>
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.7s linear infinite',
                    }}
                  />
                  Processing…
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="1" y="4" width="22" height="16" rx="2" />
                    <path d="M1 10h22" />
                  </svg>
                  Pay ₹{totalPrice.toLocaleString('en-IN')}
                </>
              )}
            </button>

            <p style={{ textAlign: 'center', fontSize: '11px', color: '#9a938c', marginTop: '8px' }}>
              🔒 Secured by Razorpay · UPI · Cards · Net Banking
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
