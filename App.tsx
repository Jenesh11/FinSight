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

// --- DATA & CONSTANTS ---

// Safe access to environment variables
const getEnvVar = (key: string, fallback: string) => {
  try {
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
const GOOGLE_CLIENT_ID = getEnvVar('VITE_GOOGLE_CLIENT_ID', "1020638093138-78d5phdu93v7i5aotqt69u27svumlaj7.apps.googleusercontent.com");

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

// Approximate exchange rates relative to USD for demo purposes
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
    basePrice: 99, // Defined conceptually, logic below overrides this to anchor on INR
    period: '/mo',
    features: ['AI Financial Insights', 'Unlimited History', 'Export to CSV/PDF', 'Multi-currency Support', 'Priority Support'],
    recommended: false
  },
  {
    id: 'pro_yearly',
    name: 'Pro Yearly',
    basePrice: 999, // Defined conceptually, logic below overrides this to anchor on INR
    period: '/yr',
    features: ['All Pro Features', 'Save ~15%', 'Early Access to Beta Features', 'Dedicated Account Manager'],
    recommended: true
  }
];

// Utility to parse JWT from Google
const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

const generateMockData = (days: number): Transaction[] => {
  const transactions: Transaction[] = [];
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Income: Salary bi-weekly
    if (i % 14 === 0) {
      transactions.push({
        id: `inc-${i}-${Math.random().toString(36).substr(2, 9)}`,
        date,
        amount: 3500 + Math.random() * 500,
        type: TransactionType.INCOME,
        category: Category.SALARY,
        description: 'Bi-weekly Salary'
      });
    }

    // Daily Expenses
    if (Math.random() > 0.3) {
      transactions.push({
        id: `exp-${i}-1-${Math.random().toString(36).substr(2, 9)}`,
        date,
        amount: 15 + Math.random() * 80,
        type: TransactionType.EXPENSE,
        category: Category.GROCERIES,
        description: 'Grocery Store'
      });
    }
    
    if (Math.random() > 0.7) {
      transactions.push({
        id: `exp-${i}-2-${Math.random().toString(36).substr(2, 9)}`,
        date,
        amount: 10 + Math.random() * 40,
        type: TransactionType.EXPENSE,
        category: Category.ENTERTAINMENT,
        description: 'Movies/Games'
      });
    }

     // Rent once a month
    if (date.getDate() === 1) {
      transactions.push({
        id: `rent-${i}-${Math.random().toString(36).substr(2, 9)}`,
        date,
        amount: 1800,
        type: TransactionType.EXPENSE,
        category: Category.RENT,
        description: 'Monthly Rent'
      });
    }
  }
  return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
};

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

const AuthScreen = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Initialize Google Sign In
  useEffect(() => {
    // Check if window.google is available and ID is present
    if (typeof window.google !== 'undefined' && GOOGLE_CLIENT_ID) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback
        });
        
        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          { theme: "outline", size: "large", width: "100%" } 
        );
      } catch (error) {
        console.error("Google Auth Initialization Error:", error);
      }
    }
  }, []);

  const handleGoogleCallback = (response: any) => {
    const payload = parseJwt(response.credential);
    if (payload) {
      const googleUser: User = {
        name: payload.name,
        email: payload.email,
        plan: 'free',
        memberSince: new Date(),
        picture: payload.picture
      };
      onLogin(googleUser);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate Standard Auth
    const user: User = {
      name: name || email.split('@')[0],
      email: email,
      plan: 'free',
      memberSince: new Date()
    };
    onLogin(user);
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
          <div className="flex items-center space-x-4 relative z-10">
            <div className="flex -space-x-2">
              {[1,2,3].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-primary-500 bg-slate-200 flex items-center justify-center text-xs text-slate-900 font-bold">
                  U{i}
                </div>
              ))}
            </div>
            <span className="text-sm font-medium">Trusted by 10k+ users</span>
          </div>
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
          <p className="text-slate-500 mb-6">
            {isRegister ? 'Start your financial journey today.' : 'Please enter your details to sign in.'}
          </p>

          <div className="space-y-4">
            {/* Official Google Button Container */}
            <div ref={googleButtonRef} className="w-full flex justify-center">
              {/* Fallback if JS hasn't loaded or ID is missing */}
               {!GOOGLE_CLIENT_ID && (
                 <div className="text-xs text-red-500 text-center border border-red-200 p-2 rounded bg-red-50">
                   developer: set VITE_GOOGLE_CLIENT_ID in .env file to enable Google Sign In
                 </div>
               )}
            </div>

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

            <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-primary-500/25">
              {isRegister ? 'Sign Up' : 'Sign In'}
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
      amount: Math.round(plan.price * 100), // Amount in smallest currency unit (e.g. cents/paise)
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
        contact: "9000090000" // Dummy contact for test
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

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

  // Calculate Localized Plans based on currency
  const currentPlans = useMemo(() => {
    return BASE_PLANS.map(plan => {
      if (plan.id === 'free') return { ...plan, price: 0 };

      // Define base prices in INR as the source of truth (user requirement)
      // Monthly: 99 INR, Yearly: 999 INR
      const basePriceINR = plan.id === 'pro_yearly' ? 999 : 99;
      
      // 1. Convert INR to USD first (Intermediate step)
      // Rate: 1 USD = 83.5 INR -> 1 INR = 1/83.5 USD
      const priceInUSD = basePriceINR / EXCHANGE_RATES['INR'];
      
      // 2. Convert USD to Target Currency
      const rate = EXCHANGE_RATES[currencyCode] || 1;
      const convertedPrice = priceInUSD * rate;

      return {
        ...plan,
        price: convertedPrice
      };
    });
  }, [currencyCode]);

  // Init
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Auth Handlers
  const handleLogin = (newUser: User) => {
    setUser(newUser);
    setIsAuthenticated(true);
    setTransactions([]); // Ensure clean slate for new user
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setView('dashboard');
    setTransactions([]);
  };

  const handleUpgradeClick = (plan: any) => {
    setSelectedPlan(plan);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    if (user && selectedPlan) {
      setUser({ ...user, plan: selectedPlan.id });
      alert(`Successfully upgraded to ${selectedPlan.name}!`);
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
    // Daily Balance Logic
    const dailyMap = new Map<string, { income: number; expense: number }>();
    const now = new Date();
    // Initialize last 60 days map
    for(let i=59; i>=0; i--) {
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

    let runningBalance = 0; // Start from 0 for new accounts
    const dailyData: DailyBalance[] = [];
    
    Array.from(dailyMap.entries()).sort().forEach(([date, vals]) => {
      runningBalance += (vals.income - vals.expense);
      dailyData.push({
        date: date.slice(5), // MM-DD
        balance: runningBalance,
        income: vals.income,
        expense: vals.expense
      });
    });

    // Pie Data
    const expenseCategories: {[key: string]: number} = {};
    transactions.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
        expenseCategories[t.category] = (expenseCategories[t.category] || 0) + t.amount;
    });
    const pieData = Object.entries(expenseCategories).map(([name, value]) => ({ name, value }));

    // Doughnut Data
    const incomeSources: {[key: string]: number} = {};
    transactions.filter(t => t.type === TransactionType.INCOME).forEach(t => {
        incomeSources[t.category] = (incomeSources[t.category] || 0) + t.amount;
    });
    const doughnutData = Object.entries(incomeSources).map(([name, value]) => ({ name, value }));

    return { dailyData, pieData, doughnutData };
  }, [transactions]);

  // Handlers
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      date: new Date(),
      amount: parseFloat(formAmount),
      type: formType,
      category: formCategory,
      description: formDesc || 'No description'
    };
    setTransactions([newTransaction, ...transactions]);
    setIsAddModalOpen(false);
    setFormAmount('');
    setFormDesc('');
  };

  // Initialize Delete Process
  const initiateDelete = (id: string) => {
    setTransactionToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const confirmDelete = () => {
    if (transactionToDelete) {
      setTransactions(prev => prev.filter(t => t.id !== transactionToDelete));
      setTransactionToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const handleGenerateInsights = async () => {
    if (transactions.length === 0) {
      setAiInsights("<li>Please add some transactions first so I can analyze your spending habits!</li>");
      return;
    }
    setIsLoadingInsights(true);
    const insights = await generateFinancialInsights(transactions);
    setAiInsights(insights);
    setIsLoadingInsights(false);
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert("No transactions to export.");
      return;
    }

    const headers = ["Date", "Type", "Category", "Description", "Amount", "Currency"];
    const rows = transactions.map(t => {
      const dateStr = t.date.toISOString().split('T')[0];
      const cleanDesc = t.description.replace(/"/g, '""'); // Escape quotes
      return [
        dateStr,
        t.type,
        t.category,
        `"${cleanDesc}"`,
        t.amount.toFixed(2),
        currencyCode
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `finsight_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // View Components
  const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
    <button 
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${active ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  // Render Logic
  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-primary-500 p-2 rounded-lg">
              <Wallet className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">FinSight</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-500">
            <X size={24} />
          </button>
        </div>

        <nav className="px-4 space-y-2 mt-6">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')} 
          />
          <SidebarItem 
            icon={Crown} 
            label="Subscription" 
            active={view === 'subscription'} 
            onClick={() => setView('subscription')} 
          />
          <SidebarItem 
            icon={SettingsIcon} 
            label="Settings" 
            active={view === 'settings'} 
            onClick={() => setView('settings')} 
          />
        </nav>

        <div className="absolute bottom-8 left-4 right-4">
           <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold uppercase overflow-hidden">
                {user?.picture ? (
                  <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.name.slice(0, 2)
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.plan.replace('_', ' ')} Plan</p>
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors py-2"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center md:hidden">
            <button onClick={() => setIsMobileMenuOpen(true)} className="mr-4 text-slate-500">
              <Menu size={24} />
            </button>
            <span className="font-bold text-lg dark:text-white">FinSight</span>
          </div>
          
          <h1 className="hidden md:block text-2xl font-bold text-slate-800 dark:text-white capitalize">
            {view === 'dashboard' ? 'Financial Overview' : view.replace('_', ' ')}
          </h1>

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="hidden md:flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-primary-500/20"
            >
              <PlusCircle size={18} />
              <span>Add Transaction</span>
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="md:hidden bg-primary-600 text-white p-2 rounded-full shadow-lg"
            >
              <PlusCircle size={20} />
            </button>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto">
          {view === 'subscription' && user && (
            <SubscriptionScreen 
              user={user} 
              plans={currentPlans} 
              onUpgrade={handleUpgradeClick} 
              currencySymbol={currencySymbol}
              currencyCode={currencyCode}
            />
          )}

          {view === 'dashboard' && (
            <div className="space-y-6">
              
              {/* 3x3 Grid Layout Concept */}
              {/* Top Row: Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  title="Total Balance" 
                  value={`${currencySymbol}${stats.balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
                  trend={12.5} 
                  icon={Wallet} 
                  colorClass="bg-primary-500" 
                  currencySymbol={currencySymbol}
                />
                <StatCard 
                  title="Total Income" 
                  value={`${currencySymbol}${stats.totalIncome.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
                  trend={8.2} 
                  icon={TrendingUp} 
                  colorClass="bg-green-500" 
                  currencySymbol={currencySymbol}
                />
                <StatCard 
                  title="Total Expenses" 
                  value={`${currencySymbol}${stats.totalExpense.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} 
                  trend={-2.4} 
                  icon={TrendingDown} 
                  colorClass="bg-red-500" 
                  currencySymbol={currencySymbol}
                />
              </div>

              {/* Middle Row: Main Visualizations */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-96">
                {/* Large Chart - Takes 2 cols */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-primary-500" />
                    60-Day Net Worth Trend
                  </h3>
                  <div className="h-72 w-full">
                    <BalanceTrendChart data={chartData.dailyData} currency={currencySymbol} />
                  </div>
                </div>

                {/* Side Chart - AI Insights */}
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-indigo-500/30 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-32 bg-primary-500 rounded-full blur-[100px] opacity-20"></div>
                  <div className="relative z-10 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold flex items-center">
                        <Sparkles className="w-5 h-5 mr-2 text-yellow-300" />
                        Gemini AI Advisor
                      </h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                      {!aiInsights && !isLoadingInsights && (
                        <div className="text-center mt-10 opacity-80">
                          <p>Click below to analyze your spending habits.</p>
                        </div>
                      )}
                      {isLoadingInsights && (
                         <div className="flex flex-col items-center justify-center h-full space-y-3">
                           <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                           <p className="text-sm text-indigo-200">Analyzing financial data...</p>
                         </div>
                      )}
                      {aiInsights && (
                        <div className="prose prose-invert prose-sm">
                           <ul className="list-disc pl-4 space-y-2 text-indigo-100" dangerouslySetInnerHTML={{__html: aiInsights}}></ul>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={handleGenerateInsights}
                      disabled={isLoadingInsights}
                      className="mt-4 w-full bg-white text-indigo-900 py-2 px-4 rounded-lg font-semibold hover:bg-indigo-50 transition-colors disabled:opacity-50"
                    >
                      {aiInsights ? 'Refresh Insights' : 'Generate Insights'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Secondary Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Expense Breakdown</h3>
                  <div className="h-64">
                    <ExpensePieChart data={chartData.pieData} currency={currencySymbol} />
                  </div>
                </div>
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Income Sources</h3>
                  <div className="h-64">
                    <IncomeDoughnutChart data={chartData.doughnutData} currency={currencySymbol} />
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Daily Activity</h3>
                  <div className="h-64">
                    <DailyBarChart data={chartData.dailyData} currency={currencySymbol} />
                  </div>
                </div>
              </div>

              {/* Transactions List */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-96">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">All Transactions</h3>
                    <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full hidden sm:inline-block">{transactions.length} items</span>
                  </div>
                  <button 
                    onClick={handleExportCSV}
                    disabled={transactions.length === 0}
                    className="flex items-center space-x-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Download CSV"
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline">Export CSV</span>
                  </button>
                </div>
                <div className="overflow-y-auto flex-1">
                  {transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
                        <Sparkles size={32} className="text-slate-300 dark:text-slate-600" />
                      </div>
                      <p className="font-medium">No transactions yet</p>
                      <p className="text-sm mt-1 mb-4">Add your first income or expense to get started</p>
                      <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="text-primary-600 font-bold text-sm hover:underline"
                      >
                        Add Transaction
                      </button>
                    </div>
                  ) : (
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Category</th>
                          <th className="px-6 py-3">Description</th>
                          <th className="px-6 py-3 text-right">Amount</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((t) => (
                          <tr key={t.id} className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                              {t.date.toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                t.type === TransactionType.INCOME 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {t.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                              {t.description}
                            </td>
                            <td className={`px-6 py-4 text-right font-bold ${
                               t.type === TransactionType.INCOME ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {t.type === TransactionType.INCOME ? '+' : '-'}{currencySymbol}{t.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                type="button" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  initiateDelete(t.id);
                                }}
                                className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                title="Delete Transaction"
                              >
                                <Trash2 size={18} />
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

          {view === 'settings' && (
            <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
               <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Application Settings</h2>
               
               <div className="space-y-8">
                 <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
                   <div>
                     <h3 className="text-lg font-medium text-slate-900 dark:text-white">Appearance</h3>
                     <p className="text-slate-500 text-sm">Switch between light and dark modes.</p>
                   </div>
                   <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                     <button 
                       onClick={() => setTheme('light')}
                       className={`p-2 rounded-md transition-all ${theme === 'light' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-400'}`}
                     >
                       <Sun size={20} />
                     </button>
                     <button 
                       onClick={() => setTheme('dark')}
                       className={`p-2 rounded-md transition-all ${theme === 'dark' ? 'bg-slate-700 shadow-sm text-primary-400' : 'text-slate-400'}`}
                     >
                       <Moon size={20} />
                     </button>
                   </div>
                 </div>

                 <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
                   <div>
                     <h3 className="text-lg font-medium text-slate-900 dark:text-white">Currency</h3>
                     <p className="text-slate-500 text-sm">Select your preferred display currency.</p>
                   </div>
                   <select 
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 max-w-[150px] md:max-w-xs"
                   >
                     {CURRENCIES.map(c => (
                       <option key={c.code} value={c.code}>{c.code} ({c.symbol}) - {c.name}</option>
                     ))}
                   </select>
                 </div>

                 <div className="pb-6">
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Data Management</h3>
                     <p className="text-slate-500 text-sm mb-4">Reset your dashboard data to default demo state.</p>
                     <button 
                       onClick={() => setTransactions(generateMockData(60))}
                       className="text-red-500 hover:text-red-600 font-medium text-sm hover:underline"
                     >
                       Reset Demo Data
                     </button>
                 </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Transaction Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Add New Transaction"
      >
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setFormType(TransactionType.INCOME)}
                className={`flex-1 py-2 rounded-lg border flex items-center justify-center space-x-2 ${
                  formType === TransactionType.INCOME 
                  ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <PlusCircle size={16} />
                <span>Income</span>
              </button>
              <button
                type="button"
                onClick={() => setFormType(TransactionType.EXPENSE)}
                className={`flex-1 py-2 rounded-lg border flex items-center justify-center space-x-2 ${
                  formType === TransactionType.EXPENSE 
                  ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                  : 'border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <MinusCircle size={16} />
                <span>Expense</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{currencySymbol}</span>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value as Category)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
            >
              {Object.values(Category).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <input
              type="text"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              placeholder="e.g. Weekly Groceries"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-primary-500/25 mt-2"
          >
            Save Transaction
          </button>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Delete Transaction"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-slate-700 dark:text-slate-300">
                Are you sure you want to delete this transaction? This action cannot be undone.
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3 mt-6 pt-4">
            <button 
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDelete}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-red-500/30 flex justify-center items-center"
            >
              <Trash2 size={18} className="mr-2" />
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Payment Gateway Simulation Modal */}
      <PaymentModal 
        plan={selectedPlan} 
        user={user}
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
        currencyCode={currencyCode}
        currencySymbol={currencySymbol}
      />
    </div>
  );
};

export default App;