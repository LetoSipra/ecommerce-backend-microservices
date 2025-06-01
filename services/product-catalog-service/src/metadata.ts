/* eslint-disable */
export default async () => {
    const t = {};
    return { "@nestjs/swagger": { "models": [[import("./categories/dto/create-category.dto"), { "CreateCategoryDto": { name: { required: true, type: () => String }, description: { required: false, type: () => String } } }], [import("./categories/dto/update-category.dto"), { "UpdateCategoryDto": {} }], [import("./categories/entities/category.entity"), { "Category": {} }]], "controllers": [[import("./categories/categories.controller"), { "CategoriesController": { "create": {}, "findAll": {}, "findOne": { type: Object }, "update": {}, "remove": {} } }]] } };
};