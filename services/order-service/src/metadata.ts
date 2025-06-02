/* eslint-disable */
export default async () => {
    const t = {
        ["./order/dto/create-order-item.dto"]: await import("./order/dto/create-order-item.dto")
    };
    return { "@nestjs/swagger": { "models": [[import("./order/dto/create-order-item.dto"), { "CreateOrderItemDto": { productId: { required: true, type: () => String, format: "uuid" }, quantity: { required: true, type: () => Number, minimum: 1 }, price: { required: true, type: () => Number } } }], [import("./order/dto/create-order.dto"), { "CreateOrderDto": { userId: { required: true, type: () => String, format: "uuid" }, items: { required: true, type: () => [t["./order/dto/create-order-item.dto"].CreateOrderItemDto] } } }], [import("./order/dto/update-order.dto"), { "UpdateOrderDto": { status: { required: false, type: () => Object } } }]], "controllers": [[import("./order/order.controller"), { "OrderController": { "create": { type: Object }, "findAll": { type: [Object] }, "findOne": { type: Object }, "update": {}, "remove": {} } }]] } };
};