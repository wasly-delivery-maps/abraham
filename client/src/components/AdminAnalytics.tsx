import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Users,
  Truck,
  Package,
  DollarSign,
  Clock,
} from "lucide-react";

interface AnalyticsData {
  dailyOrders: Array<{ date: string; orders: number; revenue: number }>;
  orderStatus: Array<{ status: string; count: number }>;
  topDrivers: Array<{ name: string; orders: number; rating: number }>;
  peakHours: Array<{ hour: string; orders: number }>;
  metrics: {
    totalOrders: number;
    totalRevenue: number;
    averageRating: number;
    activeDrivers: number;
    completionRate: number;
    averageDeliveryTime: number;
  };
}

const COLORS = ["#FF6B35", "#2196F3", "#4CAF50", "#FFC107", "#9C27B0", "#00BCD4"];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export function AdminAnalytics({ data }: { data: AnalyticsData }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      dir="rtl"
    >
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">إجمالي الطلبات</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    {data.metrics.totalOrders.toLocaleString()}
                  </p>
                </div>
                <div className="bg-orange-100 p-4 rounded-lg">
                  <Package className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">الإيرادات الإجمالية</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {data.metrics.totalRevenue.toLocaleString()} ر.س
                  </p>
                </div>
                <div className="bg-blue-100 p-4 rounded-lg">
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">معدل الإكمال</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {data.metrics.completionRate}%
                  </p>
                </div>
                <div className="bg-green-100 p-4 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">السائقون النشطون</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {data.metrics.activeDrivers}
                  </p>
                </div>
                <div className="bg-purple-100 p-4 rounded-lg">
                  <Truck className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-red-50 to-white border-2 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">متوسط التقييم</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {data.metrics.averageRating.toFixed(1)} ⭐
                  </p>
                </div>
                <div className="bg-red-100 p-4 rounded-lg">
                  <Users className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-cyan-50 to-white border-2 border-cyan-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">متوسط وقت التوصيل</p>
                  <p className="text-3xl font-bold text-cyan-600 mt-2">
                    {data.metrics.averageDeliveryTime} دقيقة
                  </p>
                </div>
                <div className="bg-cyan-100 p-4 rounded-lg">
                  <Clock className="h-8 w-8 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Orders Chart */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 border-orange-200">
            <CardHeader>
              <CardTitle>الطلبات اليومية</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.dailyOrders}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#FF6B35"
                    name="الطلبات"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Order Status Distribution */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle>توزيع حالات الطلبات</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.orderStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {data.orderStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Peak Hours */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 border-green-200">
            <CardHeader>
              <CardTitle>ساعات الذروة</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.peakHours}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#4CAF50" name="الطلبات" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Drivers */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 border-purple-200">
            <CardHeader>
              <CardTitle>أفضل السائقين</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.topDrivers.map((driver, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{driver.name}</p>
                      <p className="text-sm text-gray-600">
                        {driver.orders} طلب • ⭐ {driver.rating.toFixed(1)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-600">
                        #{index + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
