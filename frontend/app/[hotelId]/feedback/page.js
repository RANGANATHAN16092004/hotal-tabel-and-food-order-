import { 
  MessageSquare, 
  Send, 
  ChevronLeft, 
  Target, 
  HelpCircle, 
  Layout, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function FeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState({
    type: 'suggestion',
    subject: '',
    message: '',
    orderId: ''
  });
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!customerAuth.isValidSession(params.hotelId)) {
      router.push(`/${params.hotelId}/login`);
      return;
    }
    const customer = customerAuth.getCustomer();
    fetchOrders(customer.id);
  }, [params.hotelId]);

  const fetchOrders = async (customerId) => {
    try {
      const response = await customerAPI.getOrders(customerId);
      if (response.data.success) {
        setOrders(response.data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Sending your feedback...');

    try {
      const customer = customerAuth.getCustomer();
      const data = {
        hotelId: customer.hotelId,
        customerId: customer.id,
        type: formData.type,
        subject: formData.subject,
        message: formData.message,
        orderId: formData.orderId || undefined
      };

      const response = await customerAPI.createFeedback(data);
      if (response.data.success) {
        toast.success('Feedback sent! We value your input.', { id: toastId });
        setFormData({
          type: 'suggestion',
          subject: '',
          message: '',
          orderId: ''
        });
      }
    } catch (error) {
      toast.error('Submission failed. Please try again.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto space-y-12 font-outfit pb-20">
        {/* Header */}
        <div className="flex items-center gap-4">
            <Link href={`/${params.hotelId}/menu`} className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                <ChevronLeft size={24} />
            </Link>
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Establishment Feedback</h1>
                <p className="text-slate-500 mt-1 font-medium italic">Your direct uplink to management.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                 <MessageSquare size={120} className="text-indigo-600" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Target size={14} className="text-indigo-600" /> Intake Type
                    </label>
                    <div className="relative">
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 font-bold appearance-none cursor-pointer"
                      >
                        <option value="complaint">Critical Complaint</option>
                        <option value="suggestion">Strategic Suggestion</option>
                        <option value="compliment">Quality Compliment</option>
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                         <HelpCircle size={18} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Layout size={14} className="text-indigo-600" /> Subject Node
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 font-bold placeholder:text-slate-300"
                      placeholder="Transmission topic..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-indigo-600" /> Link Order (Optional)
                  </label>
                  <select
                    value={formData.orderId}
                    onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 font-bold appearance-none cursor-pointer"
                  >
                    <option value="">No linked order</option>
                    {orders.map((order) => (
                      <option key={order._id} value={order._id}>
                        ORDER #{order.orderNumber || order._id.slice(-6).toUpperCase()} — {new Date(order.orderDate).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <MessageSquare size={14} className="text-indigo-600" /> Detailed Message
                  </label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 font-medium italic min-h-[200px] resize-none placeholder:text-slate-300"
                    placeholder="Share your experience, requirements, or operational concerns..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-18 bg-slate-900 text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.4em] shadow-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? 'TRANSMITTING...' : 'SEND TRANSMISSION'} <Send size={20} />
                </button>
              </form>
            </motion.div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/20 transition-colors" />
               <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 italic">Protocol Notice</h3>
               <div className="space-y-4">
                  {[
                    "Every submission is analyzed by the core team.",
                    "Expect synchronization within 24-48 standard hours.",
                    "Emergency uplink: Contact established node directly."
                  ].map((text, i) => (
                    <div key={i} className="flex gap-4">
                       <div className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                       <p className="text-xs font-medium text-slate-300 leading-relaxed opacity-80">{text}</p>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-100 rounded-[2.5rem] p-8 text-center">
               <AlertCircle size={28} className="text-indigo-600 mx-auto mb-4" />
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed italic">
                 Security Verification: Your session is encrypted. All feedback is logged under your unique identifier for authenticity.
               </p>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}





