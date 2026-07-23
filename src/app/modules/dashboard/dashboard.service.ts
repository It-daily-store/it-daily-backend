import Order from "../order/order.model";

const getDashboardAnalyticsFromDB = async (year?: string) => {
  const selectedYear = year
    ? parseInt(year as string)
    : new Date().getFullYear();

  const startOfYear = new Date(`${selectedYear}-01-01T00:00:00.000Z`);
  const endOfYear = new Date(`${selectedYear + 1}-01-01T00:00:00.000Z`);

  // Match orders from selected year
  const matchStage = {
    createdAt: { $gte: startOfYear, $lt: endOfYear },
  };

  const stats = await Order.aggregate([
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalRevenue: { $sum: "$totalAmount" },
              avgOrderValue: { $avg: "$totalAmount" },
            },
          },
        ],
        pending: [
          {
            $match: { currentStatus: "pending" },
          },
          {
            $count: "pendingOrders",
          },
        ],
      },
    },
  ]);

  const totals = stats[0].totals[0] || {};
  const pending = stats[0].pending[0] || { pendingOrders: 0 };

  const overview = {
    totalOrders: totals.totalOrders || 0,
    totalRevenue: totals.totalRevenue || 0,
    avgOrderValue: totals.avgOrderValue || 0,
    pendingOrders: pending.pendingOrders || 0,
  };

  // 1. Monthly Revenue & Orders (12 months guaranteed)
  const monthlyStats = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $month: "$createdAt" },
        revenue: { $sum: "$totalAmount" },
        orders: { $sum: 1 },
      },
    },
    {
      $project: {
        monthNum: "$_id",
        revenue: 1,
        orders: 1,
        _id: 0,
      },
    },
    { $sort: { monthNum: 1 } },
  ]);

  // Fill missing months with 0s
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthlyMap = new Map(monthlyStats.map((m) => [m.monthNum, m]));
  const fullMonthlyStats = monthNames.map((name, idx) => {
    const data = monthlyMap.get(idx + 1);
    return {
      month: name,
      revenue: data?.revenue || 0,
      orders: data?.orders || 0,
    };
  });

  // 2. Order Status Distribution
  const orderStatusDistribution = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$currentStatus",
        value: { $sum: 1 },
      },
    },
    {
      $project: {
        name: {
          $switch: {
            branches: [
              { case: { $eq: ["$_id", "pending"] }, then: "Pending" },
              { case: { $eq: ["$_id", "confirmed"] }, then: "Confirmed" },
              { case: { $eq: ["$_id", "processing"] }, then: "Processing" },
              { case: { $eq: ["$_id", "shipped"] }, then: "Shipped" },
              { case: { $eq: ["$_id", "delivered"] }, then: "Delivered" },
              { case: { $eq: ["$_id", "cancelled"] }, then: "Cancelled" },
              { case: { $eq: ["$_id", "returned"] }, then: "Returned" },
            ],
            default: "$_id",
          },
        },
        value: 1,
      },
    },
    { $sort: { value: -1 } },
  ]);

  // 3. Payment Method Distribution
  const paymentMethodDistribution = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$paymentMethod",
        value: { $sum: 1 },
      },
    },
    {
      $project: {
        name: {
          $switch: {
            branches: [
              { case: { $eq: ["$_id", "cod"] }, then: "COD" },
              { case: { $eq: ["$_id", "card"] }, then: "Card" },
              { case: { $eq: ["$_id", "paypal"] }, then: "PayPal" },
              {
                case: { $eq: ["$_id", "bank_transfer"] },
                then: "Bank Transfer",
              },
            ],
            default: "$_id",
          },
        },
        value: 1,
      },
    },
  ]);

  // 4. Payment Status Distribution
  const paymentStatusDistribution = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$paymentStatus",
        value: { $sum: 1 },
      },
    },
    {
      $project: {
        name: {
          $switch: {
            branches: [
              { case: { $eq: ["$_id", "paid"] }, then: "Paid" },
              { case: { $eq: ["$_id", "pending"] }, then: "Pending" },
              { case: { $eq: ["$_id", "failed"] }, then: "Failed" },
              { case: { $eq: ["$_id", "refunded"] }, then: "Refunded" },
            ],
            default: "$_id",
          },
        },
        value: 1,
      },
    },
  ]);

  // 5. Shipping Method Distribution
  const shippingMethodDistribution = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$shippingMethod",
        value: { $sum: 1 },
      },
    },
    {
      $project: {
        name: {
          $switch: {
            branches: [
              { case: { $eq: ["$_id", "standard"] }, then: "Standard" },
              { case: { $eq: ["$_id", "express"] }, then: "Express" },
              { case: { $eq: ["$_id", "overnight"] }, then: "Overnight" },
            ],
            default: "$_id",
          },
        },
        value: 1,
      },
    },
  ]);

  // 6. Order Amount Distribution

  const highestOrder = await Order.findOne().sort({ totalAmount: -1 });
  console.log(highestOrder);
  const orderAmountDistribution = await Order.aggregate([
    { $match: matchStage },

    {
      $bucket: {
        groupBy: "$totalAmount",
        boundaries: [
          0,
          1000,
          3000,
          5000,
          10000,
          20000,
          50000,
          100000,
          150000,
          200000,
          highestOrder?.totalAmount,
          Infinity,
        ],
        default: "Other",
        output: {
          orders: { $sum: 1 },
        },
      },
    },

    // Convert bucket _id (number) → readable range label
    {
      $addFields: {
        range: {
          $switch: {
            branches: [
              { case: { $eq: ["$_id", 0] }, then: "0 - 999" },
              { case: { $eq: ["$_id", 1000] }, then: "1000 - 2999" },
              { case: { $eq: ["$_id", 3000] }, then: "3000 - 4999" },
              { case: { $eq: ["$_id", 5000] }, then: "5000 - 9999" },
              { case: { $eq: ["$_id", 10000] }, then: "10000 - 19999" },
              { case: { $eq: ["$_id", 20000] }, then: "20000 - 49999" },
              { case: { $eq: ["$_id", 50000] }, then: "50000 - 99999" },
              { case: { $eq: ["$_id", 100000] }, then: "50000 - 149999" },
              { case: { $eq: ["$_id", 150000] }, then: "150000 - 199999" },
              { case: { $eq: ["$_id", 200000] }, then: "200000 - 219999" },
              {
                case: { $eq: ["$_id", 210000] },
                then: `210000 - ${highestOrder?.totalAmount}`,
              },
            ],
            default: "Other",
          },
        },
      },
    },

    // Final projection - make sure to include all needed fields
    {
      $project: {
        _id: 0,
        range: 1,
        orders: 1,
      },
    },

    { $sort: { _id: 1 } }, // sort by bucket order
  ]);

  // 7. Top Selling Products
  const topProducts = await Order.aggregate([
    { $match: matchStage },
    { $unwind: "$items" },

    {
      $group: {
        _id: "$items.productId",
        sales: { $sum: "$items.quantity" },
        revenue: {
          $sum: { $multiply: ["$items.quantity", "$items.finalPrice"] },
        },
      },
    },

    // Lookup actual product name from Product collection
    {
      $lookup: {
        from: "products", // your collection name
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },

    {
      $project: {
        name: "$product.name",
        sales: 1,
        revenue: 1,
      },
    },

    { $sort: { sales: -1 } },
    { $limit: 5 },
  ]);

  return {
    monthlyStats: fullMonthlyStats,
    orderStatusDistribution,
    paymentMethodDistribution,
    paymentStatusDistribution,
    shippingMethodDistribution,
    orderAmountDistribution,
    topProducts,
    overview,
  };
};

export const DashboardService = {
  getDashboardAnalyticsFromDB,
};
