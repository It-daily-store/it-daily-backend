import { z } from "zod";

const createBrandValidationSchema = z.object({
    name: z.string({ required_error: 'Brand name is required', invalid_type_error: 'Brand name should be string' }),
    image: z.string().optional(),
})

const updateBrandValidationSchema = z.object({
    name: z.string({ required_error: 'Brand name is required', invalid_type_error: 'Brand name should be string' }).optional(),
    image: z.string().optional(),
    isActive: z.boolean().optional()
})


export const BrandValidationSchema = {
    createBrandValidationSchema,
    updateBrandValidationSchema
}