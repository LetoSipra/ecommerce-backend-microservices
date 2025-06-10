/* eslint-disable */
export default async () => {
    const t = {};
    return { "@nestjs/swagger": { "models": [[import("./cart/dto/add-cart-item.dto"), { "AddCartItemDto": { productId: { required: true, type: () => String, format: "uuid" }, quantity: { required: true, type: () => Number, minimum: 1 } } }]], "controllers": [[import("./cart/cart.controller"), { "CartController": { "getCartByUser": { type: Object }, "addOrUpdateItem": {}, "removeItem": {}, "clearCart": {} } }], [import("./health/health.controller"), { "HealthController": { "check": { type: Object } } }]] } };
};