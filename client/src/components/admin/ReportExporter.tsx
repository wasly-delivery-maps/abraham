import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Calendar, FileText, Filter } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ReportExporterProps {
  orders: any[];
  users: any[];
  stats: any;
}

export function ReportExporter({ orders, users, stats }: ReportExporterProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [reportType, setReportType] = useState<"summary" | "detailed" | "drivers" | "customers">("summary");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exportFormat, setExportFormat] = useState<"excel" | "csv">("excel");

  const filterDataByDate = (data: any[], dateField: string = "createdAt") => {
    if (!startDate && !endDate) return data;
    
    return data.filter((item) => {
      const itemDate = new Date(item[dateField]);
      const start = startDate ? new Date(startDate) : new Date("1970-01-01");
      const end = endDate ? new Date(endDate) : new Date("2099-12-31");
      return itemDate >= start && itemDate <= end;
    });
  };

  const generateSummaryReport = () => {
    const filteredOrders = filterDataByDate(orders);
    const completedOrders = filteredOrders.filter((o) => o.status === "delivered");
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.price || 0), 0);
    const drivers = users.filter((u) => u.role === "driver");
    const customers = users.filter((u) => u.role === "customer");

    return [
      { "المقياس": "إجمالي الطلبات", "القيمة": filteredOrders.length },
      { "المقياس": "الطلبات المكتملة", "القيمة": completedOrders.length },
      { "المقياس": "نسبة الإنجاز", "القيمة": `${filteredOrders.length > 0 ? ((completedOrders.length / filteredOrders.length) * 100).toFixed(2) : 0}%` },
      { "المقياس": "إجمالي الإيرادات", "القيمة": `ج.م ${totalRevenue.toFixed(2)}` },
      { "المقياس": "عدد السائقين", "القيمة": drivers.length },
      { "المقياس": "عدد العملاء", "القيمة": customers.length },
      { "المقياس": "متوسط سعر الطلب", "القيمة": `ج.م ${filteredOrders.length > 0 ? (totalRevenue / filteredOrders.length).toFixed(2) : 0}` },
    ];
  };

  const generateDetailedReport = () => {
    const filteredOrders = filterDataByDate(orders);
    const usersMap = new Map(users.map((u: any) => [u.id, u]));

    return filteredOrders.map((order) => ({
      "رقم الطلب": `#${order.id}`,
      "العميل": usersMap.get(order.customerId)?.name || `عميل #${order.customerId}`,
      "السائق": order.driverId ? usersMap.get(order.driverId)?.name || `سائق #${order.driverId}` : "غير مسند",
      "السعر": `ج.م ${order.price.toFixed(2)}`,
      "الحالة": order.status,
      "التاريخ": new Date(order.createdAt).toLocaleDateString("ar-EG"),
    }));
  };

  const generateDriversReport = () => {
    const drivers = users.filter((u) => u.role === "driver");
    const filteredOrders = filterDataByDate(orders);

    return drivers.map((driver) => {
      const driverOrders = filteredOrders.filter((o) => o.driverId === driver.id);
      const completedOrders = driverOrders.filter((o) => o.status === "delivered");
      const totalEarnings = completedOrders.reduce((sum, o) => sum + (o.price || 0), 0);
      const pendingCommission = driver.pendingCommission || 0;

      return {
        "اسم السائق": driver.name,
        "الهاتف": driver.phone || "N/A",
        "عدد الطلبات": driverOrders.length,
        "الطلبات المكتملة": completedOrders.length,
        "إجمالي الأرباح": `ج.م ${totalEarnings.toFixed(2)}`,
        "العمولات المستحقة": `ج.م ${pendingCommission.toFixed(2)}`,
        "الحالة": driver.accountStatus || "نشط",
      };
    });
  };

  const generateCustomersReport = () => {
    const customers = users.filter((u) => u.role === "customer");
    const filteredOrders = filterDataByDate(orders);

    return customers.map((customer) => {
      const customerOrders = filteredOrders.filter((o) => o.customerId === customer.id);
      const completedOrders = customerOrders.filter((o) => o.status === "delivered");
      const totalSpent = customerOrders.reduce((sum, o) => sum + (o.price || 0), 0);

      return {
        "اسم العميل": customer.name,
        "البريد الإلكتروني": customer.email || "N/A",
        "الهاتف": customer.phone || "N/A",
        "عدد الطلبات": customerOrders.length,
        "الطلبات المكتملة": completedOrders.length,
        "إجمالي الإنفاق": `ج.م ${totalSpent.toFixed(2)}`,
        "تاريخ الانضمام": new Date(customer.createdAt).toLocaleDateString("ar-EG"),
      };
    });
  };

  const generateReport = () => {
    switch (reportType) {
      case "summary":
        return generateSummaryReport();
      case "detailed":
        return generateDetailedReport();
      case "drivers":
        return generateDriversReport();
      case "customers":
        return generateCustomersReport();
      default:
        return [];
    }
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const reportData = generateReport();
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(reportData);
      
      const columnWidths = Object.keys(reportData[0] || {}).map(() => 20);
      worksheet["!cols"] = columnWidths.map((width) => ({ wch: width }));

      XLSX.utils.book_append_sheet(workbook, worksheet, "التقرير");
      const fileName = `تقرير_wasly_${reportType}_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success("تم تصدير التقرير بنجاح ✅");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("فشل في تصدير التقرير");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const reportData = generateReport();
      let csvContent = "";

      const headers = Object.keys(reportData[0] || {});
      csvContent += headers.join(",") + "\n";
      
      reportData.forEach((row: any) => {
        const values = headers.map((header) => {
          const value = row[header] || "";
          return `"${value}"`;
        });
        csvContent += values.join(",") + "\n";
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `تقرير_wasly_${reportType}_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("تم تصدير التقرير بنجاح ✅");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("فشل في تصدير التقرير");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = async () => {
    if (exportFormat === "excel") {
      await exportToExcel();
    } else {
      await exportToCSV();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white px-6 rounded-xl font-bold h-12 shadow-lg shadow-orange-600/20 flex items-center gap-2">
          <Download className="h-4 w-4" />
          تصدير التقرير
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">تصدير التقارير المتقدم</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* نوع التقرير */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                نوع التقرير
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "summary", label: "ملخص عام", desc: "إحصائيات عامة وملخصة" },
                  { value: "detailed", label: "تفاصيل الطلبات", desc: "جميع الطلبات بالتفصيل" },
                  { value: "drivers", label: "تقرير السائقين", desc: "أداء وأرباح السائقين" },
                  { value: "customers", label: "تقرير العملاء", desc: "نشاط وإنفاق العملاء" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setReportType(option.value as any)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      reportType === option.value
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    <div className="font-bold">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.desc}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* الفلاتر الزمنية */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                الفترة الزمنية (اختياري)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">من تاريخ</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">إلى تاريخ</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* تنسيق الملف */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                تنسيق الملف
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-4">
                {[
                  { value: "excel", label: "Excel (.xlsx)", desc: "منسق وسهل التحرير" },
                  { value: "csv", label: "CSV (.csv)", desc: "متوافق مع جميع البرامج" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setExportFormat(option.value as any)}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all text-center ${
                      exportFormat === option.value
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    <div className="font-bold">{option.label}</div>
                    <div className="text-xs text-gray-600">{option.desc}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* زر التصدير */}
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12 font-bold text-lg rounded-xl"
          >
            {isExporting ? "جاري التصدير..." : "تصدير التقرير"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
