import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  Bot,
  Calculator,
  Clock,
  Cloud,
  Code2,
  Handshake,
  Headphones,
  IndianRupee,
  Lightbulb,
  RefreshCw,
  Shield,
  Smartphone,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useActor } from "../hooks/useActor";
import { useSubmitContactForm, useSubmitROILead } from "../hooks/useQueries";

const services = [
  {
    icon: Code2,
    title: "Web Development",
    desc: "Custom websites and web applications tailored to your business needs.",
  },
  {
    icon: Smartphone,
    title: "Mobile App Development",
    desc: "iOS and Android solutions that delight your customers.",
  },
  {
    icon: Cloud,
    title: "Cloud Solutions",
    desc: "Scalable cloud infrastructure to power your growth.",
  },
  {
    icon: Zap,
    title: "Digital Transformation",
    desc: "End-to-end digital journey from strategy to execution.",
  },
  {
    icon: Bot,
    title: "AI & Automation",
    desc: "Intelligent business automation that saves time and money.",
  },
];

const whyUs = [
  {
    icon: Users,
    title: "Expert Team",
    desc: "Seasoned developers and consultants",
  },
  {
    icon: Shield,
    title: "Quality First",
    desc: "Rigorous testing and code standards",
  },
  { icon: Lightbulb, title: "Innovation", desc: "Cutting-edge tech solutions" },
  {
    icon: Handshake,
    title: "Partnership",
    desc: "Long-term client relationships",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    desc: "Always available when you need us",
  },
];

const faqs = [
  {
    q: "I already have a WhatsApp number and a Facebook page. Why do I need a website and an app?",
    a: 'Social media is "rented land." If the platform changes its algorithm or closes your account, you lose your customers. A professional website and app are "owned assets." They build much higher trust with premium customers and allow you to collect data (emails/phone numbers) so you can market to your audience directly without paying for ads.',
  },
  {
    q: 'I am not a "tech person." How will I manage the app and website?',
    a: 'We build our solutions with a "User-First" Admin Dashboard. If you can use WhatsApp or Facebook, you can manage your new digital store. We also provide a 2-hour training session for you and your staff, plus a "Quick Start" manual to handle daily updates like changing prices or adding new products.',
  },
  {
    q: "How long does the entire process take?",
    a: "A standard digital transformation (Web + Basic App) typically takes 4 to 6 weeks. Week 1-2: Design and Approval. Week 3-4: Development and Testing. Week 5-6: Launch and Staff Training.",
  },
  {
    q: 'Will my business be "down" while you are building this?',
    a: 'Not at all. Your current physical operations and any existing social media pages will continue to run as usual. We build the digital system in the background and only "flip the switch" to go live once everything is tested and you are 100% satisfied.',
  },
  {
    q: "What happens after the launch? Do you provide support?",
    a: 'Yes. We don\'t just "build and disappear." Every project includes 30 days of free post-launch support. After that, we offer affordable Maintenance Plans that cover security updates, cloud hosting management, and minor content changes to ensure your tech stays fast and secure.',
  },
];

function formatINR(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function HomePage() {
  const [roiInputs, setRoiInputs] = useState({
    monthlyRevenue: "",
    staffHours: "",
    abandonedLeads: "",
    avgOrderValue: "",
  });
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditForm, setAuditForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [auditDone, setAuditDone] = useState(false);

  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [contactDone, setContactDone] = useState(false);
  const [showRetry, setShowRetry] = useState(false);

  const submitContact = useSubmitContactForm();
  const submitROI = useSubmitROILead();
  const { actor } = useActor();

  // Show retry button if actor is still null after 5 seconds
  useEffect(() => {
    if (actor) {
      setShowRetry(false);
      return;
    }
    const timer = setTimeout(() => {
      if (!actor) setShowRetry(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [actor]);

  const h = Number.parseFloat(roiInputs.staffHours) || 0;
  const l = Number.parseFloat(roiInputs.abandonedLeads) || 0;
  const aov = Number.parseFloat(roiInputs.avgOrderValue) || 0;
  const timeRecovery = h * 200;
  const revenueRecovery = l * aov;
  const totalGain = timeRecovery + revenueRecovery;

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitContact.mutateAsync({
        name: contactForm.name,
        email: contactForm.email,
        phone: contactForm.phone,
        message: contactForm.message,
        submittedAt: BigInt(Date.now()),
      });
      setContactDone(true);
      toast.success("Message sent! We'll get back to you soon.");
    } catch {
      toast.error("Failed to send message. Please try again.");
    }
  };

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitROI.mutateAsync({
        name: auditForm.name,
        email: auditForm.email,
        phone: auditForm.phone,
        monthlyRevenue: roiInputs.monthlyRevenue,
        staffHours: roiInputs.staffHours,
        abandonedLeads: roiInputs.abandonedLeads,
        calculatedGain: totalGain.toString(),
        submittedAt: BigInt(Date.now()),
      });
      setAuditDone(true);
      toast.success("Audit report requested! We'll send it to your email.");
    } catch {
      toast.error("Failed to submit. Please try again.");
    }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="hero-bg py-20 lg:py-28" id="home">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full px-4 py-1.5 mb-6">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <span className="text-accent text-sm font-medium">
                  Trusted by 10+ Clients
                </span>
              </div>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-foreground leading-tight mb-6">
                Transform Your Business with{" "}
                <span className="text-accent">Smart Technology</span>
              </h1>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                We bridge the gap between complex technology and practical
                business needs, delivering digital transformation solutions that
                drive real, measurable results.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  className="btn-gradient text-white font-semibold px-6 py-3 shadow-teal-glow-sm hover:shadow-teal-glow transition-all"
                  onClick={() => scrollTo("contact")}
                  data-ocid="hero.get_quote.button"
                >
                  Get a Quote <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  className="border-accent text-accent hover:bg-accent/10 px-6 py-3"
                  onClick={() => scrollTo("roi")}
                  data-ocid="hero.roi_calculator.button"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  ROI Calculator
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:flex justify-center items-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-accent/10 rounded-3xl blur-3xl" />
                <img
                  src="/assets/generated/hero-tech-illustration.dim_600x500.png"
                  alt="Tech Illustration"
                  className="relative w-full max-w-lg rounded-2xl"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section id="roi" className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold text-foreground mb-3">
              Calculate Your Potential ROI
            </h2>
            <p className="text-muted-foreground">
              See how much you could gain by digitizing your business operations
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-8 shadow-card"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <Label className="text-foreground mb-2 block">
                  <IndianRupee className="w-4 h-4 inline mr-1 text-accent" />
                  Current Monthly Revenue (₹)
                </Label>
                <Input
                  type="number"
                  placeholder="e.g. 500000"
                  value={roiInputs.monthlyRevenue}
                  onChange={(e) =>
                    setRoiInputs((p) => ({
                      ...p,
                      monthlyRevenue: e.target.value,
                    }))
                  }
                  className="bg-input border-border text-foreground"
                  data-ocid="roi.monthly_revenue.input"
                />
              </div>
              <div>
                <Label className="text-foreground mb-2 block">
                  <Clock className="w-4 h-4 inline mr-1 text-accent" />
                  Staff Hours on Manual Tasks/month
                  <span className="text-muted-foreground text-xs ml-1">
                    (avg ₹200/hr)
                  </span>
                </Label>
                <Input
                  type="number"
                  placeholder="e.g. 80"
                  value={roiInputs.staffHours}
                  onChange={(e) =>
                    setRoiInputs((p) => ({ ...p, staffHours: e.target.value }))
                  }
                  className="bg-input border-border text-foreground"
                  data-ocid="roi.staff_hours.input"
                />
              </div>
              <div>
                <Label className="text-foreground mb-2 block">
                  <TrendingUp className="w-4 h-4 inline mr-1 text-accent" />
                  Estimated Abandoned Leads/month
                </Label>
                <Input
                  type="number"
                  placeholder="e.g. 20"
                  value={roiInputs.abandonedLeads}
                  onChange={(e) =>
                    setRoiInputs((p) => ({
                      ...p,
                      abandonedLeads: e.target.value,
                    }))
                  }
                  className="bg-input border-border text-foreground"
                  data-ocid="roi.abandoned_leads.input"
                />
              </div>
              <div>
                <Label className="text-foreground mb-2 block">
                  <IndianRupee className="w-4 h-4 inline mr-1 text-accent" />
                  Average Order Value (₹)
                </Label>
                <Input
                  type="number"
                  placeholder="e.g. 5000"
                  value={roiInputs.avgOrderValue}
                  onChange={(e) =>
                    setRoiInputs((p) => ({
                      ...p,
                      avgOrderValue: e.target.value,
                    }))
                  }
                  className="bg-input border-border text-foreground"
                  data-ocid="roi.avg_order_value.input"
                />
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-background border border-border rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  Time Recovery
                </p>
                <p className="text-2xl font-bold text-accent">
                  {formatINR(timeRecovery)}
                </p>
                <p className="text-xs text-muted-foreground">/month</p>
              </div>
              <div className="bg-background border border-border rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  Revenue Recovery
                </p>
                <p className="text-2xl font-bold text-accent">
                  {formatINR(revenueRecovery)}
                </p>
                <p className="text-xs text-muted-foreground">/month</p>
              </div>
              <div className="bg-accent/10 border border-accent/40 rounded-xl p-4 text-center">
                <p className="text-xs text-accent mb-1 font-medium">
                  Total Monthly Gain
                </p>
                <p className="text-3xl font-extrabold text-accent">
                  {formatINR(totalGain)}
                </p>
                <p className="text-xs text-accent/70">/month</p>
              </div>
            </div>

            <div className="text-center">
              <Button
                className="btn-gradient text-white font-semibold px-8 shadow-teal-glow-sm"
                onClick={() => setAuditOpen(true)}
                data-ocid="roi.get_audit.button"
              >
                Get My Full Audit Report
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-card/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <h2 className="text-3xl font-bold text-foreground">Our Services</h2>
            <div className="w-16 h-1 bg-accent rounded-full mt-3" />
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card border border-border rounded-xl p-6 hover:border-accent/50 hover:shadow-teal-glow-sm transition-all group"
                data-ocid={`services.item.${i + 1}`}
              >
                <div className="w-11 h-11 bg-accent/10 border border-accent/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <s.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">{s.desc}</p>
                <button
                  type="button"
                  onClick={() => scrollTo("contact")}
                  className="text-xs text-accent hover:underline flex items-center gap-1"
                >
                  Learn More <ArrowRight className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How We Work Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold text-foreground mb-3">
              How We Work
            </h2>
            <div className="w-16 h-1 bg-accent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground max-w-xl mx-auto">
              Real-time monitoring and agile delivery for every project.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="max-w-4xl mx-auto"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-accent/20">
              <img
                src="/assets/generated/developer-monitoring.dim_800x500.jpg"
                alt="Developer monitoring dashboard showing real-time analytics and system metrics"
                className="w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#000080]/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-white font-semibold text-lg">
                  Live Project Monitoring & Delivery
                </p>
                <p className="text-white/80 text-sm mt-1">
                  We track every metric so your project stays on time, on
                  budget, and performing at peak.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About + Why Choose Us */}
      <section id="why-us" className="py-20 bg-card/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* About */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-foreground mb-2">
                About Us
              </h2>
              <div className="w-12 h-1 bg-accent rounded-full mb-6" />
              <p className="text-muted-foreground leading-relaxed mb-6">
                SysTrans Technologies is a forward-thinking IT startup dedicated
                to transforming businesses through innovative software
                solutions. We bridge the gap between complex technology and
                practical business needs, delivering solutions that drive real
                results.
              </p>
              <div className="bg-card border border-accent/30 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-accent mb-2">Our Mission</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  To empower businesses of all sizes with cutting-edge digital
                  tools that create competitive advantages and drive sustainable
                  growth.
                </p>
              </div>
              {/* Team Photo */}
              <div>
                <img
                  src="/assets/generated/team-photo.dim_800x500.jpg"
                  alt="The SysTrans Technologies team collaborating in the office"
                  className="w-full rounded-2xl object-cover max-h-56"
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Our Team
                </p>
              </div>
            </motion.div>

            {/* Why Choose Us */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Why Choose Us
              </h2>
              <div className="w-12 h-1 bg-accent rounded-full mb-6" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {whyUs.map((item, i) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 bg-card border border-border rounded-xl p-4"
                    data-ocid={`why-us.item.${i + 1}`}
                  >
                    <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">
                        {item.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ + Contact */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* FAQ */}
            <div id="faq">
              <h2 className="text-3xl font-bold text-foreground mb-2">FAQ</h2>
              <div className="w-12 h-1 bg-accent rounded-full mb-6" />
              <Accordion
                type="single"
                collapsible
                className="space-y-3"
                data-ocid="faq.list"
              >
                {faqs.map((faq, i) => (
                  <AccordionItem
                    key={faq.q.slice(0, 30)}
                    value={`faq-${i}`}
                    className="bg-card border border-border rounded-xl px-4 data-[state=open]:border-accent/40"
                    data-ocid={`faq.item.${i + 1}`}
                  >
                    <AccordionTrigger className="text-sm font-medium text-foreground hover:text-accent hover:no-underline text-left">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Contact Form */}
            <div id="contact">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Get In Touch
              </h2>
              <div className="w-12 h-1 bg-accent rounded-full mb-6" />

              {/* Connection retry notice */}
              {!actor && showRetry && (
                <div
                  className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4"
                  data-ocid="contact.error_state"
                >
                  <p className="text-sm text-amber-700">
                    Connection is taking longer than expected.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-amber-400 text-amber-700 hover:bg-amber-100 ml-3 shrink-0"
                    onClick={() => window.location.reload()}
                    data-ocid="contact.retry.button"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" /> Retry
                  </Button>
                </div>
              )}

              {contactDone ? (
                <div
                  className="bg-accent/10 border border-accent/40 rounded-xl p-8 text-center"
                  data-ocid="contact.success_state"
                >
                  <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Message Received!
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    We'll get back to you within 24 hours.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 border-accent text-accent"
                    onClick={() => setContactDone(false)}
                  >
                    Send Another
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={handleContactSubmit}
                  className="bg-card border border-border rounded-xl p-6 space-y-4"
                  data-ocid="contact.form"
                >
                  <div>
                    <Label className="text-foreground mb-1 block">Name</Label>
                    <Input
                      required
                      placeholder="Your full name"
                      value={contactForm.name}
                      onChange={(e) =>
                        setContactForm((p) => ({ ...p, name: e.target.value }))
                      }
                      className="bg-input border-border text-foreground"
                      data-ocid="contact.name.input"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground mb-1 block">Email</Label>
                    <Input
                      required
                      type="email"
                      placeholder="your@email.com"
                      value={contactForm.email}
                      onChange={(e) =>
                        setContactForm((p) => ({ ...p, email: e.target.value }))
                      }
                      className="bg-input border-border text-foreground"
                      data-ocid="contact.email.input"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground mb-1 block">Phone</Label>
                    <Input
                      placeholder="+91 98765 43210"
                      value={contactForm.phone}
                      onChange={(e) =>
                        setContactForm((p) => ({ ...p, phone: e.target.value }))
                      }
                      className="bg-input border-border text-foreground"
                      data-ocid="contact.phone.input"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground mb-1 block">
                      Message
                    </Label>
                    <Textarea
                      required
                      placeholder="Tell us about your project..."
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) =>
                        setContactForm((p) => ({
                          ...p,
                          message: e.target.value,
                        }))
                      }
                      className="bg-input border-border text-foreground resize-none"
                      data-ocid="contact.message.textarea"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="btn-gradient text-white w-full font-semibold"
                    disabled={!actor || submitContact.isPending}
                    data-ocid="contact.submit.button"
                  >
                    {!actor
                      ? "Connecting..."
                      : submitContact.isPending
                        ? "Sending..."
                        : "Send Message"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* ROI Audit Modal */}
      <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
        <DialogContent
          className="bg-card border-border text-foreground max-w-md"
          data-ocid="roi.modal"
        >
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {auditDone ? "Report Requested!" : "Get Your Full Audit Report"}
            </DialogTitle>
          </DialogHeader>

          {auditDone ? (
            <div className="text-center py-6" data-ocid="roi.success_state">
              <div className="w-14 h-14 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-7 h-7 text-accent" />
              </div>
              <p className="text-muted-foreground mb-2">
                Your full audit report is on its way!
              </p>
              <p className="text-sm text-accent font-semibold">
                Potential Monthly Gain: {formatINR(totalGain)}
              </p>
              <Button
                className="mt-4 btn-gradient text-white"
                onClick={() => {
                  setAuditOpen(false);
                  setAuditDone(false);
                }}
                data-ocid="roi.close.button"
              >
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleAuditSubmit} className="space-y-4">
              {/* Connection retry notice in modal */}
              {!actor && showRetry && (
                <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <p className="text-xs text-amber-700">
                    Taking longer to connect.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-amber-400 text-amber-700 hover:bg-amber-100 ml-2 shrink-0 text-xs h-7"
                    onClick={() => window.location.reload()}
                    data-ocid="roi.retry.button"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" /> Retry
                  </Button>
                </div>
              )}
              <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
                <p className="text-xs text-accent font-medium">
                  Your Calculated Gain
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatINR(totalGain)}
                  <span className="text-sm text-muted-foreground">/month</span>
                </p>
              </div>
              <div>
                <Label className="text-foreground mb-1 block">Name</Label>
                <Input
                  required
                  placeholder="Your full name"
                  value={auditForm.name}
                  onChange={(e) =>
                    setAuditForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="bg-input border-border text-foreground"
                  data-ocid="roi.name.input"
                />
              </div>
              <div>
                <Label className="text-foreground mb-1 block">Email</Label>
                <Input
                  required
                  type="email"
                  placeholder="your@email.com"
                  value={auditForm.email}
                  onChange={(e) =>
                    setAuditForm((p) => ({ ...p, email: e.target.value }))
                  }
                  className="bg-input border-border text-foreground"
                  data-ocid="roi.email.input"
                />
              </div>
              <div>
                <Label className="text-foreground mb-1 block">Phone</Label>
                <Input
                  required
                  placeholder="+91 98765 43210"
                  value={auditForm.phone}
                  onChange={(e) =>
                    setAuditForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="bg-input border-border text-foreground"
                  data-ocid="roi.phone.input"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-border text-muted-foreground"
                  onClick={() => setAuditOpen(false)}
                  data-ocid="roi.cancel.button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 btn-gradient text-white"
                  disabled={!actor || submitROI.isPending}
                  data-ocid="roi.submit.button"
                >
                  {!actor
                    ? "Connecting..."
                    : submitROI.isPending
                      ? "Submitting..."
                      : "Get Report"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
