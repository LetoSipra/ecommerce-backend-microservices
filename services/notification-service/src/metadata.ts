/* eslint-disable */
export default async () => {
    const t = {};
    return { "@nestjs/swagger": { "models": [[import("./notification/dto/create-notification.dto"), { "CreateNotificationDto": { channel: { required: true, type: () => String }, type: { required: true, type: () => String, default: "ORDER_PLACED" }, recipient: { required: true, type: () => String, default: "user@example.com", format: "email" }, userId: { required: false, type: () => String }, payload: { required: true, type: () => Object }, template: { required: false, type: () => String } } }]], "controllers": [[import("./notification/notification.controller"), { "NotificationController": { "enqueue": {}, "findAll": {} } }]] } };
};