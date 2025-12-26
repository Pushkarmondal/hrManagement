import {z} from "zod"

export const employeeSchema = z.object({
    name: z.string(),
    email: z.email(),
    
})

