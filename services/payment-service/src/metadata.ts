/* eslint-disable */
export default async () => {
    const t = {};
    return { "@nestjs/swagger": { "models": [[import("./payment/dto/create-payment.dto"), { "CreatePaymentDto": { orderId: { required: true, type: () => String, format: "uuid" }, amount: { required: true, type: () => Number }, customerId: { required: false, type: () => String }, receiptUrl: { required: false, type: () => String } } }], [import("./payment/dto/update-payment.dto"), { "UpdatePaymentDto": {} }]], "controllers": [[import("./payment/payment.controller"), { "PaymentController": { "create": {}, "confirm": {}, "findAll": {}, "findOne": {}, "update": {}, "remove": {} } }], [import("./health/health.controller"), { "HealthController": { "check": { type: Object } } }]] } };
};