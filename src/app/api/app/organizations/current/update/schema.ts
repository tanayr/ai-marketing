import { z } from "zod";

const updateOrganizationSchema = z.object({
  name: z.string().min(2, {
    message: "Organization name must be at least 2 characters.",
  }),
});

export default updateOrganizationSchema;

export type UpdateOrganizationSchema = z.infer<typeof updateOrganizationSchema>;
