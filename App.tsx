import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Settings as SettingsIcon, 
  PlusCircle, 
  MinusCircle, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Moon, 
  Sun, 
  Menu, 
  X, 
  Sparkles,
  CreditCard,
  Trash2,
  AlertTriangle,
  LogOut,
  Crown,
  Check,
  ArrowRight,
  Lock,
  Download,
  ShieldCheck
} from 'lucide-react';
import { Transaction, TransactionType, Category, DailyBalance, User, PlanType } from './types';
import { BalanceTrendChart, ExpensePieChart, IncomeDoughnutChart, DailyBarChart } from './components/Charts';
import { generateFinancialInsights } from './services/geminiService';

// Firebase Imports
import { auth, db, googleProvider } from './firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  Timestamp,
  updateDoc 
} from 'firebase/firestore';

// --- DATA & CONSTANTS ---

// Safe access to environment variables
const getEnvVar = (key: string, fallback: string) => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || fallback;
    }
  } catch (e) {
    console.warn('Error reading environment variable:', key);
  }
  return fallback;
};

const RAZORPAY_KEY_ID = getEnvVar('VITE_RAZORPAY_KEY_ID', "rzp_test_Rhn9WhwAS4RZoF");

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'United States Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound Sterling' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'ILS', symbol: '₪', name: 'Israeli New Shekel' },
  { code: 'CLP', symbol: 'CLP$', name: 'Chilean Peso' },
  { code: 'AED', symbol: 'د.إ', name: 'United Arab Emirates Dirham' },
  { code: 'COP', symbol: 'COL$', name: 'Colombian Peso' },
  { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar' },
  { code: 'ARS', symbol: 'ARS$', name: 'Argentine Peso' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
];

// Approximate exchange rates relative to USD
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 150,
  CAD: 1.36,
  AUD: 1.52,
  INR: 83.5, 
  CNY: 7.2,
  CHF: 0.90,
  NZD: 1.65,
  BRL: 5.1,
  RUB: 92,
  KRW: 1350,
  SGD: 1.35,
  MXN: 16.8,
  SAR: 3.75,
  ZAR: 18.5,
  TRY: 32,
  SEK: 10.8,
  NOK: 10.9,
  HKD: 7.8,
  IDR: 16000,
  MYR: 4.7,
  PHP: 57,
  THB: 36,
  VND: 25000,
  PLN: 3.95,
  DKK: 6.9,
  HUF: 360,
  CZK: 23.5,
  ILS: 3.7,
  CLP: 950,
  AED: 3.67,
  COP: 3900,
  TWD: 32,
  ARS: 870,
  EGP: 47,
  PKR: 278,
  NGN: 1300,
  BDT: 110
};

const BASE_PLANS = [
  {
    id: 'free',
    name: 'Starter',
    basePrice: 0,
    period: '/mo',
    features: ['Basic Income & Expense Tracking', 'Last 30 Days History', 'Standard Charts', 'Community Support'],
    recommended: false
  },
  {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    basePrice: 99,
    period: '/mo',
    features: ['AI Financial Insights', 'Unlimited History', 'Export to CSV/PDF', 'Multi-currency Support', 'Priority Support'],
    recommended: false
  },
  {
    id: 'pro_yearly',
    name: 'Pro Yearly',
    basePrice: 999,
    period: '/yr',
    features: ['All Pro Features', 'Save ~15%', 'Early Access to Beta Features', 'Dedicated Account Manager'],
    recommended: true
  }
];

// --- SUB-COMPONENTS ---

const StatCard = ({ title, value, trend, icon: Icon, colorClass }: any) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow duration-300">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <h3 className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
    </div>
    <div className="mt-4 flex items-center text-sm">
      <span className={trend >= 0 ? "text-green-500" : "text-red-500"}>
        {trend > 0 ? "+" : ""}{trend}%
      </span>
      <span className="text-slate-400 ml-2">vs last month</span>
    </div>
  </div>
);

const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- SCREEN COMPONENTS ---

const AuthScreen = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Google Sign In Error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        setError("Domain not authorized. Go to Firebase Console > Authentication > Settings > Authorized Domains and add your domain (e.g., finsight-dashboard.vercel.app).");
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError("Sign in cancelled.");
      } else {
        setError(err.message.replace('Firebase: ', ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError("Invalid email or password.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("Email is already in use.");
      } else {
        setError(err.message.replace('Firebase: ', ''));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Side - Visual */}
        <div className="md:w-1/2 bg-gradient-to-br from-primary-600 to-purple-700 p-12 flex flex-col justify-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-pattern opacity-10"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
          <h2 className="text-4xl font-bold mb-6 relative z-10">Master Your Money</h2>
          <p className="text-lg opacity-90 mb-8 relative z-10">Join thousands of users who are tracking, planning, and growing their wealth with FinSight.</p>
        </div>

        {/* Right Side - Form */}
        <div className="md:w-1/2 p-12 flex flex-col justify-center">
          <div className="flex items-center space-x-2 mb-8">
             <div className="bg-primary-500 p-2 rounded-lg">
              <Wallet className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">FinSight</span>
          </div>

          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {isRegister ? 'Create an Account' : 'Welcome Back'}
          </h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button 
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-3 py-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-slate-700 dark:text-slate-200 font-medium">
                {loading ? 'Connecting...' : 'Sign in with Google'}
              </span>
            </button>

            <div className="flex items-center">
              <div className="flex-1 border-t border-slate-200 dark:border-slate-700"></div>
              <span className="px-4 text-sm text-slate-400">Or continue with email</span>
              <div className="flex-1 border-t border-slate-200 dark:border-slate-700"></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="john@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-primary-500/25">
              {loading ? 'Processing...' : (isRegister ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-500">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                onClick={() => setIsRegister(!isRegister)}
                className="text-primary-600 font-bold hover:underline"
              >
                {isRegister ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SubscriptionScreen = ({ user, plans, onUpgrade, currencySymbol, currencyCode }: { user: User, plans: any[], onUpgrade: (plan: any) => void, currencySymbol: string, currencyCode: string }) => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Upgrade your Plan</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Unlock the full power of FinSight with our Pro plans. Get AI insights, unlimited history, and dedicated support.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrent = user.plan === plan.id || (user.plan === 'free' && plan.id === 'free');
          return (
            <div 
              key={plan.id} 
              className={`relative rounded-2xl p-8 border transition-all duration-300 flex flex-col 
                ${plan.recommended ? 'border-primary-500 shadow-xl scale-105 z-10 bg-white dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-lg'}
              `}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                  Best Value
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                    {plan.price === 0 ? 'Free' : `${currencySymbol}${plan.price.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}`}
                  </span>
                  {plan.price > 0 && <span className="text-slate-500 ml-2">{plan.period}</span>}
                </div>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature: string, i: number) => (
                  <div key={i} className="flex items-start">
                    <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full mr-3 mt-0.5">
                      <Check size={12} className="text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => !isCurrent && onUpgrade(plan)}
                disabled={isCurrent}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  isCurrent 
                  ? 'bg-slate-100 text-slate-400 cursor-default dark:bg-slate-800' 
                  : plan.recommended
                    ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/25'
                    : 'bg-white border border-slate-200 text-slate-900 hover:border-primary-500 hover:text-primary-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:border-primary-500'
                }`}
              >
                {isCurrent ? 'Current Plan' : 'Upgrade Now'}
              </button>
            </div>
          );
        })}
      </div>
      {currencyCode !== 'INR' && (
        <p className="text-center text-slate-500 text-sm mt-8">
          *Pricing is converted from the base INR rate (₹99/mo, ₹999/yr) to {currencyCode}.
        </p>
      )}
    </div>
  );
};

const PaymentModal = ({ plan, isOpen, onClose, onSuccess, user, currencyCode, currencySymbol }: any) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRazorpayPayment = () => {
    if (!window.Razorpay) {
      alert("Razorpay SDK failed to load. Please check your internet connection.");
      return;
    }
    
    setIsProcessing(true);

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: Math.round(plan.price * 100), 
      currency: currencyCode,
      name: "FinSight AI",
      description: `Subscription for ${plan.name}`,
      image: "https://ui-avatars.com/api/?name=FinSight+AI&background=0ea5e9&color=fff",
      handler: function (response: any) {
        console.log("Payment ID: ", response.razorpay_payment_id);
        setIsProcessing(false);
        onSuccess();
        onClose();
      },
      prefill: {
        name: user?.name || "User Name",
        email: user?.email || "user@example.com",
        contact: "9000090000"
      },
      theme: {
        color: "#0ea5e9"
      },
      modal: {
        ondismiss: function(){
          setIsProcessing(false);
        }
      }
    };

    try {
      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response: any){
        alert(`Payment Failed: ${response.error.description}`);
        setIsProcessing(false);
      });
      rzp1.open();
    } catch (error) {
      console.error("Razorpay initialization failed", error);
      setIsProcessing(false);
      alert("Failed to initialize payment. Check console and RAZORPAY_KEY_ID.");
    }
  };

  if (!isOpen || !plan) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Subscribe to ${plan.name}`}>
      <div className="space-y-6">
        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl text-center">
          <p className="text-sm text-slate-500 uppercase tracking-wide font-semibold mb-1">Total Amount</p>
          <p className="text-4xl font-bold text-slate-900 dark:text-white">
            {currencySymbol}{plan.price.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}
          </p>
          <p className="text-slate-500 text-sm mt-2">Billed {plan.period === '/mo' ? 'Monthly' : 'Yearly'}</p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 flex items-start">
          <ShieldCheck className="text-blue-600 dark:text-blue-400 w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-1">Secure Payment</p>
            <p>You will be redirected to Razorpay's secure checkout to complete your purchase in {currencyCode}.</p>
          </div>
        </div>

        <button 
          onClick={handleRazorpayPayment}
          disabled={isProcessing}
          className="w-full bg-[#3399cc] hover:bg-[#2b81ac] text-white font-bold py-3.5 rounded-lg transition-all shadow-lg shadow-blue-500/25 flex justify-center items-center"
        >
          {isProcessing ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              Pay with Razorpay
              <ArrowRight size={18} className="ml-2" />
            </>
          )}
        </button>
      </div>
    </Modal>
  );
};

// --- MAIN APP ---

const App = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // App State
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [view, setView] = useState<'dashboard' | 'settings' | 'subscription'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  
  const [aiInsights, setAiInsights] = useState<string>("");
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Form State
  const [formType, setFormType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState<Category>(Category.OTHER);
  const [formDesc, setFormDesc] = useState('');

  // Derived State
  const currencySymbol = useMemo(() => 
    CURRENCIES.find(c => c.code === currencyCode)?.symbol || '$', 
  [currencyCode]);

  const currentPlans = useMemo(() => {
    return BASE_PLANS.map(plan => {
      if (plan.id === 'free') return { ...plan, price: 0 };
      const basePriceINR = plan.id === 'pro_yearly' ? 999 : 99;
      const priceInUSD = basePriceINR / EXCHANGE_RATES['INR'];
      const rate = EXCHANGE_RATES[currencyCode] || 1;
      return {
        ...plan,
        price: priceInUSD * rate
      };
    });
  }, [currencyCode]);

  // Handle Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '',
          plan: 'free', // In a real app, fetch this from DB
          memberSince: new Date(firebaseUser.metadata.creationTime || Date.now()),
          picture: firebaseUser.photoURL || undefined,
          id: firebaseUser.uid
        } as any);
      } else {
        setUser(null);
        setTransactions([]);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Database Listener
  useEffect(() => {
    if (!user || !user.id) return;

    // Listen to user's transactions collection
    // Assumes security rules: match /users/{userId}/transactions/{document=**} { allow read, write: if request.auth.uid == userId; }
    const q = query(
      collection(db, 'users', user.id, 'transactions'), 
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: Transaction[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date instanceof Timestamp ? doc.data().date.toDate() : new Date(doc.data().date)
      } as Transaction));
      setTransactions(loaded);
    }, (error) => {
      console.error("DB Error:", error);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Init Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      const newTransaction = {
        amount: parseFloat(formAmount),
        type: formType,
        category: formCategory,
        description: formDesc,
        date: new Date() // Firestore will convert this to Timestamp
      };

      await addDoc(collection(db, 'users', user.id, 'transactions'), newTransaction);
      
      setIsAddModalOpen(false);
      setFormAmount('');
      setFormDesc('');
      setFormCategory(Category.OTHER);
    } catch (error) {
      console.error("Error adding transaction: ", error);
      alert("Failed to add transaction");
    }
  };

  const handleDeleteTransaction = async () => {
    if (transactionToDelete && user?.id) {
      try {
        await deleteDoc(doc(db, 'users', user.id, 'transactions', transactionToDelete));
        setTransactionToDelete(null);
        setIsDeleteModalOpen(false);
      } catch (error) {
        console.error("Error deleting transaction: ", error);
        alert("Failed to delete transaction");
      }
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Currency'];
    const csvRows = [headers.join(',')];
    
    transactions.forEach(t => {
      const row = [
        t.date.toLocaleDateString(),
        t.type,
        t.category,
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount.toFixed(2),
        currencyCode
      ];
      csvRows.push(row.join(','));
    });
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `finsight_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const generateInsights = async () => {
    setIsLoadingInsights(true);
    const insights = await generateFinancialInsights(transactions);
    setAiInsights(insights);
    setIsLoadingInsights(false);
  };

  const handleUpgradeClick = (plan: any) => {
    setSelectedPlan(plan);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    if (user && selectedPlan) {
      // In a real app, verify payment server-side then update
      // For now, just update local state, but we should probably store this in DB
      setUser({ ...user, plan: selectedPlan.id });
      alert(`Successfully upgraded to ${selectedPlan.name}!`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('dashboard');
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  // Computed Data
  const stats = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, curr) => acc + curr.amount, 0);
    const balance = totalIncome - totalExpense;
    return { totalIncome, totalExpense, balance };
  }, [transactions]);

  const chartData = useMemo(() => {
    const dailyMap = new Map<string, { income: number; expense: number }>();
    const now = new Date();
    
    // If no transactions, show last 7 days empty
    const daysToShow = transactions.length > 0 ? 60 : 7;

    for(let i=daysToShow-1; i>=0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const key = d.toISOString().split('T')[0];
        dailyMap.set(key, { income: 0, expense: 0 });
    }

    transactions.forEach(t => {
      const key = t.date.toISOString().split('T')[0];
      if (dailyMap.has(key)) {
        const entry = dailyMap.get(key)!;
        if (t.type === TransactionType.INCOME) entry.income += t.amount;
        else entry.expense += t.amount;
      }
    });

    const data: DailyBalance[] = [];
    let runningBalance = 0; // Start at 0 for new users

    Array.from(dailyMap.entries()).sort().forEach(([dateStr, vals]) => {
      runningBalance += (vals.income - vals.expense);
      data.push({
        date: new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        balance: runningBalance,
        income: vals.income,
        expense: vals.expense
      });
    });

    return data;
  }, [transactions]);

  const expenseData = useMemo(() => {
    const map = new Map<string, number>();
    transactions.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const incomeData = useMemo(() => {
    const map = new Map<string, number>();
    transactions.filter(t => t.type === TransactionType.INCOME).forEach(t => {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="p-6 flex items-center space-x-2">
          <div className="bg-primary-500 p-2 rounded-lg">
            <Wallet className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">FinSight</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${view === 'dashboard' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => setView('subscription')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${view === 'subscription' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Crown size={20} />
            <span>Subscription</span>
            {user.plan === 'free' && <span className="ml-auto text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">PRO</span>}
          </button>
           <button 
            onClick={() => setView('settings')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${view === 'settings' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <SettingsIcon size={20} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3 mb-4 px-2">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden">
              {user.picture ? <img src={user.picture} alt={user.name} className="w-full h-full object-cover" /> : user.name[0]}
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.name}</p>
               <p className="text-xs text-slate-500 truncate capitalize">{user.plan} Plan</p>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 text-slate-500 hover:text-red-500 text-sm transition-colors py-2"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-primary-500 p-1.5 rounded-lg">
            <Wallet className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white">FinSight</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600 dark:text-slate-300">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-10 bg-slate-900/50 backdrop-blur-sm pt-16" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="bg-white dark:bg-slate-900 p-4 shadow-xl border-b border-slate-200 dark:border-slate-800 space-y-2">
            <button onClick={() => { setView('dashboard'); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">Dashboard</button>
            <button onClick={() => { setView('subscription'); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">Subscription</button>
            <button onClick={() => { setView('settings'); setIsMobileMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">Settings</button>
            <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600">Sign Out</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 pt-16 md:pt-0">
        {view === 'dashboard' && (
          <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Financial Overview</h1>
                <p className="text-slate-500 dark:text-slate-400">Welcome back, here's your financial health report.</p>
              </div>
              <div className="flex items-center gap-3">
                 <button 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:shadow-md transition-all"
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-primary-500/25 transition-all"
                >
                  <PlusCircle size={20} />
                  <span>Add Transaction</span>
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard 
                title="Total Balance" 
                value={`${currencySymbol}${stats.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
                trend={8.2} 
                icon={Wallet} 
                colorClass="bg-blue-500" 
              />
              <StatCard 
                title="Total Income" 
                value={`${currencySymbol}${stats.totalIncome.toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
                trend={12.5} 
                icon={TrendingUp} 
                colorClass="bg-green-500" 
              />
              <StatCard 
                title="Total Expense" 
                value={`${currencySymbol}${stats.totalExpense.toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
                trend={-2.4} 
                icon={TrendingDown} 
                colorClass="bg-red-500" 
              />
            </div>

            {/* Charts Section 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Balance Trend (60 Days)</h3>
                <div className="h-80 w-full">
                   <BalanceTrendChart data={chartData} currency={currencySymbol} />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Income Sources</h3>
                <div className="flex-1 min-h-0">
                  <IncomeDoughnutChart data={incomeData} currency={currencySymbol} />
                </div>
              </div>
            </div>

            {/* AI & Secondary Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles size={100} />
                </div>
                <div className="flex items-center gap-2 mb-4">
                   <div className="bg-primary-500/20 p-2 rounded-lg">
                      <Sparkles className="text-primary-400" size={24} />
                   </div>
                   <h3 className="font-bold text-xl">AI Insights</h3>
                </div>
                
                <div className="space-y-4 relative z-10 min-h-[180px]">
                  {isLoadingInsights ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                      <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm">Analyzing your spending...</p>
                    </div>
                  ) : aiInsights ? (
                    <ul className="space-y-3 text-sm text-slate-300 list-disc pl-4" dangerouslySetInnerHTML={{__html: aiInsights}}></ul>
                  ) : (
                     <div className="text-center text-slate-400 py-8">
                        <p className="mb-4">Unlock smart financial advice based on your transaction history.</p>
                        <button 
                          onClick={generateInsights}
                          disabled={transactions.length === 0}
                          className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Generate Insights
                        </button>
                     </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Expense Breakdown</h3>
                <div className="h-64">
                  <ExpensePieChart data={expenseData} currency={currencySymbol} />
                </div>
              </div>

              <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Daily Activity (Last 14 Days)</h3>
                <div className="h-64">
                  <DailyBarChart data={chartData} currency={currencySymbol} />
                </div>
              </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col h-[500px]">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
                 <button 
                  onClick={handleExportCSV}
                  disabled={transactions.length === 0}
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
              </div>
              <div className="overflow-y-auto flex-1">
                {transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
                      <CreditCard size={32} className="opacity-50" />
                    </div>
                    <h4 className="font-medium text-slate-900 dark:text-white mb-1">No transactions yet</h4>
                    <p className="text-sm max-w-xs mx-auto">Start adding your income and expenses to see your financial insights.</p>
                    <button 
                      onClick={() => setIsAddModalOpen(true)}
                      className="mt-4 text-primary-600 font-medium hover:underline"
                    >
                      Add your first transaction
                    </button>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 backdrop-blur-sm">
                      <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="p-4">Transaction</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Date</th>
                        <th className="p-4 text-right">Amount</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${t.type === TransactionType.INCOME ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {t.type === TransactionType.INCOME ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">{t.description}</p>
                                <p className="text-xs text-slate-500 capitalize">{t.type}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {t.category}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-slate-500">
                            {t.date.toLocaleDateString()}
                          </td>
                          <td className={`p-4 text-right font-bold ${t.type === TransactionType.INCOME ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>
                            {t.type === TransactionType.INCOME ? '+' : '-'}{currencySymbol}{t.amount.toFixed(2)}
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={() => {
                                setTransactionToDelete(t.id);
                                setIsDeleteModalOpen(true);
                              }}
                              type="button"
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Delete transaction"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'subscription' && (
          <SubscriptionScreen 
            user={user} 
            plans={currentPlans} 
            onUpgrade={handleUpgradeClick} 
            currencySymbol={currencySymbol}
            currencyCode={currencyCode}
          />
        )}

        {view === 'settings' && (
           <div className="p-8 max-w-4xl mx-auto">
             <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Settings</h2>
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
               
               <div>
                 <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Preferences</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Currency</label>
                      <select 
                        value={currencyCode}
                        onChange={(e) => setCurrencyCode(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                      >
                        {CURRENCIES.map(c => (
                          <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>
                        ))}
                      </select>
                   </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Theme</label>
                      <div className="flex items-center space-x-4">
                        <button 
                          onClick={() => setTheme('light')}
                          className={`flex-1 py-2.5 rounded-lg border ${theme === 'light' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                        >
                          Light
                        </button>
                        <button 
                          onClick={() => setTheme('dark')}
                          className={`flex-1 py-2.5 rounded-lg border ${theme === 'dark' ? 'border-primary-500 bg-primary-900/20 text-primary-400' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                        >
                          Dark
                        </button>
                      </div>
                   </div>
                 </div>
               </div>

               <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                 <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Account</h3>
                 <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div className="flex items-center space-x-4">
                       <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xl">
                         {user.picture ? <img src={user.picture} className="w-full h-full rounded-full object-cover"/> : user.name[0]}
                       </div>
                       <div>
                         <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                         <p className="text-sm text-slate-500">{user.email}</p>
                       </div>
                    </div>
                    <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700 font-medium">Sign Out</button>
                 </div>
               </div>

             </div>
           </div>
        )}
      </main>

      {/* Add Transaction Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Transaction">
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormType(TransactionType.INCOME)}
              className={`p-3 rounded-lg border text-center transition-all ${formType === TransactionType.INCOME ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setFormType(TransactionType.EXPENSE)}
              className={`p-3 rounded-lg border text-center transition-all ${formType === TransactionType.EXPENSE ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
            >
              Expense
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount ({currencySymbol})</label>
            <input 
              type="number" 
              required
              min="0"
              step="0.01"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="0.00"
              value={formAmount}
              onChange={e => setFormAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
            <select 
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              value={formCategory}
              onChange={e => setFormCategory(e.target.value as Category)}
            >
              {Object.values(Category).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g. Monthly Rent"
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
            />
          </div>

          <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg mt-4 shadow-lg shadow-primary-500/25">
            Save Transaction
          </button>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
        <div className="text-center space-y-4">
          <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
            <AlertTriangle className="text-red-600 dark:text-red-400 w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">Are you sure?</h3>
          <p className="text-slate-500 dark:text-slate-400">
            This action cannot be undone. This transaction will be permanently removed from your account.
          </p>
          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button 
              onClick={handleDeleteTransaction}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-lg shadow-red-500/25"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        plan={selectedPlan}
        onSuccess={handlePaymentSuccess}
        user={user}
        currencyCode={currencyCode}
        currencySymbol={currencySymbol}
      />
    </div>
  );
};

export default App;