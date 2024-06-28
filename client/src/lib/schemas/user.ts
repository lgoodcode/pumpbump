import { z } from "zod";

export enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
}

export const loginFormSchema = z.object({
  username: z.string({
    required_error: "Please enter your username",
  }),
  password: z.string({
    required_error: "Please enter your password",
  }),
});

const baseRegisterUserFormSchema = z.object({
  username: z
    .string({
      required_error: "Please enter your username",
    })
    .min(4, "Username must contain at least 4 characters")
    .max(50, "Username is too long"),
  email: z.optional(
    z.string().email({
      message: "Please enter a valid email",
    }).or(z.literal("")),
  ),
  password: z
    .string({
      required_error: "Please enter your password",
    })
    .min(8, "Password must contain at least 8 characters")
    .max(50, "Password is too long")
    .refine((value) => /[a-z]+/.test(value), {
      message: "Password must contain at least one lowercase letter",
    })
    .refine((value) => /[A-Z]+/.test(value), {
      message: "Password must contain at least one uppercase letter",
    })
    .refine((value) => /[0-9]+/.test(value), {
      message: "Password must contain at least one number",
    })
    .refine((value) => /[!@#$%&'*+/=?^_`{|}~-]+/.test(value), {
      message: "Password must contain at least one special character",
    }),
  confirm_password: z.string({
    required_error: "Confirm your confirm your password",
  }),
});

export const registerUserFormSchema = baseRegisterUserFormSchema
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_new_password"],
  });

export type LoginForm = z.infer<typeof loginFormSchema>;

export type RegisterUserForm = z.infer<typeof registerUserFormSchema>;
